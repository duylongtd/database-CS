/**
 * Design tokens – nguồn sự thật DUY NHẤT cho toàn bộ UI.
 * CSS variables được sinh từ file này (xem `tokensToCss`) và trang /design thống kê trực tiếp từ đây.
 * Cảm hứng: ngôn ngữ thiết kế của Claude – nền ngà ấm, chữ than chì, điểm nhấn màu đất nung (clay),
 * tiêu đề serif, giao diện sans trung tính, khoảng trắng rộng rãi.
 */

export type ColorToken = { name: string; light: string; dark: string; usage: string };

export const colors = {
  // Bề mặt
  bg: { light: "#FAF9F5", dark: "#262624", usage: "Nền trang (Ivory)" },
  surface: { light: "#FFFFFF", dark: "#30302E", usage: "Thẻ, panel, modal" },
  subtle: { light: "#F0EEE6", dark: "#1F1E1D", usage: "Nền phụ, hover, input" },
  border: { light: "#E8E6DC", dark: "#3E3E38", usage: "Viền mặc định" },
  borderStrong: { light: "#D1CFC5", dark: "#56554E", usage: "Viền nhấn, focus nhẹ" },
  // Chữ
  text: { light: "#141413", dark: "#FAF9F5", usage: "Chữ chính" },
  textSecondary: { light: "#5E5D59", dark: "#C2C0B6", usage: "Chữ phụ, mô tả" },
  textTertiary: { light: "#87867F", dark: "#9C9A92", usage: "Placeholder, meta" },
  // Thương hiệu
  accent: { light: "#D97757", dark: "#D97757", usage: "Nút chính, liên kết, điểm nhấn (Clay)" },
  accentHover: { light: "#C6613F", dark: "#E08A6D", usage: "Hover/pressed của accent" },
  accentSoft: { light: "#F6E7E0", dark: "#4A2F25", usage: "Nền nhẹ cho chip/badge accent" },
  onAccent: { light: "#FFFFFF", dark: "#1A1918", usage: "Chữ trên nền accent" },
  // Ngữ nghĩa
  success: { light: "#4E7D4F", dark: "#8DBF8E", usage: "Thành công" },
  warning: { light: "#B7791F", dark: "#E0B062", usage: "Cảnh báo" },
  danger: { light: "#B5412F", dark: "#E57B69", usage: "Lỗi, xoá" },
  info: { light: "#4B6FA5", dark: "#8FB0E0", usage: "Thông tin, liên kết dữ liệu" },
} satisfies Record<string, Omit<ColorToken, "name">>;

/** Bảng màu cho cảnh 3D – mỗi loại cơ quan một màu (dùng chung cho legend & badge). */
export const nodePalette = {
  hub: "#D97757",
  council: "#9B6BA8",
  government: "#C6613F",
  office: "#B08968",
  department: "#4B6FA5",
  inspectorate: "#6B8E6B",
  center: "#5E9C95",
  database: "#E0B062",
} as const;

export const fonts = {
  serif: { family: '"Source Serif 4", "Iowan Old Style", Georgia, serif', usage: "Tiêu đề, đoạn đọc dài" },
  sans: { family: 'Inter, "Segoe UI", system-ui, -apple-system, Roboto, sans-serif', usage: "Giao diện, nút, nhãn" },
  mono: { family: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace', usage: "Tên bảng, cột, kiểu dữ liệu" },
} as const;

/** Thang chữ (px) – tỉ lệ ~1.2, có line-height & weight đi kèm. */
export const typeScale = [
  { token: "xs", size: 12, line: 16, weight: 500, font: "sans", usage: "Meta, chú thích" },
  { token: "sm", size: 13, line: 18, weight: 400, font: "sans", usage: "Nhãn, bảng dữ liệu" },
  { token: "base", size: 15, line: 24, weight: 400, font: "sans", usage: "Nội dung chuẩn" },
  { token: "md", size: 17, line: 26, weight: 500, font: "sans", usage: "Tiêu đề thẻ" },
  { token: "lg", size: 20, line: 28, weight: 500, font: "serif", usage: "Tiêu đề panel" },
  { token: "xl", size: 26, line: 32, weight: 500, font: "serif", usage: "Tiêu đề trang (mobile)" },
  { token: "2xl", size: 34, line: 40, weight: 500, font: "serif", usage: "Tiêu đề trang (desktop)" },
  { token: "3xl", size: 44, line: 50, weight: 400, font: "serif", usage: "Hero" },
] as const;

export const space = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64] as const;
export const radius = { sm: 6, md: 10, lg: 14, xl: 20, full: 9999 } as const;
export const shadow = {
  sm: "0 1px 2px rgba(20,20,19,.06)",
  md: "0 4px 16px rgba(20,20,19,.08), 0 1px 3px rgba(20,20,19,.06)",
  lg: "0 16px 48px rgba(20,20,19,.14), 0 2px 8px rgba(20,20,19,.08)",
} as const;
export const motion = {
  fast: "120ms",
  base: "200ms",
  slow: "360ms",
  ease: "cubic-bezier(.2,.8,.2,1)",
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
  for (const t of typeScale) shared.push(`--fs-${t.token}:${t.size}px`, `--lh-${t.token}:${t.line}px`);
  space.forEach((v, i) => shared.push(`--sp-${i}:${v}px`));
  for (const [k, v] of Object.entries(radius)) shared.push(`--r-${k}:${v}px`);
  for (const [k, v] of Object.entries(shadow)) shared.push(`--sh-${k}:${v}`);
  for (const [k, v] of Object.entries(motion)) shared.push(`--mo-${k}:${v}`);
  for (const [k, v] of Object.entries(nodePalette)) shared.push(`--node-${k}:${v}`);
  const darkShadow = `--sh-md:0 4px 16px rgba(0,0,0,.35);--sh-lg:0 16px 48px rgba(0,0,0,.5)`;
  return [
    `:root{${shared.join(";")};${light.join(";")};color-scheme:light}`,
    `@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${dark.join(";")};${darkShadow};color-scheme:dark}}`,
    `:root[data-theme="dark"]{${dark.join(";")};${darkShadow};color-scheme:dark}`,
  ].join("\n");
}

export function tokenStats() {
  const uiColors = Object.keys(colors).length;
  const nodeColors = Object.keys(nodePalette).length;
  const uniqueHex = new Set<string>();
  Object.values(colors).forEach((c) => {
    uniqueHex.add(c.light.toUpperCase());
    uniqueHex.add(c.dark.toUpperCase());
  });
  Object.values(nodePalette).forEach((c) => uniqueHex.add(c.toUpperCase()));
  return {
    uiColors,
    nodeColors,
    uniqueHex: uniqueHex.size,
    fontFamilies: Object.keys(fonts).length,
    typeSteps: typeScale.length,
    weights: Array.from(new Set(typeScale.map((t) => t.weight))).sort(),
    spaceSteps: space.length,
    radii: Object.keys(radius).length,
    shadows: Object.keys(shadow).length,
    breakpoints: Object.keys(breakpoints).length,
  };
}
