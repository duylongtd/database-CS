import Link from "next/link";
import { ThemeToggle } from "@/components/AppShell";
import { BrandIllustration, LogoMark, Wordmark } from "@/components/brand";
import { BRAND } from "@/lib/brand";
import { breakpoints, colors, fonts, motion, nodePalette, radius, shadow, space, tokenStats, typeScale } from "@/lib/design/tokens";

export const metadata = { title: "Thương hiệu" };

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
  ["accent", "bg"],
  ["onAccent", "accent"],
  ["hong", "surface"],
  ["danger", "surface"],
];
const kebab = (k: string) => k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

const RESPONSIVE = [
  { range: "< 640px", name: "Điện thoại", layout: "Ẩn menu ngang (dùng menu ảnh đại diện). Bảng thông tin là bottom sheet 3 nấc (30% · 55% · 92%). Bảng quản trị chuyển thành thẻ. Trang đăng nhập ẩn phần câu chuyện, chỉ giữ biểu mẫu." },
  { range: "640 – 767px", name: "Điện thoại lớn", layout: "Như điện thoại, lề 20px, hiện nhãn nút." },
  { range: "768 – 1023px", name: "Máy tính bảng", layout: "Panel nổi bên phải 360px trên nền 3D. Menu ngang đầy đủ." },
  { range: "1024 – 1279px", name: "Laptop", layout: "Panel 400px. Trang đăng nhập chia đôi: câu chuyện – biểu mẫu. Form quản trị 2 cột." },
  { range: "≥ 1280px", name: "Màn hình lớn", layout: "Container 1200px, panel 420px, gợi ý thao tác 3D." },
];

const LANGUAGE_3D = [
  { shape: "Đỉnh núi lục giác", means: "Một cơ quan. Kích thước theo cấp: HĐND/UBND › sở › đơn vị trực thuộc." },
  { shape: "Trụ nhiều tầng", means: "Một CSDL. Mỗi tầng = một bảng → thấy quy mô mà không lộ cấu trúc." },
  { shape: "Dòng chính (vòng Lam ở tâm)", means: "Trục tích hợp, chia sẻ dữ liệu LGSP của tỉnh." },
  { shape: "Đường Lam", means: "CSDL kết nối về LGSP." },
  { shape: "Đường Hồng", means: "Hai CSDL liên thông trực tiếp." },
  { shape: "Nhịp sáng chạy dọc đường", means: "Dữ liệu đang được trao đổi (hai chiều)." },
  { shape: "Đường đồng mức dưới nền", means: "Địa hình Hà Tĩnh – nền trung tính, không tranh sự chú ý." },
];

