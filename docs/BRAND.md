# Mạch – hệ nhận diện thương hiệu

> **Mạch nguồn dữ liệu đất Hồng Lam.**
> Thấy toàn cảnh dữ liệu của tỉnh – và chỉ thấy chi tiết khi được tin cậy.

Nguồn sự thật: [`lib/design/tokens.ts`](../lib/design/tokens.ts) (màu, chữ, khoảng cách) và [`lib/brand.ts`](../lib/brand.ts)
(tên, câu chuyện, giọng văn). Trang `/brand` trong ứng dụng hiển thị trực tiếp từ hai file này.

## 1. Tên & ý nghĩa
**Mạch** – vừa là *mạch nguồn* (nơi dòng nước bắt đầu), vừa là *mạch kết nối* (mạch điện, mạch dữ liệu).
Hà Tĩnh là đất **Hồng Lam**: núi Hồng Lĩnh và sông Lam. Toàn bộ thương hiệu dựng trên hai hình ảnh đó.

## 2. Câu chuyện (3 nhịp)
| # | Nhịp | Nội dung | Thể hiện trong sản phẩm |
|---|---|---|---|
| 01 | **Núi giữ** | Mỗi cơ quan như một đỉnh trong dãy Hồng Lĩnh, lưu giữ các lớp dữ liệu. | Cơ quan = khối lục giác hình đỉnh núi; mỗi tầng trụ = 1 bảng. |
| 02 | **Sông nối** | Như sông Lam gom trăm nhánh, LGSP nối các nguồn dữ liệu thành dòng chảy chung. | Đường Lam đổ về “dòng chính” ở tâm; nhịp sáng Hồng là dữ liệu đang trao đổi. |
| 03 | **Người hiểu** | Ai cũng thấy bức tranh chung; chi tiết chỉ mở với đúng người. | Khách thấy số liệu; chuyên viên được cấp mới thấy bảng/cột. |

Câu chuyện xuất hiện ở trang đăng nhập (cột trái), panel tổng quan và `/brand`.

## 3. Logo
- Hai đỉnh núi viết thành chữ **M**, ba nút dữ liệu (hai đỉnh trắng, điểm giao màu Hồng), một nhánh sông bên dưới.
- Nền ô vuông bo 9/32, màu Lam `#0E6BA8`. Biến thể: màu, đơn sắc; wordmark “Mạch” Be Vietnam Pro 700, tracking −3%.
- Khoảng trống ≥ ¼ chiều rộng biểu tượng. Tối thiểu 20px / 8mm. Không kéo méo, không đổi màu, không đổ bóng.
- File: `components/brand.tsx` (`LogoMark`, `Wordmark`), favicon `app/icon.svg`.

## 4. Màu
| Tên | Token | Sáng | Tối | Vai trò |
|---|---|---|---|---|
| **Lam** | `accent` | `#0E6BA8` | `#4FA3DB` | Màu chính: hành động, liên kết, trạng thái chọn |
| **Hồng** | `hong` | `#D93A50` | `#F2707F` | Nhấn: nhịp dữ liệu. Dưới 5% diện tích |
| **Sương** | `bg` | `#F5F7F9` | `#0B1219` | Nền trung tính lạnh |
| **Mực** | `text` | `#0C1824` | `#E6EDF4` | Chữ chính (AAA) |

Tổng: **18 token giao diện** × 2 chế độ (sáng/tối) + **9 màu hình khối 3D**. Chi tiết và độ tương phản WCAG ở `/brand`.

## 5. Chữ
- **Be Vietnam Pro** – một họ chữ cho cả tiêu đề (600–700, tracking âm) và nội dung (400–500). Dấu tiếng Việt vẽ riêng,
  không chồng/lệch – phù hợp một sản phẩm của chính quyền địa phương Việt Nam.
- **JetBrains Mono** – tên bảng, cột, kiểu dữ liệu.
- 8 cỡ chữ: 12 · 13 · 15 · 17 · 20 · 26 · 34 · 48px. 4 độ đậm: 400 · 500 · 600 · 700.

## 6. Giọng văn
**Rõ ràng · Điềm tĩnh · Đáng tin.** Xưng “bạn”, câu ngắn, động từ trước, không dấu chấm than, lỗi luôn kèm cách khắc phục,
nói thật về dữ liệu khuôn mặt.

| Tránh | Nên |
|---|---|
| Lỗi! Không truy cập được camera!!! | Chưa mở được camera. Hãy cho phép quyền camera, hoặc đăng nhập bằng Google. |
| Bạn không có quyền. | Cấu trúc CSDL này được bảo mật. Liên hệ quản trị viên của sở để được cấp quyền đọc. |
| Xác thực sinh trắc học thất bại. | Chưa nhận ra bạn. Hãy ra chỗ sáng hơn và nhìn thẳng vào camera. |

## 7. Ngôn ngữ 3D
Đỉnh núi lục giác = cơ quan · trụ nhiều tầng = CSDL (tầng = bảng) · dòng chính Lam ở tâm = LGSP · đường Lam = kết nối LGSP ·
đường Hồng = liên thông trực tiếp · nhịp sáng = dữ liệu trao đổi · đường đồng mức = nền địa hình.

## 8. Lưới, bo góc, chuyển động, responsive
- Khoảng cách: lưới 4px, 11 bậc. Bo góc: 6 · 10 · 16 · 24 · full. Bóng: 3 mức, tông xanh than.
- Chuyển động: 120 / 200 / 360ms, `cubic-bezier(.22,.8,.24,1)`; tắt hết khi `prefers-reduced-motion`.
- Breakpoint: 640 · 768 · 1024 · 1280. < 768: bottom sheet 3 nấc, bảng → thẻ, đăng nhập ẩn cột câu chuyện.
  ≥ 1024: đăng nhập chia đôi câu chuyện / biểu mẫu, panel 3D 400–420px.
