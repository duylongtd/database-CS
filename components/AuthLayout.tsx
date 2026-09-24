import Link from "next/link";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand";
import { ThemeToggle } from "./AppShell";
import { BrandIllustration, Wordmark } from "./brand";

/** Bố cục xác thực: bên trái kể câu chuyện thương hiệu (ẩn trên mobile), bên phải là biểu mẫu. */
export default function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth-story" aria-label="Giới thiệu">
        <Link href="/" className="brand-link">
          <Wordmark />
        </Link>
        <div className="auth-story-body">
          <p className="eyebrow">{BRAND.tagline}</p>
          <h2 className="story-title">
            Mỗi cơ quan là một đỉnh núi dữ liệu.
            <br />
            Mỗi kết nối là một nhánh sông.
          </h2>
          <BrandIllustration />
          <ol className="story-beats">
            {BRAND.story.map((b, i) => (
              <li key={b.key}>
                <span className="beat-n">0{i + 1}</span>
                <div>
                  <strong>{b.title}</strong>
                  <p>{b.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <p className="xsmall auth-story-foot">UBND tỉnh Hà Tĩnh · Hệ thống nội bộ</p>
      </aside>
      <div className="auth-side">
        <header className="auth-top">
          <Link href="/" className="brand-link auth-top-brand">
            <Wordmark sub={false} size={28} />
          </Link>
          <ThemeToggle />
        </header>
        <main className="auth-main">
          <div className="auth-card">
            <h1 className="h-2xl">{title}</h1>
            {subtitle && <p className="muted lead">{subtitle}</p>}
            <div className="stack">{children}</div>
          </div>
        </main>
        <footer className="auth-foot xsmall muted">
          Khuôn mặt được xử lý ngay trên thiết bị của bạn, không lưu ảnh – theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
        </footer>
      </div>
    </div>
  );
}
