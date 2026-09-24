import { BRAND } from "@/lib/brand";

/**
 * Logo MẠCH: hai đỉnh núi Hồng Lĩnh viết thành chữ "M", ba nút dữ liệu trên đỉnh,
 * và một nhánh sông Lam chảy bên dưới. Nền ô vuông bo tròn màu Lam (màu đặc – không dùng gradient/id để an toàn khi logo xuất hiện nhiều lần).
 */
export function LogoMark({ size = 32, mono = false }: { size?: number; mono?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label={BRAND.name}>
      <rect width="32" height="32" rx="9" fill={mono ? "currentColor" : "#0E6BA8"} />
      <path d="M6.5 21 12 10.5 16 17l4-6.5 5.5 10.5" fill="none" stroke={mono ? "var(--c-bg)" : "#fff"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 25.2c3.4-1.9 6.6 1.9 10.5 0s7.1-1.9 10.5 0" fill="none" stroke={mono ? "var(--c-bg)" : "#FF8A98"} strokeWidth="2.1" strokeLinecap="round" />
      <circle cx="12" cy="10.5" r="1.9" fill={mono ? "var(--c-bg)" : "#fff"} />
      <circle cx="20" cy="10.5" r="1.9" fill={mono ? "var(--c-bg)" : "#fff"} />
      <circle cx="16" cy="17" r="1.7" fill={mono ? "var(--c-bg)" : "#FF5A6E"} />
    </svg>
  );
}

export function Wordmark({ sub = true, size = 32 }: { sub?: boolean; size?: number }) {
  return (
    <span className="wordmark">
      <LogoMark size={size} />
      <span className="wordmark-text">
        <strong>{BRAND.name}</strong>
        {sub && <span>{BRAND.place} · Bản đồ dữ liệu</span>}
      </span>
    </span>
  );
}

/** Minh hoạ câu chuyện "Núi giữ – Sông nối": dãy núi, nút dữ liệu và dòng sông có nhịp chảy. */
export function BrandIllustration() {
  return (
    <svg className="brand-illus" viewBox="0 0 480 320" aria-hidden>
      <defs>
        <linearGradient id="m-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--c-accent)" stopOpacity=".22" />
          <stop offset="1" stopColor="var(--c-accent)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="m-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--c-accent)" stopOpacity=".5" />
          <stop offset="1" stopColor="var(--c-accent)" stopOpacity=".05" />
        </linearGradient>
      </defs>
      {/* đường đồng mức */}
      <g fill="none" stroke="var(--c-border-strong)" strokeWidth="1" opacity=".7">
        <path d="M-10 290c80-18 160 14 250-4s170-20 250 2" />
        <path d="M-10 305c90-14 170 12 260-3s160-16 240 4" />
      </g>
      {/* dãy núi xa & gần */}
      <path d="M0 250 60 170l40 40 70-100 60 80 50-50 80 90 50-60 70 80v40H0z" fill="url(#m-far)" />
      <path d="M0 262 90 160l55 62 55-88 58 92 64-110 66 104 92-40v88H0z" fill="url(#m-near)" />
      {/* mạng nút dữ liệu trên đỉnh */}
      <g stroke="var(--c-accent)" strokeWidth="1.5" fill="none" opacity=".8">
        <path d="M90 160 200 134 322 114 388 218" />
        <path d="M145 222 200 134M258 226 322 114" strokeDasharray="3 5" />
      </g>
      {[
        [90, 160],
        [200, 134],
        [322, 114],
        [388, 218],
        [145, 222],
        [258, 226],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="9" fill="var(--c-surface)" stroke="var(--c-accent)" strokeWidth="2" />
          <circle cx={x} cy={y} r="3.2" fill={i === 2 ? "var(--c-hong)" : "var(--c-accent)"} />
        </g>
      ))}
      {/* sông Lam */}
      <path d="M-10 282c70-26 130 18 200 0s130-34 200-8 60 14 100 4" fill="none" stroke="var(--c-accent)" strokeWidth="6" strokeLinecap="round" opacity=".25" />
      <path className="river-flow" d="M-10 282c70-26 130 18 200 0s130-34 200-8 60 14 100 4" fill="none" stroke="var(--c-hong)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 18" />
    </svg>
  );
}
