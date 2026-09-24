"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { canManage } from "@/lib/access";
import { checkSession, signOut, touchSession, useStore } from "@/lib/store";
import type { User } from "@/lib/types";

const REASON_TEXT = {
  expired: "Phiên đăng nhập đã hết hạn (8 giờ). Vui lòng đăng nhập lại.",
  idle: "Bạn đã không thao tác trong 30 phút nên phiên đã được đóng để bảo mật.",
  locked: "Tài khoản của bạn đã bị khoá bởi quản trị viên.",
  deleted: "Tài khoản không còn tồn tại.",
} as const;
export const reasonText = (r: string | null) => (r && r in REASON_TEXT ? REASON_TEXT[r as keyof typeof REASON_TEXT] : null);

/** Trạng thái phiên – tự đánh giá lại theo thời gian và khi dữ liệu thay đổi (vd: bị khoá ở tab khác). */
export function useAuth() {
  const state = useStore((s) => s);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 20_000);
    return () => clearInterval(t);
  }, []);
  const res = checkSession(state, now);
  return { hydrated: state.hydrated, user: res.user, reason: res.reason, hasSession: !!state.session };
}

export function RequireAuth({ children, admin }: { children: (user: User) => ReactNode; admin?: boolean }) {
  const { hydrated, user, reason, hasSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Ghi nhận hoạt động để gia hạn idle timeout
  useEffect(() => {
    if (!user) return;
    const onAct = () => touchSession();
    const evs = ["pointerdown", "keydown", "wheel", "touchstart"];
    evs.forEach((e) => window.addEventListener(e, onAct, { passive: true }));
    return () => evs.forEach((e) => window.removeEventListener(e, onAct));
  }, [user]);

  useEffect(() => {
    if (!hydrated || user) return;
    if (hasSession) signOut(); // phiên hỏng/hết hạn → xoá
    const q = new URLSearchParams({ next: pathname });
    if (reason) q.set("reason", reason);
    router.replace(`/login?${q}`);
  }, [hydrated, user, reason, hasSession, router, pathname]);

  if (!hydrated || !user) {
    return (
      <div className="page-center">
        <span className="spinner" aria-label="Đang tải" />
      </div>
    );
  }
  if (admin && !canManage(user)) {
    return (
      <div className="page-center">
        <div className="card narrow center">
          <h1 className="h-xl">Không có quyền truy cập</h1>
          <p className="muted">Trang quản trị chỉ dành cho Super Admin.</p>
          <a className="btn btn-primary" href="/">
            Về bản đồ dữ liệu
          </a>
        </div>
      </div>
    );
  }
  return <>{children(user)}</>;
}
