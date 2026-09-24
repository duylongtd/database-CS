import Link from "next/link";
import { Logo, ThemeToggle } from "@/components/AppShell";
import { breakpoints, colors, fonts, motion, nodePalette, radius, shadow, space, tokenStats, typeScale } from "@/lib/design/tokens";

export const metadata = { title: "Design system" };

// Độ tương phản WCAG 2.x
const lum = (hex: string) => {
  const c = hex.replace("#", "").match(/../g)!.map((x) => parseInt(x, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const PAIRS: [keyof typeof colors, keyof typeof colors][] = [
  ["text", "bg"],
  ["textSecondary", "bg"],
  ["textTertiary", "bg"],
  ["onAccent", "accent"],
  ["accent", "bg"],
  ["danger", "surface"],
];

const RESPONSIVE = [
  { range: "< 640px", name: "Mobile", layout: "Thanh trên gọn (ẩn nav, dùng menu avatar). Bảng thông tin là bottom sheet 3 nấc (peek 30% · half 55% · full 92%). Bảng dữ liệu chuyển sang dạng thẻ. Camera Face ID full-width, vòng quét 1:1." },
  { range: "640 – 767px", name: "Phablet", layout: "Như mobile, lề 20px, hiện nhãn nút chế độ xem." },
  { range: "768 – 1023px", name: "Tablet", layout: "Panel bên phải 360px nổi trên cảnh 3D. Nav hiện đầy đủ." },
  { range: "1024 – 1279px", name: "Laptop", layout: "Panel 400px. Form quản trị 2 cột." },
  { range: "≥ 1280px", name: "Desktop", layout: "Container tối đa 1200px, panel 420px, gợi ý thao tác 3D hiển thị." },
];

export default function DesignPage() {
  const s = tokenStats();
  return (
    <div className="design">
      <header className="auth-top">
        <Link href="/" className="brand">
          <Logo />
          <span className="brand-text">
            <strong>CSDL Hà Tĩnh</strong>
            <span className="hide-sm">Design system</span>
          </span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="container stack-xl">
        <section className="stack">
          <p className="eyebrow">Thống kê UI/UX</p>
          <h1 className="h-3xl">Ngôn ngữ thiết kế</h1>
          <p className="lead muted measure">
            Ấm áp, tĩnh lặng và tập trung vào nội dung – lấy cảm hứng từ Claude: nền ngà, chữ than chì, một màu nhấn đất nung
            duy nhất, tiêu đề serif, giao diện sans trung tính và rất nhiều khoảng trắng. Mọi giá trị dưới đây được đọc trực
            tiếp từ <code>lib/design/tokens.ts</code>.
          </p>
          <dl className="stats stats-5">
            <div className="stat"><dt>Màu UI</dt><dd>{s.uiColors}</dd></div>
            <div className="stat"><dt>Màu dữ liệu 3D</dt><dd>{s.nodeColors}</dd></div>
            <div className="stat"><dt>Mã hex duy nhất</dt><dd>{s.uniqueHex}</dd></div>
            <div className="stat"><dt>Họ font</dt><dd>{s.fontFamilies}</dd></div>
            <div className="stat"><dt>Cỡ chữ</dt><dd>{s.typeSteps}</dd></div>
            <div className="stat"><dt>Độ đậm</dt><dd>{s.weights.join("/")}</dd></div>
            <div className="stat"><dt>Bậc khoảng cách</dt><dd>{s.spaceSteps}</dd></div>
            <div className="stat"><dt>Bo góc</dt><dd>{s.radii}</dd></div>
            <div className="stat"><dt>Đổ bóng</dt><dd>{s.shadows}</dd></div>
            <div className="stat"><dt>Breakpoint</dt><dd>{s.breakpoints}</dd></div>
          </dl>
        </section>

        <section className="stack">
          <h2 className="h-xl">Màu giao diện · {s.uiColors} token × 2 chế độ</h2>
          <div className="swatches">
            {Object.entries(colors).map(([k, c]) => (
              <div key={k} className="swatch">
                <div className="swatch-chips">
                  <span style={{ background: c.light }} title={`Light ${c.light}`} />
                  <span style={{ background: c.dark }} title={`Dark ${c.dark}`} />
                </div>
                <strong className="mono small">--c-{k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}</strong>
                <span className="mono xsmall muted">
                  {c.light} · {c.dark}
                </span>
                <span className="small muted">{c.usage}</span>
              </div>
            ))}
          </div>
          <h3 className="h-md">Độ tương phản (WCAG) – chế độ sáng / tối</h3>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Cặp màu</th>
                  <th>Sáng</th>
                  <th>Tối</th>
                </tr>
              </thead>
              <tbody>
                {PAIRS.map(([f, b]) => {
                  const l = contrast(colors[f].light, colors[b].light);
                  const d = contrast(colors[f].dark, colors[b].dark);
                  const tag = (r: number) => (r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA lớn" : "✗");
                  return (
                    <tr key={f + b}>
                      <td data-label="Cặp">
                        <code>{f}</code> / <code>{b}</code>
                      </td>
                      <td data-label="Sáng">
                        {l.toFixed(2)}:1 · {tag(l)}
                      </td>
                      <td data-label="Tối">
                        {d.toFixed(2)}:1 · {tag(d)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="stack">
          <h2 className="h-xl">Màu dữ liệu 3D · {s.nodeColors} màu</h2>
          <div className="swatches">
            {Object.entries(nodePalette).map(([k, c]) => (
              <div key={k} className="swatch">
                <div className="swatch-chips">
                  <span style={{ background: c }} />
                </div>
                <strong className="mono small">{k}</strong>
                <span className="mono xsmall muted">{c}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="stack">
          <h2 className="h-xl">Kiểu chữ · {s.fontFamilies} họ font, {s.typeSteps} cỡ</h2>
          <div className="font-cards">
            {Object.entries(fonts).map(([k, f]) => (
              <div key={k} className="card">
                <p className="eyebrow">{k}</p>
                <p style={{ fontFamily: f.family, fontSize: 28, lineHeight: "36px" }}>Sở Khoa học và Công nghệ</p>
                <p className="small muted">{f.usage}</p>
                <code className="xsmall muted">{f.family}</code>
              </div>
            ))}
          </div>
          <div className="type-scale">
            {typeScale.map((t) => (
              <div key={t.token} className="type-row">
                <span className="mono xsmall muted">
                  {t.token} · {t.size}/{t.line} · {t.weight}
                </span>
                <span style={{ fontSize: t.size, lineHeight: `${t.line}px`, fontWeight: t.weight, fontFamily: `var(--font-${t.font})` }}>
                  Cơ sở dữ liệu Đất đai Hà Tĩnh
                </span>
                <span className="small muted">{t.usage}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="stack">
          <h2 className="h-xl">Khoảng cách · lưới 4px</h2>
          <div className="space-row">
            {space.map((v, i) => (
              <div key={i} className="space-item">
                <span style={{ width: v, height: v }} />
                <code className="xsmall">
                  sp-{i} · {v}
                </code>
              </div>
            ))}
          </div>
          <h2 className="h-xl">Bo góc, bóng, chuyển động</h2>
          <div className="space-row">
            {Object.entries(radius).map(([k, v]) => (
              <div key={k} className="radius-item" style={{ borderRadius: Math.min(v, 40) }}>
                <code className="xsmall">
                  {k} · {v === 9999 ? "full" : `${v}px`}
                </code>
              </div>
            ))}
          </div>
          <div className="space-row">
            {Object.entries(shadow).map(([k]) => (
              <div key={k} className="shadow-item" style={{ boxShadow: `var(--sh-${k})` }}>
                <code className="xsmall">sh-{k}</code>
              </div>
            ))}
          </div>
          <p className="small muted">
            Chuyển động: fast {motion.fast} · base {motion.base} · slow {motion.slow} · easing <code>{motion.ease}</code>. Tắt
            hoàn toàn khi người dùng bật <code>prefers-reduced-motion</code> (kể cả xoay tự động 3D).
          </p>
        </section>

        <section className="stack">
          <h2 className="h-xl">Responsive · {s.breakpoints} breakpoint</h2>
          <p className="muted small">
            {Object.entries(breakpoints)
              .map(([k, v]) => `${k} ${v}px`)
              .join(" · ")}{" "}
            — mobile-first, min-width.
          </p>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Khoảng</th>
                  <th>Thiết bị</th>
                  <th>Bố cục</th>
                </tr>
              </thead>
              <tbody>
                {RESPONSIVE.map((r) => (
                  <tr key={r.range}>
                    <td data-label="Khoảng" className="nowrap">
                      {r.range}
                    </td>
                    <td data-label="Thiết bị">{r.name}</td>
                    <td data-label="Bố cục">{r.layout}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="stack">
          <h2 className="h-xl">Thành phần</h2>
          <div className="row wrap">
            <button className="btn btn-primary">Nút chính</button>
            <button className="btn btn-secondary">Nút phụ</button>
            <button className="btn btn-ghost">Nút trống</button>
            <button className="btn btn-danger">Xoá</button>
            <button className="btn btn-primary" disabled>
              Vô hiệu
            </button>
          </div>
          <div className="row wrap">
            <span className="badge badge-accent">PostgreSQL</span>
            <span className="badge badge-info">SQL</span>
            <span className="badge badge-success">NoSQL</span>
            <span className="badge badge-warning">Chờ duyệt</span>
            <span className="badge badge-danger">Đã khoá</span>
            <span className="badge badge-neutral">Khách</span>
          </div>
          <div className="banner banner-info">Banner thông tin – nền nhạt, viền trái màu ngữ nghĩa.</div>
          <label className="field measure">
            <span>Ô nhập</span>
            <input placeholder="Placeholder dùng textTertiary" />
          </label>
        </section>
      </main>
    </div>
  );
}
