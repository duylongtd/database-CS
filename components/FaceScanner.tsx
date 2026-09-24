"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CAMERA_ERROR_TEXT, CameraError, frameBrightness, openCamera, stopStream } from "@/lib/face/camera";
import {
  averageDescriptor,
  detectFaces,
  euclidean,
  eyeAspectRatio,
  headYaw,
  loadFaceEngine,
  round,
} from "@/lib/face/engine";

export type FaceScanResult = { samples: number[][]; descriptor: number[] };

type Phase = "idle" | "loading" | "scanning" | "done" | "error";
type Step = "align" | "liveness" | "capture";
type ErrorState = { title: string; hint: string; canRetry: boolean };

type Props = {
  mode: "enroll" | "verify";
  onComplete: (r: FaceScanResult) => void;
  onFallback?: () => void;
  fallbackLabel?: string;
  autoStart?: boolean;
};

const SCAN_TIMEOUT_MS = 45_000;
const DARK_THRESHOLD = 22; // gần như đen → camera bị che
const DIM_THRESHOLD = 55;

export default function FaceScanner({ mode, onComplete, onFallback, fallbackLabel, autoStart }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runIdRef = useRef(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState<Step>("align");
  const [hint, setHint] = useState("Đặt khuôn mặt vào giữa khung");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<ErrorState | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stop = useCallback(() => {
    runIdRef.current++;
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const fail = useCallback(
    (e: ErrorState) => {
      stop();
      setError(e);
      setPhase("error");
    },
    [stop],
  );

  const start = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    stop();
    const runId = ++runIdRef.current;
    const alive = () => runId === runIdRef.current;
    setError(null);
    setPhase("loading");
    setStep("align");
    setProgress(0);
    setHint("Đang khởi động camera…");

    let faceapi: Awaited<ReturnType<typeof loadFaceEngine>>;
    try {
      // Mở camera và tải model song song để giảm thời gian chờ.
      const [stream, api] = await Promise.all([openCamera(video), loadFaceEngine()]);
      if (!alive()) return stopStream(stream);
      streamRef.current = stream;
      faceapi = api;
      stream.getVideoTracks().forEach((t) =>
        t.addEventListener("ended", () => {
          if (alive()) fail({ ...CAMERA_ERROR_TEXT.ended, canRetry: true });
        }),
      );
    } catch (e) {
      if (!alive()) return;
      if (e instanceof CameraError) {
        const txt = CAMERA_ERROR_TEXT[e.code];
        fail({ ...txt, canRetry: e.code !== "insecure" && e.code !== "unsupported" && e.code !== "not-found" });
      } else {
        fail({ title: "Không tải được mô-đun nhận diện", hint: "Kiểm tra kết nối mạng rồi thử lại, hoặc dùng Google.", canRetry: true });
      }
      return;
    }

    setPhase("scanning");
    setHint("Đặt khuôn mặt vào giữa khung");
    canvasRef.current ??= document.createElement("canvas");
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;
    let inputSize = coarse ? 224 : 320;
    const startedAt = performance.now();
    let darkSince = 0;
    let frame = 0;
    const frontal: Float32Array[] = [];
    let lastCapture = 0;
    let anchor: Float32Array | null = null;
    let earOpen = 0;
    let eyesClosed = false;
    let livenessAt = 0;
    let turnMode = false;
    let baseYaw = 0; // góc nhìn "thẳng" riêng của từng người/camera (camera laptop thường lệch)
    let live = false;
    const needFrontal = mode === "enroll" ? 3 : 2;

    const finish = (extra: Float32Array | null) => {
      const all = extra ? [...frontal, extra] : frontal;
      // Các mẫu phải cùng một người (tránh đổi người/ảnh giữa chừng).
      for (let i = 0; i < all.length; i++)
        for (let j = i + 1; j < all.length; j++)
          if (euclidean(all[i], all[j]) > 0.55) {
            frontal.length = 0;
            anchor = null;
            live = false;
            setStep("align");
            setProgress(0);
            setHint("Phát hiện thay đổi khuôn mặt – quét lại từ đầu");
            return false;
          }
      const samples = all.map(round);
      const descriptor = round(averageDescriptor(all));
      stop();
      setPhase("done");
      setProgress(1);
      setHint(mode === "enroll" ? "Đã ghi nhận khuôn mặt" : "Đã xác thực khuôn mặt");
      onCompleteRef.current({ samples: mode === "enroll" ? [...samples, descriptor] : [descriptor], descriptor });
      return true;
    };

    const tick = async () => {
      if (!alive()) return;
      if (document.hidden) return void setTimeout(tick, 300);
      if (performance.now() - startedAt > SCAN_TIMEOUT_MS) {
        if (frontal.length >= needFrontal && !live) {
          return fail({
            title: "Chưa xác nhận được người thật",
            hint: "Hãy chớp mắt hoặc quay nhẹ đầu khi được yêu cầu. Ảnh chụp và video quay sẵn không được chấp nhận.",
            canRetry: true,
          });
        }
        return fail({
          title: "Hết thời gian quét",
          hint: "Không nhận diện được khuôn mặt rõ ràng. Hãy ra chỗ đủ sáng, bỏ khẩu trang/kính râm, hoặc dùng Google.",
          canRetry: true,
        });
      }
      if (video.readyState < 2 || !video.videoWidth) return void setTimeout(tick, 150);

      // Kiểm tra độ sáng mỗi 6 khung hình
      if (frame++ % 6 === 0) {
        const b = frameBrightness(video, canvasRef.current!);
        if (b < DARK_THRESHOLD) {
          darkSince ||= performance.now();
          if (performance.now() - darkSince > 2500) {
            return fail({
              title: "Camera có vẻ đang bị che",
              hint: "Hình ảnh gần như tối đen. Hãy mở nắp/miếng che camera, hoặc đăng nhập bằng Google.",
              canRetry: true,
            });
          }
          setHint("Camera quá tối hoặc bị che");
          return void setTimeout(tick, 200);
        }
        darkSince = 0;
        if (b < DIM_THRESHOLD) setHint("Thiếu sáng – hãy quay mặt về phía nguồn sáng");
      }

      const t0 = performance.now();
      let faces;
      try {
        faces = await detectFaces(faceapi, video, inputSize);
      } catch {
        return void setTimeout(tick, 250); // lỗi tạm thời của GPU/khung hình → bỏ qua
      }
      if (!alive()) return;
      const cost = performance.now() - t0;
      if (cost > 700 && inputSize > 224) inputSize -= 32; // thiết bị yếu → giảm kích thước đầu vào (không xuống dưới 224 để vẫn bắt được mặt)

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const next = () => setTimeout(tick, 60);

      if (faces.length === 0) {
        setHint(frontal.length >= needFrontal ? "Giữ khuôn mặt trong khung" : "Đặt khuôn mặt vào giữa khung");
        return void next();
      }
      if (faces.length > 1) {
        setHint("Phát hiện nhiều khuôn mặt – chỉ một người trong khung");
        return void next();
      }
      const f = faces[0];
      const ratio = f.box.width / vw;
      const cx = (f.box.x + f.box.width / 2) / vw - 0.5;
      const cy = (f.box.y + f.box.height / 2) / vh - 0.5;
      if (ratio < 0.2) return void (setHint("Lại gần camera hơn một chút"), next());
      if (ratio > 0.8) return void (setHint("Lùi ra xa một chút"), next());
      if (Math.abs(cx) > 0.22 || Math.abs(cy) > 0.25) return void (setHint("Đưa khuôn mặt vào giữa khung"), next());
      if (f.score < 0.5) return void (setHint("Giữ yên, nhìn thẳng vào camera"), next());

      const yaw = headYaw(f.landmarks);
      const ear = eyeAspectRatio(f.landmarks);
      const now = performance.now();

      // Bước 1: thu mẫu chính diện
      if (frontal.length < needFrontal) {
        if (Math.abs(yaw) > 0.38) return void (setHint("Nhìn thẳng vào camera"), next());
        if (anchor && euclidean(anchor, f.descriptor) > 0.55) {
          frontal.length = 0;
          anchor = null;
          setHint("Khuôn mặt thay đổi – bắt đầu lại");
          return void next();
        }
        if (now - lastCapture > 280) {
          frontal.push(f.descriptor);
          baseYaw = frontal.length === 1 ? yaw : baseYaw * 0.7 + yaw * 0.3;
          anchor ??= f.descriptor;
          lastCapture = now;
          earOpen = Math.max(earOpen, ear);
          setStep("align");
          setProgress((frontal.length / needFrontal) * 0.6);
          setHint("Giữ yên…");
        }
        if (frontal.length === needFrontal) {
          setStep("liveness");
          livenessAt = now;
          setHint("Chớp mắt một lần");
        }
        return void next();
      }

      // Bước 2: kiểm tra người thật – chớp mắt, hoặc quay đầu nếu không nhận được cái chớp mắt (vd: đeo kính)
      if (!live) {
        if (anchor && euclidean(anchor, f.descriptor) > 0.6) {
          frontal.length = 0;
          anchor = null;
          setStep("align");
          setProgress(0);
          setHint("Khuôn mặt thay đổi – bắt đầu lại");
          return void next();
        }
        earOpen = Math.max(earOpen * 0.98, ear);
        if (!turnMode) {
          // chớp mắt: EAR giảm mạnh so với lúc mở mắt rồi mở lại
          if (ear < Math.min(0.2, earOpen * 0.7)) eyesClosed = true;
          else if (eyesClosed && ear > earOpen * 0.85) live = true;
          if (!live && now - livenessAt > 6000) {
            turnMode = true;
            setHint("Quay nhẹ đầu sang trái hoặc phải");
          }
        } else if (Math.abs(yaw - baseYaw) > 0.35) {
          live = true;
        }
        setProgress(0.6 + Math.min(0.3, ((now - livenessAt) / 6000) * 0.3));
        if (live) setHint("Nhìn thẳng lại vào camera");
        return void next();
      }

      // Bước 3: mẫu chính diện cuối sau liveness
      if (Math.abs(yaw - baseYaw) > 0.3) return void (setHint("Nhìn thẳng lại vào camera"), next());
      setStep("capture");
      if (!finish(f.descriptor)) next();
    };
    tick();
  }, [fail, mode, stop]);

  // Tự dừng camera khi rời trang / tab ẩn quá lâu; dọn dẹp khi unmount.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && streamRef.current) {
        stop();
        setPhase("idle");
        setHint("Camera đã tạm dừng khi bạn rời tab. Bấm để tiếp tục.");
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", stop);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", stop);
      stop();
    };
  }, [stop]);

  useEffect(() => {
    if (autoStart) void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  // Tải trước model khi component xuất hiện (không mở camera).
  useEffect(() => {
    loadFaceEngine().catch(() => undefined);
  }, []);

  const R = 46;
  const C = 2 * Math.PI * R;
  const stepLabel =
    step === "align" ? "1/3 · Căn chỉnh" : step === "liveness" ? "2/3 · Kiểm tra người thật" : "3/3 · Hoàn tất";

  return (
    <div className="face">
      <div className={`face-stage face-${phase}`}>
        <video ref={videoRef} className="face-video" playsInline muted autoPlay aria-hidden />
        <svg className="face-ring" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r={R} className="face-ring-track" />
          <circle
            cx="50"
            cy="50"
            r={R}
            className="face-ring-progress"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
          />
        </svg>
        {phase !== "scanning" && (
          <div className="face-cover">
            {phase === "idle" && (
              <>
                <FaceGlyph />
                <p>Dữ liệu khuôn mặt được xử lý ngay trên thiết bị, không lưu ảnh.</p>
                <button className="btn btn-primary" onClick={start}>
                  {mode === "enroll" ? "Bắt đầu quét khuôn mặt" : "Quét Face ID"}
                </button>
              </>
            )}
            {phase === "loading" && (
              <>
                <span className="spinner" aria-hidden />
                <p>{hint}</p>
              </>
            )}
            {phase === "done" && (
              <>
                <span className="face-check" aria-hidden>
                  ✓
                </span>
                <p>{hint}</p>
              </>
            )}
            {phase === "error" && error && (
              <>
                <strong>{error.title}</strong>
                <p>{error.hint}</p>
                {error.canRetry && (
                  <button className="btn btn-secondary" onClick={start}>
                    Thử lại
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="face-meta" aria-live="polite">
        {phase === "scanning" && <span className="face-step">{stepLabel}</span>}
        {phase === "scanning" && <p className="face-hint">{hint}</p>}
      </div>

      {onFallback && (
        <button className="btn btn-ghost face-fallback" onClick={onFallback}>
          {fallbackLabel ?? "Camera không dùng được? Đăng nhập bằng Google"}
        </button>
      )}
    </div>
  );
}

function FaceGlyph() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
      <path d="M9 10v1M15 10v1M12 10v3.5h-1M9.5 16.5c1.4 1 3.6 1 5 0" strokeLinecap="round" />
    </svg>
  );
}
