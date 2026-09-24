import Link from "next/link";
import type { ReactNode } from "react";
import { Logo, ThemeToggle } from "./AppShell";

export default function AuthLayout({ title, subtitle, children, aside }: { title: string; subtitle?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="auth">
      <header className="auth-top">
        <Link href="/" className="brand">
          <Logo />
          <span className="brand-text">
            <strong>CSDL Hà Tĩnh</strong>
          </span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="auth-main">
        <div className="auth-card">
          <h1 className="h-2xl">{title}</h1>
          {subtitle && <p className="muted lead">{subtitle}</p>}
          <div className="stack">{children}</div>
        </div>
        {aside}
      </main>
      <footer className="auth-foot small muted">
        Dữ liệu sinh trắc được xử lý trên thiết bị theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
      </footer>
    </div>
  );
}
