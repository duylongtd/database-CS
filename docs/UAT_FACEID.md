# Chạy Face ID trên bản UAT/production

## Checklist deploy
1. **HTTPS bắt buộc.** Trình duyệt chỉ mở camera trên `https://` (hoặc `localhost`).
2. **Model nhận diện đã nằm trong repo** (`public/models`, ~6,8 MB) → deploy là có, không phụ thuộc `postinstall`.
   Nếu `/models` trả 404, ứng dụng tự tải dự phòng từ `cdn.jsdelivr.net`.
3. **Không nhúng trong iframe khác domain** – header `Permissions-Policy: camera=(self)` sẽ chặn camera.
   Nếu reverse proxy (Nginx…) tự thêm `Permissions-Policy`, cần giữ `camera=(self)`.
4. **Google Sign-In (dự phòng khi không có camera):**
   - Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application).
   - *Authorized JavaScript origins*: thêm đúng domain UAT, ví dụ `https://uat.example.gov.vn` (không có `/` cuối).
   - Đặt `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<client-id>` **trước khi build** (biến `NEXT_PUBLIC_*` được nhúng lúc build) rồi deploy lại.
   - Bỏ trống → dùng danh sách tài khoản demo.
5. (Tuỳ chọn) `NEXT_PUBLIC_SUPER_ADMIN_EMAILS=email1@gmail.com,...` để chỉ định Super Admin.

## Kiểm thử trên thiết bị
Mở **`/faceid-check`** trên từng máy (link “Kiểm tra thiết bị” ở trang đăng nhập). Trang kiểm tra HTTPS, quyền camera,
số camera, WebGL, model trên server, localStorage, Google; bật camera để xem trực tiếp số khuôn mặt, độ tin cậy, kích thước,
góc quay đầu, độ mở mắt (EAR), độ sáng, thời gian nhận diện. Nút **Sao chép báo cáo** tạo JSON để gửi lại khi có lỗi.

| # | Bước | Kỳ vọng |
|---|---|---|
| 1 | Đăng ký tài khoản đầu tiên | Quét 3 mẫu → chớp mắt → chọn Google → trở thành Super Admin |
| 2 | Đăng xuất, đăng nhập Face ID | Vào thẳng bản đồ |
| 3 | Đưa ảnh chụp khuôn mặt vào camera | Dừng ở “Kiểm tra người thật”, hết giờ báo *Chưa xác nhận được người thật* |
| 4 | Che camera bằng tay | Sau ~2,5s báo *Camera có vẻ đang bị che* + gợi ý Google |
| 5 | Từ chối quyền camera | Hướng dẫn mở quyền + nút Google |
| 6 | Người khác quét ở máy đã có tài khoản | *Chưa nhận ra bạn (lần 1/5)*; sai 5 lần → khoá Face ID 60s |
| 7 | Mở link trong Zalo/Facebook | `/faceid-check` báo đang ở trình duyệt trong app |
| 8 | Người thứ 2 đăng ký trên cùng máy | Tài khoản Khách, chờ Super Admin duyệt |

## Giới hạn của bản UAT (không backend)
- **Tài khoản lưu trong trình duyệt của từng thiết bị** (localStorage). Đăng ký trên điện thoại thì đăng nhập trên chính
  trình duyệt đó; máy khác không thấy tài khoản. Xoá dữ liệu trình duyệt / chế độ ẩn danh = mất tài khoản.
- Kiểm tra người thật (chớp mắt / quay đầu) chặn ảnh tĩnh, **không** chặn được video deepfake hay mặt nạ 3D.
- Dùng thật trên nhiều thiết bị cần API server: lưu người dùng + vector khuôn mặt, xác minh chữ ký Google ID token, so khớp phía server.
