/**
 * MẠCH – design tokens. Nguồn sự thật DUY NHẤT cho toàn bộ giao diện.
 * CSS variables được sinh từ file này (`tokensToCss`), trang /brand thống kê trực tiếp từ đây.
 *
 * Câu chuyện màu: Hà Tĩnh – đất "Hồng Lam".
 *   • Lam  (sông Lam)  → màu chính: kết nối, hành động, sự tin cậy.
 *   • Hồng (núi Hồng)  → màu nhấn: nhịp dữ liệu, điểm cần chú ý. Dùng tiết chế.
 *   • Nền trung tính lạnh như sương sớm trên sông – để dữ liệu và bản đồ 3D là nhân vật chính.
 */

export type ColorToken = { name: string; light: string; dark: string; usage: string };

export const colors = {
  // Bề mặt
  bg: { light: "#F5F7F9", dark: "#0B1219", usage: "Nền trang (Sương)" },
  surface: { light: "#FFFFFF", dark: "#111B25", usage: "Thẻ, panel, modal" },
  subtle: { light: "#EDF1F5", dark: "#0E1720", usage: "Nền phụ, hover, ô số liệu" },
  border: { light: "#DCE3EA", dark: "#1F2D3B", usage: "Viền mặc định" },
  borderStrong: { light: "#C3CDD8", dark: "#2E4152", usage: "Viền input, phân tách rõ" },
  // Chữ
  text: { light: "#0C1824", dark: "#E6EDF4", usage: "Chữ chính (Mực)" },
  textSecondary: { light: "#475769", dark: "#A3B2C2", usage: "Chữ phụ, mô tả" },
  textTertiary: { light: "#66778A", dark: "#7F90A3", usage: "Meta, placeholder" },
  // Thương hiệu
  accent: { light: "#0E6BA8", dark: "#4FA3DB", usage: "LAM – nút chính, liên kết, trạng thái chọn" },
  accentHover: { light: "#0A5689", dark: "#6DB5E6", usage: "Lam đậm – hover/pressed" },
  accentSoft: { light: "#E1EEF7", dark: "#10283A", usage: "Lam nhạt – nền chip, vùng chọn" },
  onAccent: { light: "#FFFFFF", dark: "#06101A", usage: "Chữ trên nền Lam" },
  hong: { light: "#D93A50", dark: "#F2707F", usage: "HỒNG – nhịp dữ liệu, điểm nhấn thương hiệu" },
  hongSoft: { light: "#FCE8EB", dark: "#3A1820", usage: "Hồng nhạt – nền nhấn nhẹ" },
  // Ngữ nghĩa
  success: { light: "#1E8A5C", dark: "#4CC38A", usage: "Thành công" },
  warning: { light: "#A86A12", dark: "#E0B062", usage: "Cảnh báo, chờ duyệt" },
  danger: { light: "#C0283A", dark: "#F0707B", usage: "Lỗi, xoá" },
  info: { light: "#5B5BD6", dark: "#A4A4F2", usage: "Thông tin, SQL" },
} satisfies Record<string, Omit<ColorToken, "name">>;

/** Bảng màu cảnh 3D – mỗi loại cơ quan một màu (dùng chung cho legend & chấm màu). */
export const nodePalette = {
  hub: "#1B8AD3", // dòng chính LGSP – Lam sáng
  pulse: "#FF5A6E", // nhịp dữ liệu – Hồng
  council: "#8B6CEF",
  government: "#E0475B",
  office: "#D98E3A",
  department: "#1F6FB2",
  inspectorate: "#2F9E77",
  center: "#23A3B3",
  database: "#F2B84B",
} as const;

