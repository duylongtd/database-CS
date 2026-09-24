"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/AppShell";
import { Wordmark } from "@/components/brand";
import { CAMERA_ERROR_TEXT, CameraError, frameBrightness, openCamera, stopStream } from "@/lib/face/camera";
import { detectFaces, eyeAspectRatio, faceEngineInfo, headYaw, loadFaceEngine } from "@/lib/face/engine";
import { googleConfigured } from "@/lib/google";

type Check = { label: string; ok: boolean | null; detail: string };
type Live = {
  res: string;
  brightness: number;
  faces: number;
  score?: number;
  size?: number;
  yaw?: number;
  ear?: number;
  ms: number;
};

const IN_APP = /FBAN|FBAV|Instagram|Zalo|Line\/|MicroMessenger|TikTok/i;

/** Trang tự chẩn đoán Face ID – dùng khi kiểm thử UAT trên nhiều thiết bị. Không lưu dữ liệu nào. */
export default function FaceIdCheck() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<Live | null>(null);
  const [engine, setEngine] = useState<ReturnType<typeof faceEngineInfo> | null>(null);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runRef = useRef(0);

  useEffect(() => {
    (async () => {
      const out: Check[] = [];
      out.push({ label: "Kết nối an toàn (HTTPS)", ok: window.isSecureContext, detail: location.protocol + "//" + location.host });
      out.push({ label: "Trình duyệt hỗ trợ camera", ok: !!navigator.mediaDevices?.getUserMedia, detail: navigator.mediaDevices ? "mediaDevices có sẵn" : "Không có navigator.mediaDevices" });
      const inApp = IN_APP.test(navigator.userAgent);
      out.push({ label: "Không mở trong app (Zalo/Facebook…)", ok: !inApp, detail: inApp ? "Đang ở trình duyệt trong app – nên mở bằng Chrome/Safari" : "Trình duyệt thường" });
      let gl = false;
      try {
        const c = document.createElement("canvas");
        gl = !!(c.getContext("webgl2") || c.getContext("webgl"));
      } catch {}
      out.push({ label: "WebGL (tăng tốc GPU)", ok: gl, detail: gl ? "Có – nhận diện nhanh" : "Không – sẽ chạy bằng CPU (chậm hơn)" });
      let perm = "không xác định (trình duyệt không hỗ trợ truy vấn)";
      let permOk: boolean | null = null;
      try {
        const st = await navigator.permissions.query({ name: "camera" as PermissionName });
        perm = st.state === "granted" ? "đã cho phép" : st.state === "denied" ? "đã bị chặn – mở cài đặt trang để cho phép" : "sẽ hỏi khi quét";
        permOk = st.state !== "denied";
      } catch {}
      out.push({ label: "Quyền camera", ok: permOk, detail: perm });
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const cams = devs.filter((d) => d.kind === "videoinput").length;
        out.push({ label: "Số camera", ok: cams > 0, detail: `${cams} thiết bị` });
      } catch {
        out.push({ label: "Số camera", ok: null, detail: "Không liệt kê được" });
      }
      try {
        const r = await fetch("/models/tiny_face_detector_model-weights_manifest.json", { cache: "no-store" });
        out.push({ label: "Model nhận diện trên server", ok: r.ok, detail: r.ok ? "/models phục vụ đúng" : `HTTP ${r.status} – sẽ dùng CDN dự phòng` });
      } catch {
        out.push({ label: "Model nhận diện trên server", ok: false, detail: "Không tải được /models – sẽ dùng CDN dự phòng" });
      }
      let store = true;
      try {
        localStorage.setItem("hatinh-csdl:probe", "1");
        localStorage.removeItem("hatinh-csdl:probe");
      } catch {
        store = false;
      }
      out.push({ label: "Lưu trữ trình duyệt", ok: store, detail: store ? "localStorage hoạt động" : "Bị chặn (ẩn danh?) – tài khoản sẽ mất khi đóng tab" });
      out.push({ label: "Google Sign-In", ok: googleConfigured() ? true : null, detail: googleConfigured() ? "Đã cấu hình Client ID" : "Chưa cấu hình – đang dùng tài khoản demo" });
      setChecks(out);
    })();
    return () => {
      runRef.current++;
      stopStream(streamRef.current);
    };
  }, []);

  const start = async () => {
    const video = videoRef.current;
    if (!video) return;
    setError(null);
    setRunning(true);
    const id = ++runRef.current;
    try {
      const [stream, api] = await Promise.all([openCamera(video), loadFaceEngine()]);
      streamRef.current = stream;
      setEngine(faceEngineInfo());
      const probe = document.createElement("canvas");
      const loop = async () => {
        if (id !== runRef.current) return;
        const t0 = performance.now();
        const faces = await detectFaces(api, video, 320).catch(() => []);
        const ms = Math.round(performance.now() - t0);
        const f = faces[0];
        setLive({
          res: `${video.videoWidth}×${video.videoHeight}`,
          brightness: Math.round(frameBrightness(video, probe)),
          faces: faces.length,
          score: f?.score,
          size: f ? f.box.width / video.videoWidth : undefined,
          yaw: f ? headYaw(f.landmarks) : undefined,
          ear: f ? eyeAspectRatio(f.landmarks) : undefined,
          ms,
        });
        setEngine(faceEngineInfo());
        const cv = overlayRef.current;
        if (cv) {
          cv.width = video.videoWidth;
          cv.height = video.videoHeight;
          const ctx = cv.getContext("2d")!;
          ctx.clearRect(0, 0, cv.width, cv.height);
          ctx.lineWidth = 3;
          faces.forEach((x, i) => {
            ctx.strokeStyle = i === 0 ? "#1B8AD3" : "#FF5A6E";
            ctx.strokeRect(x.box.x, x.box.y, x.box.width, x.box.height);
            ctx.fillStyle = "#FF5A6E";
            x.landmarks.forEach((p) => ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3));
          });
        }
        setTimeout(loop, 80);
      };
      loop();
    } catch (e) {
      setRunning(false);
      if (e instanceof CameraError) setError(`${CAMERA_ERROR_TEXT[e.code].title}. ${CAMERA_ERROR_TEXT[e.code].hint}`);
      else setError((e as Error).message);
    }
  };

  const stop = () => {
    runRef.current++;
    stopStream(streamRef.current);
    setRunning(false);
  };

  const report = () =>
    JSON.stringify(
      {
        at: new Date().toISOString(),
        url: location.href,
        ua: navigator.userAgent,
        screen: `${screen.width}×${screen.height} @${devicePixelRatio}x`,
        checks: checks.map((c) => ({ [c.label]: c.ok, detail: c.detail })),
        engine,
        live,
        error,
      },
      null,
      2,
    );

  const pct = (v?: number) => (v == null ? "—" : `${Math.round(v * 100)}%`);
  const num = (v?: number, d = 2) => (v == null ? "—" : v.toFixed(d));
  const verdict = !live
    ? null
    : live.faces === 0
      ? "Chưa thấy khuôn mặt. Đưa mặt vào giữa khung, đủ sáng."
      : live.faces > 1
        ? "Có nhiều khuôn mặt – chỉ để một người trong khung."
        : (live.size ?? 0) < 0.2
          ? "Khuôn mặt hơi nhỏ – lại gần camera hơn."
          : live.brightness < 55
            ? "Thiếu sáng – quay mặt về phía nguồn sáng."
            : "Tốt. Thiết bị này sẵn sàng cho Face ID. Hãy thử chớp mắt – chỉ số EAR sẽ giảm rõ rệt.";

  return (
    <div className="brandpage">
      <header className="topbar">
        <Link href="/" className="brand-link">
          <Wordmark />
        </Link>
        <div className="topbar-right">
          <Link href="/login" className="btn btn-ghost btn-sm">
            Đăng nhập
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="container stack-lg narrow-page">
        <header className="stack">
          <p className="eyebrow">Kiểm thử UAT</p>
          <h1 className="h-2xl">Kiểm tra Face ID trên thiết bị này</h1>
          <p className="muted">
            Trang này không lưu gì. Dùng nó để biết vì sao Face ID chạy hoặc không chạy trên một điện thoại/máy tính cụ thể, rồi gửi
            báo cáo cho đội phát triển.
          </p>
        </header>

        <ul className="check-report card">
          {checks.length === 0 && <li className="muted">Đang kiểm tra…</li>}
          {checks.map((c) => (
            <li key={c.label}>
              <span className={`dot ${c.ok === true ? "ok" : c.ok === false ? "bad" : "unk"}`} aria-hidden />
              <strong>{c.label}</strong>
              <span className="muted small">{c.detail}</span>
            </li>
          ))}
        </ul>

        <section className="card stack">
          <div className="row between wrap">
            <h2 className="h-lg">Camera & nhận diện trực tiếp</h2>
            {running ? (
              <button className="btn btn-secondary" onClick={stop}>
                Dừng
              </button>
            ) : (
              <button className="btn btn-primary" onClick={start}>
                Bật camera
              </button>
            )}
          </div>
          {error && <div className="banner banner-danger">{error}</div>}
          <div className="diag-stage">
            <video ref={videoRef} playsInline muted autoPlay />
            <canvas ref={overlayRef} />
            {!running && <span className="muted small">Camera đang tắt</span>}
          </div>
          {verdict && <div className={`banner ${verdict.startsWith("Tốt") ? "banner-success" : "banner-info"}`}>{verdict}</div>}
          <dl className="kv">
            <dt>Backend</dt>
            <dd>{engine?.backend || "—"}</dd>
            <dt>Nguồn model</dt>
            <dd>{engine?.modelSource || "—"}</dd>
            <dt>Thời gian tải model</dt>
            <dd>{engine?.loadMs ? `${engine.loadMs} ms` : "—"}</dd>
            <dt>Độ phân giải</dt>
            <dd>{live?.res ?? "—"}</dd>
            <dt>Độ sáng (0–255)</dt>
            <dd>{live?.brightness ?? "—"}</dd>
            <dt>Số khuôn mặt</dt>
            <dd>{live?.faces ?? "—"}</dd>
            <dt>Độ tin cậy</dt>
            <dd>{pct(live?.score)}</dd>
            <dt>Kích thước mặt / khung</dt>
            <dd>{pct(live?.size)} (cần 20–80%)</dd>
            <dt>Góc quay đầu (yaw)</dt>
            <dd>{num(live?.yaw)} (nhìn thẳng ≈ 0)</dd>
            <dt>Độ mở mắt (EAR)</dt>
            <dd>{num(live?.ear)} (chớp mắt &lt; 0.2)</dd>
            <dt>Thời gian mỗi lần nhận diện</dt>
            <dd>{live ? `${live.ms} ms` : "—"}</dd>
          </dl>
        </section>

        <div className="row wrap">
          <button
            className="btn btn-secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(report());
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                window.prompt("Sao chép báo cáo:", report());
              }
            }}
          >
            {copied ? "Đã sao chép" : "Sao chép báo cáo"}
          </button>
          <Link href="/login" className="btn btn-ghost">
            Thử đăng nhập
          </Link>
        </div>
        <p className="small muted">
          Lưu ý bản UAT: tài khoản và dữ liệu khuôn mặt được lưu trong trình duyệt của từng thiết bị. Đăng ký trên điện thoại thì đăng
          nhập trên chính trình duyệt đó.
        </p>
      </main>
    </div>
  );
}
