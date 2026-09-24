/**
 * Thương hiệu MẠCH – một nguồn cho mọi câu chữ mang tính thương hiệu.
 * "Mạch" vừa là mạch nguồn (nơi nước bắt đầu chảy), vừa là mạch kết nối (mạch điện, mạch dữ liệu).
 */
export const BRAND = {
  name: "Mạch",
  place: "Hà Tĩnh",
  full: "Mạch · Bản đồ dữ liệu Hà Tĩnh",
  tagline: "Mạch nguồn dữ liệu đất Hồng Lam",
  promise: "Thấy toàn cảnh dữ liệu của tỉnh – và chỉ thấy chi tiết khi được tin cậy.",
  story: [
    {
      key: "nui",
      title: "Núi giữ",
      body: "Mỗi cơ quan như một đỉnh trong dãy Hồng Lĩnh, lặng lẽ lưu giữ những lớp dữ liệu của mình. Trên bản đồ, mỗi tầng trụ là một bảng dữ liệu.",
    },
    {
      key: "song",
      title: "Sông nối",
      body: "Như sông Lam gom trăm nhánh suối, trục LGSP nối các nguồn dữ liệu thành một dòng chảy chung. Những nhịp sáng màu hồng là dữ liệu đang được trao đổi.",
    },
    {
      key: "nguoi",
      title: "Người hiểu",
      body: "Ai cũng thấy được bức tranh chung. Cấu trúc chi tiết chỉ mở ra với đúng người, đúng cơ quan, khi đã được phân quyền.",
    },
  ],
  voice: {
    traits: [
      { name: "Rõ ràng", desc: "Câu ngắn, động từ đứng trước, không thuật ngữ nếu không cần." },
      { name: "Điềm tĩnh", desc: "Không dấu chấm than, không đổ lỗi. Lỗi luôn đi kèm cách khắc phục." },
      { name: "Đáng tin", desc: "Nói thật điều hệ thống làm với dữ liệu, nhất là dữ liệu khuôn mặt." },
    ],
    examples: [
      { avoid: "Lỗi! Không truy cập được camera!!!", prefer: "Chưa mở được camera. Hãy cho phép quyền camera, hoặc đăng nhập bằng Google." },
      { avoid: "Bạn không có quyền.", prefer: "Cấu trúc CSDL này được bảo mật. Liên hệ quản trị viên của sở để được cấp quyền đọc." },
      { avoid: "Xác thực sinh trắc học thất bại.", prefer: "Chưa nhận ra bạn. Hãy ra chỗ sáng hơn và nhìn thẳng vào camera." },
    ],
  },
} as const;