export const fonts = {
  display: { family: '"Be Vietnam Pro", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', usage: "Tiêu đề, số liệu lớn, wordmark (600–700, tracking âm)" },
  sans: { family: '"Be Vietnam Pro", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', usage: "Giao diện, nội dung (400–500)" },
  mono: { family: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace', usage: "Tên bảng, cột, kiểu dữ liệu, mã" },
} as const;

/** Thang chữ (px) – tỉ lệ ~1.25, kèm line-height/weight/tracking. */
export const typeScale = [
  { token: "xs", size: 12, line: 16, weight: 500, font: "sans", tracking: "0.01em", usage: "Meta, nhãn nhỏ" },
  { token: "sm", size: 13, line: 20, weight: 400, font: "sans", tracking: "0", usage: "Nhãn, bảng dữ liệu" },
  { token: "base", size: 15, line: 24, weight: 400, font: "sans", tracking: "0", usage: "Nội dung chuẩn" },
  { token: "md", size: 17, line: 26, weight: 500, font: "sans", tracking: "-0.005em", usage: "Tiêu đề thẻ" },
  { token: "lg", size: 20, line: 28, weight: 600, font: "display", tracking: "-0.01em", usage: "Tiêu đề panel" },
  { token: "xl", size: 26, line: 32, weight: 600, font: "display", tracking: "-0.015em", usage: "Tiêu đề trang (mobile)" },
  { token: "2xl", size: 34, line: 40, weight: 700, font: "display", tracking: "-0.02em", usage: "Tiêu đề trang (desktop)" },
  { token: "3xl", size: 48, line: 52, weight: 700, font: "display", tracking: "-0.03em", usage: "Hero, câu chuyện" },
] as const;

export const space = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64] as const;
export const radius = { sm: 6, md: 10, lg: 16, xl: 24, full: 9999 } as const;
export const shadow = {
  sm: "0 1px 2px rgba(12,24,36,.06)",
  md: "0 6px 20px rgba(12,24,36,.08), 0 1px 3px rgba(12,24,36,.06)",
  lg: "0 20px 56px rgba(12,24,36,.16), 0 2px 8px rgba(12,24,36,.08)",
} as const;
export const motion = {
  fast: "120ms",
  base: "200ms",
  slow: "360ms",
  ease: "cubic-bezier(.22,.8,.24,1)",
} as const;
export const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const;

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

/** Sinh CSS variables cho light/dark (tôn trọng prefers-color-scheme + lựa chọn thủ công data-theme). */
export function tokensToCss(): string {
  const light: string[] = [];
  const dark: string[] = [];
  for (const [k, v] of Object.entries(colors)) {
    light.push(`--c-${kebab(k)}:${v.light}`);
    dark.push(`--c-${kebab(k)}:${v.dark}`);
  }
  const shared: string[] = [];
  for (const [k, v] of Object.entries(fonts)) shared.push(`--font-${k}:${v.family}`);
  for (const t of typeScale) shared.push(`--fs-${t.token}:${t.size}px`, `--lh-${t.token}:${t.line}px`, `--tr-${t.token}:${t.tracking}`);
  space.forEach((v, i) => shared.push(`--sp-${i}:${v}px`));
  for (const [k, v] of Object.entries(radius)) shared.push(`--r-${k}:${v}px`);
  for (const [k, v] of Object.entries(shadow)) shared.push(`--sh-${k}:${v}`);
  for (const [k, v] of Object.entries(motion)) shared.push(`--mo-${k}:${v}`);
  for (const [k, v] of Object.entries(nodePalette)) shared.push(`--node-${k}:${v}`);
  const darkShadow = `--sh-sm:0 1px 2px rgba(0,0,0,.4);--sh-md:0 6px 20px rgba(0,0,0,.4);--sh-lg:0 20px 56px rgba(0,0,0,.55)`;
  return [
    `:root{${shared.join(";")};${light.join(";")};color-scheme:light}`,
    `@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${dark.join(";")};${darkShadow};color-scheme:dark}}`,
    `:root[data-theme="dark"]{${dark.join(";")};${darkShadow};color-scheme:dark}`,
  ].join("\n");
}

export function tokenStats() {
  const uniqueHex = new Set<string>();
  Object.values(colors).forEach((c) => {
    uniqueHex.add(c.light.toUpperCase());
    uniqueHex.add(c.dark.toUpperCase());
  });
  Object.values(nodePalette).forEach((c) => uniqueHex.add(c.toUpperCase()));
  return {
    uiColors: Object.keys(colors).length,
    nodeColors: Object.keys(nodePalette).length,
    uniqueHex: uniqueHex.size,
    fontFamilies: new Set(Object.values(fonts).map((f) => f.family)).size,
    fontRoles: Object.keys(fonts).length,
    typeSteps: typeScale.length,
    weights: Array.from(new Set(typeScale.map((t) => t.weight))).sort(),
    spaceSteps: space.length,
    radii: Object.keys(radius).length,
    shadows: Object.keys(shadow).length,
    breakpoints: Object.keys(breakpoints).length,
  };
}
