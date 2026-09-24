/**
 * Đăng nhập Google phía client bằng Google Identity Services (GIS).
 * Email chỉ lấy từ tài khoản Google người dùng CHỌN – không có ô nhập tay.
 * Không có backend nên chỉ kiểm tra được các claim (aud/iss/exp/email_verified);
 * khi triển khai thật cần xác minh chữ ký ID token ở server.
 */

export type GoogleAccount = { email: string; name: string; picture?: string; sub: string; demo?: boolean };

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
export const googleConfigured = () => GOOGLE_CLIENT_ID.length > 0;

type GisId = {
  initialize: (cfg: Record<string, unknown>) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
  disableAutoSelect: () => void;
};
declare global {
  interface Window {
    google?: { accounts?: { id?: GisId } };
  }
}

let scriptPromise: Promise<GisId> | null = null;

export function loadGis(timeoutMs = 10000): Promise<GisId> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<GisId>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    const t = setTimeout(() => reject(new Error("Tải Google Sign-In quá lâu (mạng chậm hoặc bị chặn).")), timeoutMs);
    s.onload = () => {
      clearTimeout(t);
      const id = window.google?.accounts?.id;
      if (id) resolve(id);
      else reject(new Error("Google Sign-In không khả dụng."));
    };
    s.onerror = () => {
      clearTimeout(t);
      reject(new Error("Không tải được Google Sign-In – có thể do trình chặn quảng cáo hoặc mạng nội bộ chặn accounts.google.com."));
    };
    document.head.appendChild(s);
  }).catch((e) => {
    scriptPromise = null;
    throw e;
  });
  return scriptPromise;
}

/** Giải mã payload JWT (base64url, hỗ trợ tên tiếng Việt UTF-8). */
function decodeJwt(token: string): Record<string, unknown> {
  const part = token.split(".")[1];
  if (!part) throw new Error("ID token không hợp lệ.");
  const b64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function parseCredential(credential: string): GoogleAccount {
  const p = decodeJwt(credential);
  if (p.aud !== GOOGLE_CLIENT_ID) throw new Error("Token không dành cho ứng dụng này.");
  if (p.iss !== "accounts.google.com" && p.iss !== "https://accounts.google.com") throw new Error("Nguồn token không hợp lệ.");
  if (typeof p.exp !== "number" || p.exp * 1000 < Date.now()) throw new Error("Token đã hết hạn – vui lòng thử lại.");
  if (p.email_verified !== true) throw new Error("Email Google chưa được xác minh.");
  return {
    email: String(p.email).toLowerCase(),
    name: String(p.name ?? p.email),
    picture: typeof p.picture === "string" ? p.picture : undefined,
    sub: String(p.sub),
  };
}

/** Tài khoản mẫu cho chế độ demo khi chưa cấu hình Client ID. */
export const DEMO_ACCOUNTS: GoogleAccount[] = [
  { email: "quantri.hatinh@gmail.com", name: "Quản trị hệ thống", sub: "demo-1", demo: true },
  { email: "nguyenvanan.skhcn@gmail.com", name: "Nguyễn Văn An", sub: "demo-2", demo: true },
  { email: "tranthibinh.stc@gmail.com", name: "Trần Thị Bình", sub: "demo-3", demo: true },
  { email: "lequangcuong.syte@gmail.com", name: "Lê Quang Cường", sub: "demo-4", demo: true },
  { email: "phamthidung.snnmt@gmail.com", name: "Phạm Thị Dung", sub: "demo-5", demo: true },
];
