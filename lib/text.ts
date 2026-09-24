/** Chuẩn hoá tiếng Việt để tìm kiếm không dấu: "Sở Y tế" ~ "so y te". */
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
