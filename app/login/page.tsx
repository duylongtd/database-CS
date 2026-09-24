"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { reasonText, useAuth } from "@/components/auth";
import AuthLayout from "@/components/AuthLayout";
import FaceScanner from "@/components/FaceScanner";
import GoogleAccountPicker from "@/components/GoogleAccountPicker";
import { bestMatch } from "@/lib/face/engine";
import { MAX_FAILS, lockRemainingMs, registerFail, resetFails } from "@/lib/face/lockout";
import type { GoogleAccount } from "@/lib/google";
import { DomainError, getState, signIn } from "@/lib/store";

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}

/** Chỉ cho phép chuyển hướng nội bộ (chống open-redirect qua ?next=). */
const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/login") ? n : "/");

function Login() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = safeNext(sp.get("next"));
  const { hydrated, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showGoogle, setShowGoogle] = useState(false);
  const [lockMs, setLockMs] = useState(0);
  const [scanKey, setScanKey] = useState(0);
  const [notice] = useState(() => reasonText(sp.get("reason")));
  const noUsers = hydrated && getState().data.users.length === 0;

  useEffect(() => {
    if (hydrated && user) router.replace(next);
  }, [hydrated, user, next, router]);

  useEffect(() => {
    setLockMs(lockRemainingMs());
    const t = setInterval(() => setLockMs(lockRemainingMs()), 1000);
    return () => clearInterval(t);
  }, []);

  const finish = (userId: string, method: "face" | "google") => {
    try {
      signIn(userId, method);
      resetFails();
      router.replace(next);
    } catch (e) {
      setError(e instanceof DomainError ? e.message : "Không thể đăng nhập.");
    }
  };

  const onFace = ({ descriptor }: { descriptor: number[] }) => {
    const users = getState().data.users;
    const m = bestMatch(descriptor, users);
    if (m.kind === "match") {
      const u = users.find((x) => x.id === m.userId)!;
      if (u.status !== "active") {
        setError("Tài khoản của bạn đã bị khoá. Liên hệ Super Admin.");
        return;
      }
      return finish(u.id, "face");
    }
    if (m.kind === "ambiguous") {
      setError("Khuôn mặt khớp với nhiều hơn một tài khoản. Để an toàn, vui lòng đăng nhập bằng Google.");
      setShowGoogle(true);
      return;
    }
    const r = registerFail();
    if (r.until > Date.now()) {
      setError("Quét thất bại quá nhiều lần. Face ID tạm khoá 60 giây – bạn có thể đăng nhập bằng Google.");
      setShowGoogle(true);
    } else {
      setError(`Không tìm thấy tài khoản khớp khuôn mặt (lần ${r.fails}/${MAX_FAILS}). Hãy thử lại ở nơi đủ sáng, hoặc đăng ký nếu bạn chưa có tài khoản.`);
    }
  };

  const onGoogle = (a: GoogleAccount) => {
    const u = getState().data.users.find((x) => x.email === a.email);
    if (!u) {
      setError(`Email ${a.email} chưa được đăng ký. Tài khoản mới bắt buộc đăng ký bằng Face ID trước.`);
      return;
    }
    if (u.status !== "active") {
      setError("Tài khoản của bạn đã bị khoá. Liên hệ Super Admin.");
      return;
    }
    finish(u.id, "google");
  };

  const locked = lockMs > 0;

  return (
    <AuthLayout title="Đăng nhập" subtitle="Xác thực bằng khuôn mặt để truy cập bản đồ cơ sở dữ liệu của tỉnh.">
      {notice && <div className="banner banner-info">{notice}</div>}
      {noUsers && (
        <div className="banner banner-info">
          Chưa có tài khoản nào trên hệ thống. <Link href="/register">Đăng ký tài khoản đầu tiên</Link> (sẽ là Super Admin).
        </div>
      )}
      {error && (
        <div className="banner banner-danger" role="alert">
          {error}
        </div>
      )}

      {locked ? (
        <div className="card center">
          <strong>Face ID tạm khoá</strong>
          <p className="muted">Thử lại sau {Math.ceil(lockMs / 1000)} giây hoặc dùng Google.</p>
        </div>
      ) : (
        <FaceScanner
          key={scanKey}
          mode="verify"
          onComplete={(r) => {
            setError(null);
            onFace(r);
            setScanKey((k) => k + 1);
          }}
          onFallback={() => setShowGoogle(true)}
        />
      )}

      {(showGoogle || locked) && (
        <div className="stack">
          <div className="divider">
            <span>hoặc</span>
          </div>
          <GoogleAccountPicker onPick={onGoogle} label="Đăng nhập bằng Google" />
          <p className="small muted center">Chỉ dùng được email Google đã liên kết khi đăng ký.</p>
        </div>
      )}

      <p className="center small">
        Chưa có tài khoản? <Link href="/register">Đăng ký bằng Face ID</Link>
      </p>
    </AuthLayout>
  );
}
