# Design system – thống kê UI/UX

Nguồn sự thật duy nhất: [`lib/design/tokens.ts`](../lib/design/tokens.ts). CSS variables được sinh tự động
(`tokensToCss()`), trang `/design` trong ứng dụng hiển thị trực tiếp các con số bên dưới và tính độ tương phản WCAG.

Tinh thần: lấy cảm hứng từ Claude — nền ngà ấm, chữ than chì, **một** màu nhấn đất nung (clay), tiêu đề serif, giao diện
sans trung tính, nhiều khoảng trắng, chuyển động ngắn và êm.

## Tổng quan

| Hạng mục | Số lượng |
|---|---|
| Token màu UI | **16** (mỗi token có bản Light + Dark) |
| Màu dữ liệu 3D | **8** |
| Họ font | **3** (Serif · Sans · Mono) |
| Cỡ chữ | **8** bậc (12 → 44px) |
| Độ đậm | **3** (400 / 500 / 600) |
| Khoảng cách | **11** bậc, lưới 4px |
| Bo góc | **5** (6 · 10 · 14 · 20 · full) |
| Đổ bóng | **3** (sm · md · lg) |
| Thời lượng chuyển động | **3** (120 · 200 · 360ms) + 1 easing |
| Breakpoint | **4** (640 · 768 · 1024 · 1280) |

## Màu

| Token | Light | Dark | Dùng cho |
|---|---|---|---|
| `bg` | `#FAF9F5` | `#262624` | Nền trang (Ivory) |
| `surface` | `#FFFFFF` | `#30302E` | Thẻ, panel, modal |
| `subtle` | `#F0EEE6` | `#1F1E1D` | Nền phụ, hover |
| `border` | `#E8E6DC` | `#3E3E38` | Viền |
| `borderStrong` | `#D1CFC5` | `#56554E` | Viền input |
| `text` | `#141413` | `#FAF9F5` | Chữ chính |
| `textSecondary` | `#5E5D59` | `#C2C0B6` | Mô tả |
| `textTertiary` | `#87867F` | `#9C9A92` | Meta, placeholder |
| `accent` | `#D97757` | `#D97757` | Nút chính, liên kết (Clay) |
| `accentHover` | `#C6613F` | `#E08A6D` | Hover |
| `accentSoft` | `#F6E7E0` | `#4A2F25` | Nền chip/badge |
| `onAccent` | `#FFFFFF` | `#1A1918` | Chữ trên accent |
| `success` | `#4E7D4F` | `#8DBF8E` | Thành công |
| `warning` | `#B7791F` | `#E0B062` | Cảnh báo, chờ duyệt |
| `danger` | `#B5412F` | `#E57B69` | Lỗi, xoá |
| `info` | `#4B6FA5` | `#8FB0E0` | Thông tin |

Màu 3D: hub `#D97757` · HĐND `#9B6BA8` · UBND `#C6613F` · Văn phòng `#B08968` · Sở `#4B6FA5` · Thanh tra `#6B8E6B` ·
Trung tâm `#5E9C95` · CSDL `#E0B062`.

Quy tắc: accent chỉ dùng cho **1 hành động chính** trên mỗi màn hình; màu ngữ nghĩa không dùng để trang trí.

## Chữ

| Vai trò | Font | Lý do |
|---|---|---|
| Tiêu đề, số liệu lớn | **Source Serif 4** | Gần với serif của Claude, hỗ trợ đầy đủ tiếng Việt |
| Giao diện, nội dung | **Inter** | Trung tính, rõ ở cỡ nhỏ, có subset Vietnamese |
| Tên bảng, cột, kiểu dữ liệu | **JetBrains Mono** | Phân biệt rõ `l/1/I`, `0/O` |

| Token | px / line-height | Weight | Font | Dùng cho |
|---|---|---|---|---|
| xs | 12 / 16 | 500 | sans | Meta, eyebrow |
| sm | 13 / 18 | 400 | sans | Nhãn, bảng |
| base | 15 / 24 | 400 | sans | Nội dung |
| md | 17 / 26 | 500 | sans | Tiêu đề thẻ |
| lg | 20 / 28 | 500 | serif | Tiêu đề panel |
| xl | 26 / 32 | 500 | serif | Tiêu đề trang mobile |
| 2xl | 34 / 40 | 500 | serif | Tiêu đề trang desktop |
| 3xl | 44 / 50 | 400 | serif | Hero |

Input luôn 16px trên mobile để iOS không tự phóng to khi focus.

## Responsive

| Khoảng | Bố cục |
|---|---|
| < 640px | Nav ẩn (menu avatar). Panel thông tin = bottom sheet 3 nấc (30% · 55% · 92%). Bảng quản trị → dạng thẻ. Modal trượt từ dưới. |
| 640–767px | Như mobile, hiện nhãn nút. |
| 768–1023px | Panel nổi bên phải 360px, nav đầy đủ. |
| 1024–1279px | Panel 400px, form 2 cột. |
| ≥ 1280px | Container 1200px, panel 420px. |

Hỗ trợ `safe-area-inset` (tai thỏ), `100dvh`, vùng chạm ≥ 44px trên màn hình cảm ứng, `prefers-reduced-motion`
(tắt cả xoay tự động 3D), `prefers-color-scheme` + nút chuyển thủ công.
