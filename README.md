# Mạch – Bản đồ dữ liệu Hà Tĩnh

> Mạch nguồn dữ liệu đất Hồng Lam.

Ứng dụng Next.js (chỉ frontend, không database/backend) trực quan hoá các cơ sở dữ liệu của **HĐND, UBND, các sở, ban,
ngành và đơn vị trực thuộc tỉnh Hà Tĩnh** dưới dạng mô hình 3D (three.js): mỗi cơ quan là một đỉnh núi, mỗi CSDL là một trụ
(số tầng = số bảng), các nhánh sông có nhịp dữ liệu chạy dọc đổ về **dòng chính LGSP** của tỉnh.

- Thương hiệu: [`docs/BRAND.md`](docs/BRAND.md) · trang `/brand`
- Deploy & kiểm thử Face ID trên UAT: [`docs/UAT_FACEID.md`](docs/UAT_FACEID.md) · trang `/faceid-check`
- Kiểm thử tải 3D: `/?stress=1000` (sinh CSDL giả trong bộ nhớ, không ghi dữ liệu)

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Tuỳ chọn trong `.env.local` (xem `.env.example`):

| Biến | Ý nghĩa |
|---|---|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client ID Google Identity Services. Bỏ trống → trình chọn tài khoản **demo**. |
| `NEXT_PUBLIC_SUPER_ADMIN_EMAILS` | Email tự động là Super Admin. Bỏ trống → người đăng ký đầu tiên là Super Admin. |

> Camera chỉ hoạt động trên **HTTPS** hoặc `localhost`. Khi thử trên điện thoại trong mạng LAN, cần HTTPS
> (vd. `next dev --experimental-https`).

## Cơ cấu tổ chức

Theo phương án sắp xếp bộ máy 2025: HĐND tỉnh (+ VP Đoàn ĐBQH & HĐND), UBND tỉnh (+ VP UBND, TT Công báo – Tin học,
TT Phục vụ HCC), các sở sau hợp nhất (Nội vụ, Tài chính, Tư pháp, Công Thương, NN & MT, Xây dựng, KH&CN, GD&ĐT, Y tế,
VH-TT&DL), Thanh tra tỉnh, và các trung tâm cấp 2 – ví dụ **TT Điều hành thông minh, KHCN và Đổi mới sáng tạo** thuộc
Sở KH&CN. Danh mục nằm ở `lib/seed.ts`; **CSDL là dữ liệu minh hoạ** – Super Admin sửa/thêm/xoá trong trang Quản trị.

## Phân quyền

| Vai trò | Tổng quan (tên CSDL, số bảng, số cột) | Chi tiết (hệ quản trị, SQL/NoSQL, tên bảng, cột) | Thêm / sửa / xoá |
|---|---|---|---|
| Super Admin | ✔ tất cả | ✔ tất cả | ✔ mọi thứ + quản lý người dùng |
| Chuyên viên | ✔ tất cả | ✔ chỉ CSDL được admin cấp, trong sở mình và đơn vị trực thuộc | ✘ chỉ đọc |
| Khách (mới đăng ký) | ✔ tất cả | ✘ | ✘ |

## Đăng nhập & đăng ký

- **Đăng ký:** đồng ý xử lý dữ liệu sinh trắc → quét khuôn mặt (3 mẫu chính diện + kiểm tra người thật) → **chọn**
  email từ tài khoản Google (không có ô nhập tay) → khai báo cơ quan (chờ admin duyệt).
- **Đăng nhập:** Face ID. Nếu camera bị che / không có / bị từ chối → đăng nhập bằng Google với email đã liên kết.
- Chỉ lưu vector đặc trưng 128 chiều, không lưu ảnh. Nhận diện chạy hoàn toàn trên trình duyệt
  (`@vladmandic/face-api`, model tự host ở `/models`, dự phòng CDN; tự chuyển GPU → CPU nếu GPU lỗi).

### Các trường hợp ẩn đã xử lý