export default function BrandPage() {
  const s = tokenStats();
  return (
    <div className="brandpage">
      <header className="topbar">
        <Link href="/" className="brand-link">
          <Wordmark />
        </Link>
        <div className="topbar-right">
          <Link href="/" className="btn btn-ghost btn-sm">
            Mở bản đồ
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="container stack-xl">
        <section className="brand-hero">
          <div className="stack">
            <p className="eyebrow">Hệ nhận diện thương hiệu</p>
            <h1 className="h-3xl">
              {BRAND.name}. <span className="muted-strong">{BRAND.tagline}.</span>
            </h1>
            <p className="lead muted measure">{BRAND.promise} “Mạch” vừa là mạch nguồn – nơi dòng nước bắt đầu – vừa là mạch kết nối nối liền các cơ quan.</p>
          </div>
          <BrandIllustration />
        </section>

        <section className="stack">
          <h2 className="h-xl">Câu chuyện</h2>
          <ol className="story-grid">
            {BRAND.story.map((b, i) => (
              <li key={b.key} className="card">
                <span className="beat-n">0{i + 1}</span>
                <h3 className="h-lg">{b.title}</h3>
                <p className="muted">{b.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="stack">
          <h2 className="h-xl">Logo</h2>
          <div className="logo-grid">
            <div className="logo-tile">
              <LogoMark size={96} />
              <span className="small muted">Biểu tượng</span>
            </div>
            <div className="logo-tile is-dark">
              <Wordmark size={44} />
              <span className="small">Trên nền tối</span>
            </div>
            <div className="logo-tile">
              <Wordmark size={44} />
              <span className="small muted">Trên nền sáng</span>
            </div>
            <div className="logo-tile">
              <span style={{ color: "var(--c-text)" }}>
                <LogoMark size={64} mono />
              </span>
              <span className="small muted">Đơn sắc (in ấn, con dấu số)</span>
            </div>
          </div>
          <ul className="spec-list">
            <li><strong>Hai đỉnh núi viết thành chữ M</strong> – dãy Hồng Lĩnh, đồng thời là chữ cái đầu của “Mạch”.</li>
            <li><strong>Ba nút dữ liệu</strong> – hai đỉnh (cơ quan) và điểm giao màu Hồng (nơi dữ liệu gặp nhau).</li>
            <li><strong>Nhánh sông bên dưới</strong> – sông Lam, dòng chảy liên thông.</li>
            <li>Khoảng trống quanh logo ≥ ¼ chiều rộng biểu tượng. Kích thước tối thiểu 20px (màn hình), 8mm (in).</li>
            <li>Không kéo méo, không đổi màu ngoài bảng màu, không thêm bóng đổ, không đặt trên ảnh rối.</li>
          </ul>
        </section>

        <section className="stack">
          <h2 className="h-xl">Màu · {s.uiColors} token giao diện × 2 chế độ</h2>
          <div className="hero-swatches">
            <div className="hero-swatch" style={{ background: colors.accent.light }}>
              <strong>Lam</strong>
              <span>{colors.accent.light} · sông Lam</span>
              <em>Màu chính – hành động, liên kết, trạng thái chọn.</em>
            </div>
            <div className="hero-swatch" style={{ background: colors.hong.light }}>
              <strong>Hồng</strong>
              <span>{colors.hong.light} · núi Hồng</span>
              <em>Màu nhấn – nhịp dữ liệu. Dùng dưới 5% diện tích.</em>
            </div>
            <div className="hero-swatch is-light" style={{ background: colors.bg.light }}>
              <strong>Sương</strong>
              <span>{colors.bg.light} · nền</span>
              <em>Trung tính lạnh để dữ liệu nổi bật.</em>
            </div>
            <div className="hero-swatch" style={{ background: colors.text.light }}>
              <strong>Mực</strong>
              <span>{colors.text.light} · chữ</span>
              <em>Chữ chính, độ tương phản AAA.</em>
            </div>
          </div>
          <div className="swatches">
            {Object.entries(colors).map(([k, c]) => (
              <div key={k} className="swatch">
                <div className="swatch-chips">
                  <span style={{ background: c.light }} title={`Sáng ${c.light}`} />
                  <span style={{ background: c.dark }} title={`Tối ${c.dark}`} />
                </div>
                <strong className="mono small">--c-{kebab(k)}</strong>
                <span className="mono xsmall muted">
                  {c.light} · {c.dark}
                </span>
                <span className="small muted">{c.usage}</span>
              </div>
            ))}
          </div>
          <h3 className="h-md">Độ tương phản WCAG</h3>
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
                  const tag = (r: number) => (r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA chữ lớn" : "✗");
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
          <h2 className="h-xl">Ngôn ngữ hình khối 3D · {s.nodeColors} màu</h2>
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
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Hình</th>
                  <th>Ý nghĩa</th>
                </tr>
              </thead>
              <tbody>
                {LANGUAGE_3D.map((r) => (
                  <tr key={r.shape}>
                    <td data-label="Hình">
                      <strong>{r.shape}</strong>
                    </td>
                    <td data-label="Ý nghĩa">{r.means}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="stack">
          <h2 className="h-xl">Chữ · {s.fontFamilies} họ font, {s.fontRoles} vai trò, {s.typeSteps} cỡ</h2>
          <p className="muted measure">
            <strong>Be Vietnam Pro</strong> – họ chữ do các nhà thiết kế Việt Nam phát triển, dấu tiếng Việt được vẽ riêng nên không chồng,
            không lệch ở mọi độ đậm. Dùng một họ duy nhất cho cả tiêu đề và nội dung, phân cấp bằng độ đậm và khoảng cách chữ.
            <strong> JetBrains Mono</strong> cho tên bảng, cột – phân biệt rõ <code>l 1 I</code>, <code>0 O</code>.
          </p>
          <div className="font-cards">
            {Object.entries(fonts).map(([k, f]) => (
              <div key={k} className="card">
                <p className="eyebrow">{k}</p>
                <p style={{ fontFamily: f.family, fontSize: 26, lineHeight: "34px", fontWeight: k === "display" ? 700 : 400, letterSpacing: k === "display" ? "-0.02em" : 0 }}>
                  {k === "mono" ? "thua_dat.so_to" : "Sở Khoa học và Công nghệ"}
                </p>
                <p className="small muted">{f.usage}</p>
              </div>
            ))}
          </div>
          <div className="type-scale">
            {typeScale.map((t) => (
              <div key={t.token} className="type-row">
                <span className="mono xsmall muted">
                  {t.token} · {t.size}/{t.line} · {t.weight} · {t.tracking}
                </span>
                <span style={{ fontSize: t.size, lineHeight: `${t.line}px`, fontWeight: t.weight, letterSpacing: t.tracking, fontFamily: `var(--font-${t.font})` }}>
                  Cơ sở dữ liệu Đất đai Hà Tĩnh
                </span>
                <span className="small muted">{t.usage}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="stack">
          <h2 className="h-xl">Giọng văn</h2>
          <div className="story-grid">
            {BRAND.voice.traits.map((t) => (
              <div key={t.name} className="card">
                <h3 className="h-lg">{t.name}</h3>
                <p className="muted">{t.desc}</p>
              </div>
            ))}
          </div>
          <div className="voice-list">
            {BRAND.voice.examples.map((e) => (
              <div key={e.prefer} className="voice-row">
                <p className="voice-avoid">
                  <span>Tránh</span>
                  {e.avoid}
                </p>
                <p className="voice-prefer">
                  <span>Nên</span>
                  {e.prefer}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="stack">
          <h2 className="h-xl">Khoảng cách · lưới 4px ({s.spaceSteps} bậc)</h2>
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
            {Object.keys(shadow).map((k) => (
              <div key={k} className="shadow-item" style={{ boxShadow: `var(--sh-${k})` }}>
                <code className="xsmall">sh-{k}</code>
              </div>
            ))}
          </div>
          <p className="small muted">
            Chuyển động: {motion.fast} · {motion.base} · {motion.slow}, easing <code>{motion.ease}</code> – nhanh, dứt khoát, không nảy.
            Tắt toàn bộ (kể cả xoay tự động 3D) khi người dùng bật <code>prefers-reduced-motion</code>.
          </p>
        </section>

        <section className="stack">
          <h2 className="h-xl">Responsive · {s.breakpoints} breakpoint</h2>
          <p className="muted small">
            {Object.entries(breakpoints)
              .map(([k, v]) => `${k} ${v}px`)
              .join(" · ")}{" "}
            — thiết kế từ điện thoại lên (min-width).
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
            <span className="badge badge-hong">Đang trao đổi</span>
            <span className="badge badge-warning">Chờ duyệt</span>
            <span className="badge badge-danger">Đã khoá</span>
            <span className="badge badge-neutral">Khách</span>
          </div>
          <div className="banner banner-info">Banner thông tin – nền nhạt, vạch trái màu ngữ nghĩa, luôn kèm hướng xử lý.</div>
        </section>
      </main>
    </div>
  );
}
