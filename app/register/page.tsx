"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth";
import AuthLayout from "@/components/AuthLayout";
import FaceScanner from "@/components/FaceScanner";
import GoogleAccountPicker from "@/components/GoogleAccountPicker";
import { bestMatch } from "@/lib/face/engine";
import type { GoogleAccount } from "@/lib/google";
import { DomainError, getState, registerUser, signIn, signOut, useStore } from "@/lib/store";

type Step = 1 | 2 | 3 | 4;
const STEPS = ["Đồng ý", "Face ID", "Tài khoản Google", "Cơ quan"];

const maskEmail = (e: string) => e.replace(/^(.{2}).*(@.*)$/, "$1***$2");

export default function RegisterPage() {
  const router = useRouter();
  const { hydrated, user } = useAuth();
  const orgs = useStore((s) => s.data.orgs);
  const [step, setStep] = useState<Step>(1);
  const [consent, setConsent] = useState(false);
  const [samples, setSamples] = useState<number[][] | null>(null);
  const [account, setAccount] = useState<GoogleAccount | null>(null);
  const [orgId, setOrgId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scanKey, setScanKey] = useState(0);
  const [cameraBlocked, setCameraBlocked] = useState(false);

  // Cảnh báo khi rời trang giữa chừng – dữ liệu khuôn mặt chưa được lưu
  useEffect(() => {
    if (step < 3) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [step]);

  if (hydrated && user) {
    return (
      <AuthLayout title="Bạn đã đăng nhập" subtitle={`Đang đăng nhập với ${user.email}.`}>
        <Link className="btn btn-primary btn-block" href="/">
          Về bản đồ dữ liệu
        </Link>
        <button className="btn btn-ghost btn-block" onClick={() => signOut()}>
          Đăng xuất để đăng ký tài khoản khác
        </button>
      </AuthLayout>
    );
  }

  const onFace = ({ samples }: { samples: number[][] }) => {
    const users = getState().data.users;
    // Chống 1 khuôn mặt đăng ký nhiều tài khoản
    for (const s of samples) {
      const m = bestMatch(s, users);
      if (m.kind === "match" || m.kind === "ambiguous") {
        const id = m.kind === "match" ? m.userId : m.userIds[0];
        const email = users.find((u) => u.id === id)?.email ?? "";
        setError(`Khuôn mặt này đã được đăng ký cho tài khoản ${maskEmail(email)}. Hãy đăng nhập thay vì đăng ký mới.`);
        setScanKey((k) => k + 1);
        return;
      }
    }
    setError(null);
    setSamples(samples);
    setStep(3);
  };

  const onGoogle = (a: GoogleAccount) => {
    const taken = getState().data.users.some((u) => u.email === a.email);
    if (taken) {
      setError(`Email ${a.email} đã liên kết với tài khoản khác. Hãy chọn email khác hoặc đăng nhập.`);
      return;
    }
    setError(null);
    setAccount(a);
  };

  const submit = () => {
    if (!samples || !account) return;
    try {
      const u = registerUser({
        email: account.email,
        name: account.name,
        picture: account.picture,
        faceSamples: samples,
        requestedOrgId: orgId || undefined,
      });
      signIn(u.id, "face");
      router.replace("/");
    } catch (e) {
      setError(e instanceof DomainError ? e.message : "Đăng ký thất bại, vui lòng thử lại.");
    }
  };

  const tier2 = orgs.filter((o) => o.kind !== "center");

  return (
    <AuthLayout title="Tạo tài khoản Mạch" subtitle="Khuôn mặt là chìa khoá chính. Email Google là chìa khoá dự phòng khi không dùng được camera.">
      <ol className="stepper" aria-label="Các bước đăng ký">
        {STEPS.map((s, i) => (
          <li key={s} className={step === i + 1 ? "is-current" : step > i + 1 ? "is-done" : ""} aria-current={step === i + 1 ? "step" : undefined}>
            <span>{step > i + 1 ? "✓" : i + 1}</span>
            <em>{s}</em>
          </li>
        ))}
      </ol>

      {error && (
        <div className="banner banner-danger" role="alert">
          {error}
          {error.includes("đăng nhập") && (
            <>
              {" "}
              <Link href="/login">Đến trang đăng nhập →</Link>
            </>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="stack">
          <ul className="checklist">
            <li>Hệ thống chỉ lưu vector đặc trưng khuôn mặt (128 số), không lưu ảnh.</li>
            <li>Mỗi khuôn mặt và mỗi email Google chỉ gắn với một tài khoản.</li>
            <li>Tài khoản mới cần Super Admin xác nhận cơ quan và cấp quyền xem chi tiết CSDL.</li>
          </ul>
          <label className="check">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>Tôi đồng ý cho hệ thống xử lý dữ liệu sinh trắc học khuôn mặt của tôi cho mục đích xác thực.</span>
          </label>
          <button className="btn btn-primary btn-block" disabled={!consent} onClick={() => setStep(2)}>
            Tiếp tục
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="stack">
          <FaceScanner
            key={scanKey}
            mode="enroll"
            onComplete={onFace}
            onFallback={() => setCameraBlocked(true)}
            fallbackLabel="Không mở được camera?"
          />
          <p className="center xsmall muted">
            <Link href="/faceid-check">Kiểm tra camera & Face ID trên thiết bị này</Link>
          </p>
          {cameraBlocked && (
            <div className="banner banner-info">
              Đăng ký lần đầu <strong>bắt buộc</strong> quét khuôn mặt để chống giả mạo. Hãy mở trang này trên thiết bị có
              camera (điện thoại/laptop khác). Sau khi đăng ký, bạn có thể đăng nhập bằng Google trên thiết bị không có
              camera.
            </div>
          )}
          <p className="small muted">
            Mẹo: đứng nơi đủ sáng, tháo khẩu trang/kính râm, giữ điện thoại ngang tầm mắt. Nếu đeo kính cận, hệ thống sẽ
            chuyển sang yêu cầu quay nhẹ đầu.
          </p>
        </div>
      )}

      {step === 3 && (
        <div className="stack">
          <div className="banner banner-success">✓ Đã ghi nhận khuôn mặt ({samples?.length} mẫu).</div>
          <p className="muted">Chọn tài khoản Google để làm email liên kết. Email không thể nhập tay.</p>
          {account ? (
            <div className="acct is-static">
              {account.picture ? <img className="avatar" src={account.picture} alt="" referrerPolicy="no-referrer" /> : <span className="avatar">{account.name.split(" ").pop()?.[0]}</span>}
              <span className="acct-text">
                <strong>{account.name}</strong>
                <span>{account.email}</span>
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setAccount(null)}>
                Đổi
              </button>
            </div>
          ) : (
            <GoogleAccountPicker onPick={onGoogle} context="signup" label="Chọn tài khoản Google" />
          )}
          <div className="row between">
            <button className="btn btn-ghost" onClick={() => { setSamples(null); setAccount(null); setStep(2); }}>
              Quét lại khuôn mặt
            </button>
            <button className="btn btn-primary" disabled={!account} onClick={() => setStep(4)}>
              Tiếp tục
            </button>
          </div>
        </div>
      )}

      {step === 4 && account && (
        <div className="stack">
          <label className="field">
            <span>Họ và tên (lấy từ Google)</span>
            <input value={account.name} readOnly />
          </label>
          <label className="field">
            <span>Cơ quan công tác</span>
            <select value={orgId} onChange={(e) => setOrgId(e.target.value)}>
              <option value="">— Chọn sau / không thuộc cơ quan nào —</option>
              {tier2.map((o) => (
                <optgroup key={o.id} label={o.name}>
                  <option value={o.id}>{o.name}</option>
                  {orgs
                    .filter((c) => c.parentId === o.id && c.kind === "center")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        ↳ {c.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <small className="muted">Super Admin sẽ xác nhận trước khi bạn được cấp quyền xem chi tiết.</small>
          </label>
          <div className="row between">
            <button className="btn btn-ghost" onClick={() => setStep(3)}>
              Quay lại
            </button>
            <button className="btn btn-primary" onClick={submit}>
              Hoàn tất đăng ký
            </button>
          </div>
        </div>
      )}

      <p className="center small">
        Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
      </p>
    </AuthLayout>
  );
}