**Camera / thiết bị:** chưa HTTPS · trình duyệt trong Zalo/Facebook không hỗ trợ · từ chối quyền · không có camera ·
camera bị app khác chiếm · hộp thoại xin quyền bị bỏ qua (timeout) · máy không chịu độ phân giải → tự hạ cấu hình ·
camera bị che (khung hình tối đen > 2,5s) · thiếu sáng · bị rút/ngắt giữa chừng · iOS cần `playsinline` + `muted` ·
chuyển tab → tự tắt camera · thiết bị yếu → tự giảm kích thước đầu vào, không có WebGL → chạy CPU · không tải được model.

**Nhận diện:** nhiều khuôn mặt · mặt quá xa/gần/lệch · chống ảnh tĩnh (chớp mắt, tự chuyển sang quay đầu nếu đeo kính) ·
đổi người giữa chừng → quét lại · 2 tài khoản quá giống nhau → không tự quyết, buộc dùng Google · sai 5 lần → khoá Face ID
60s · một khuôn mặt không được đăng ký 2 tài khoản · một email Google chỉ gắn 1 tài khoản · email chưa đăng ký không đăng
nhập bằng Google được · rời trang khi đang đăng ký → cảnh báo, không lưu dở dang.

**Phiên & quyền:** hết hạn tuyệt đối 8h, không thao tác 30 phút · bị khoá/xoá khi đang đăng nhập (kể cả ở tab khác) → đăng
xuất ngay · không thể khoá/hạ quyền/xoá Super Admin cuối cùng hoặc tự xoá mình · chuyển chuyên viên sang cơ quan khác,
đổi cơ quan chủ quản của CSDL, xoá CSDL/cơ quan → tự thu hồi quyền ngoài phạm vi · xoá cơ quan còn đơn vị con bị chặn ·
chống vòng lặp quan hệ trực thuộc · trùng tên bảng/cột · tìm kiếm **không** khớp tên bảng/cột của CSDL không được cấp
quyền (tránh lộ cấu trúc) · chống open-redirect `?next=` · localStorage đầy/bị chặn/hỏng dữ liệu → cảnh báo & tự khôi phục.

**3D:** không hỗ trợ WebGL hoặc mất WebGL context → chế độ danh sách · liên kết chia sẻ `?org=&db=` với id không hợp lệ ·
chọn đối tượng vừa bị xoá ở tab khác · `prefers-reduced-motion`.

> ⚠️ Đây là bản giao diện không có backend: dữ liệu nằm trong localStorage và mọi kiểm tra quyền chạy phía client. Khi đưa
> vào vận hành, cần API server để lưu trữ, xác minh chữ ký Google ID token và thực thi phân quyền.

## Hiệu năng 3D

Mọi cơ quan, mọi tầng CSDL, mọi đường nối và mọi nhịp dữ liệu được vẽ bằng instancing / 1 buffer chung → **10 draw call
cố định** dù có 40 hay 5.000 CSDL (bản đầu: 6.505 draw call với 1.000 CSDL). Trên 2.500 tầng, mỗi CSDL gộp thành 1 trụ (LOD).
Nhãn HTML chỉ hiện cho cơ quan cấp 1–2, đối tượng đang chọn/hover và tối đa 16 kết quả tìm kiếm. `PerformanceMonitor` tự hạ
DPR, tắt khử răng cưa và giảm số nhịp khi FPS giảm.

## Thương hiệu & UI/UX

Xem [`docs/BRAND.md`](docs/BRAND.md) hoặc trang `/brand`: 18 token màu × 2 chế độ, 9 màu hình khối 3D, 2 họ font
(Be Vietnam Pro, JetBrains Mono), 8 cỡ chữ, lưới 4px, 4 breakpoint, giọng văn và ngôn ngữ 3D.

## Cấu trúc

```
app/                 login · register · (atlas) · admin · profile · brand · faceid-check
components/atlas/    AtlasScene (three.js/R3F) · layout · InfoPanel · ListView
components/          FaceScanner · GoogleAccountPicker · AppShell · auth · ui
lib/                 seed · store (localStorage) · access · face/* · google · brand · design/tokens · stress
public/models/       model nhận diện khuôn mặt (tự host)
```
