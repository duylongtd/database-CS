"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { canManage } from "@/lib/access";
import { signOut, useStore } from "@/lib/store";
import { ROLE_LABEL, type User } from "@/lib/types";
import { Icon } from "./ui";

export default function AppShell({ user, children, flush }: { user: User; children: ReactNode; flush?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const storageError = useStore((s) => s.storageError);
  const org = useStore((s) => s.data.orgs.find((o) => o.id === user.orgId));
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  const nav = [
    { href: "/", label: "Bản đồ dữ liệu" },
    ...(canManage(user) ? [{ href: "/admin", label: "Quản trị" }] : []),
    { href: "/design", label: "Design system" },
    { href: "/profile", label: "Tài khoản" },
  ];

  return (
    <div className={`shell${flush ? " shell-flush" : ""}`}>
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Trang chủ">
          <Logo />
          <span className="brand-text">
            <strong>CSDL Hà Tĩnh</strong>
            <span className="hide-sm">Bản đồ cơ sở dữ liệu các cơ quan</span>
          </span>
        </Link>
        <nav className="nav" aria-label="Điều hướng chính">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={pathname === n.href ? "is-active" : ""} aria-current={pathname === n.href ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="topbar-right">
          <ThemeToggle />
          <div className="usermenu" ref={menuRef}>
            <button className="avatar-btn" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu}>
              {user.picture ? <img src={user.picture} alt="" referrerPolicy="no-referrer" /> : <span className="avatar">{initial(user.name)}</span>}
            </button>
            {menu && (
              <div className="menu" role="menu">
                <div className="menu-head">
                  <strong>{user.name}</strong>
                  <span className="muted small">{user.email}</span>
                  <span className="small">
                    {ROLE_LABEL[user.role]}
                    {org ? ` · ${org.shortName}` : ""}
                  </span>
                </div>
                <div className="menu-nav">
                  {nav.map((n) => (
                    <Link key={n.href} href={n.href} role="menuitem" onClick={() => setMenu(false)}>
                      {n.label}
                    </Link>
                  ))}
                </div>
                <button
                  role="menuitem"
                  onClick={() => {
                    signOut();
                    router.replace("/login");
                  }}
                >
                  <Icon name="logout" size={16} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {storageError && (
        <div className="banner banner-warning" role="alert">
          {storageError}
        </div>
      )}
      <main className="main">{children}</main>
    </div>
  );
}

const initial = (name: string) => name.trim().split(/\s+/).pop()?.[0]?.toUpperCase() ?? "?";

export function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="4.2" fill="var(--c-accent)" />
      <g stroke="var(--c-accent)" strokeWidth="1.6" strokeLinecap="round" opacity=".85">
        <path d="M16 11.8V4M16 20.2V28M11.8 16H4M20.2 16H28M19 13l5.5-5.5M13 19l-5.5 5.5M13 13 7.5 7.5M19 19l5.5 5.5" />
      </g>
      <g fill="var(--c-text)">
        <circle cx="16" cy="4" r="2" />
        <circle cx="16" cy="28" r="2" />
        <circle cx="4" cy="16" r="2" />
        <circle cx="28" cy="16" r="2" />
      </g>
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  useEffect(() => {
    try {
      const t = localStorage.getItem("hatinh-csdl:theme");
      if (t === "light" || t === "dark") setTheme(t);
    } catch {
      /* ignore */
    }
  }, []);
  const apply = (t: typeof theme) => {
    setTheme(t);
    try {
      if (t === "system") localStorage.removeItem("hatinh-csdl:theme");
      else localStorage.setItem("hatinh-csdl:theme", t);
    } catch {
      /* ignore */
    }
    if (t === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
  };
  const isDark =
    theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  return (
    <button className="icon-btn" onClick={() => apply(isDark ? "light" : "dark")} aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"} title="Đổi giao diện sáng/tối">
      <Icon name={isDark ? "sun" : "moon"} />
    </button>
  );
}
