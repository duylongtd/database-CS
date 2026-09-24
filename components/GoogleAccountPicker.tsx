"use client";

import { useEffect, useRef, useState } from "react";
import { DEMO_ACCOUNTS, GOOGLE_CLIENT_ID, type GoogleAccount, googleConfigured, loadGis, parseCredential } from "@/lib/google";
import { Modal } from "./ui";

type Props = {
  onPick: (a: GoogleAccount) => void;
  label?: string;
  /** Email cần loại trừ khỏi danh sách demo (đã liên kết tài khoản khác). */
  context?: "signin" | "signup";
};

export default function GoogleAccountPicker({ onPick, label = "Tiếp tục với Google", context = "signin" }: Props) {
  const real = googleConfigured();
  return real ? <RealGoogle onPick={onPick} context={context} /> : <DemoGoogle onPick={onPick} label={label} />;
}

function RealGoogle({ onPick, context }: Pick<Props, "onPick" | "context">) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const cb = useRef(onPick);
  cb.current = onPick;

  useEffect(() => {
    let cancelled = false;
    loadGis()
      .then((gis) => {
        if (cancelled || !ref.current) return;
        gis.initialize({
          client_id: GOOGLE_CLIENT_ID,
          auto_select: false, // luôn để người dùng tự chọn tài khoản
          cancel_on_tap_outside: true,
          ux_mode: "popup",
          itp_support: true,
          use_fedcm_for_button: true,
          context: context === "signup" ? "signup" : "signin",
          callback: (res: { credential?: string }) => {
            try {
              if (!res.credential) throw new Error("Không nhận được thông tin từ Google.");
              setError(null);
              cb.current(parseCredential(res.credential));
            } catch (e) {
              setError((e as Error).message);
            }
          },
        });
        const width = Math.min(360, ref.current.clientWidth || 320);
        gis.renderButton(ref.current, {
          type: "standard",
          theme: document.documentElement.dataset.theme === "dark" ? "filled_black" : "outline",
          size: "large",
          shape: "pill",
          text: context === "signup" ? "signup_with" : "continue_with",
          logo_alignment: "left",
          locale: "vi",
          width,
        });
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setError((e as Error).message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [context]);

  return (
    <div className="gpick">
      {loading && <div className="btn btn-secondary btn-block" aria-busy>Đang tải Google…</div>}
      <div ref={ref} className="gpick-slot" />
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function DemoGoogle({ onPick, label }: { onPick: Props["onPick"]; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-secondary btn-block gbtn" onClick={() => setOpen(true)}>
        <GoogleLogo /> {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Chọn tài khoản" width={420}>
        <p className="muted small">
          Chế độ demo – chưa cấu hình <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>. Email chỉ được chọn từ tài khoản
          Google, không nhập tay.
        </p>
        <ul className="acct-list">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email}>
              <button
                className="acct"
                onClick={() => {
                  setOpen(false);
                  onPick(a);
                }}
              >
                <span className="avatar">{a.name.split(" ").pop()?.[0]}</span>
                <span className="acct-text">
                  <strong>{a.name}</strong>
                  <span>{a.email}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}

export function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.8 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4 6.8-10 6.8-17.1z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C1 16.5 0 20.1 0 24s1 7.5 2.7 10.8l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.8 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}
