import type { Column, DatabaseSystem, Engine, Org, Table } from "./types";

/**
 * Cơ cấu tổ chức theo phương án sắp xếp bộ máy năm 2025 của tỉnh Hà Tĩnh
 * (hợp nhất KH&ĐT + Tài chính, NN&PTNT + TN&MT, Xây dựng + GTVT, KH&CN + TT&TT, Nội vụ + LĐ-TB&XH).
 * Danh mục CSDL bên dưới là DỮ LIỆU MINH HOẠ – Super Admin cập nhật số liệu thật trong trang Quản trị.
 */
export const SEED_ORGS: Org[] = [
  { id: "hdnd", name: "Hội đồng nhân dân tỉnh Hà Tĩnh", shortName: "HĐND tỉnh", kind: "council", description: "Cơ quan quyền lực nhà nước ở địa phương." },
  { id: "vp-dbqh-hdnd", name: "Văn phòng Đoàn ĐBQH và HĐND tỉnh", shortName: "VP Đoàn ĐBQH & HĐND", kind: "office", parentId: "hdnd", description: "Cơ quan tham mưu, giúp việc Đoàn ĐBQH, HĐND và Thường trực HĐND tỉnh." },

  { id: "ubnd", name: "Ủy ban nhân dân tỉnh Hà Tĩnh", shortName: "UBND tỉnh", kind: "government", description: "Cơ quan hành chính nhà nước ở địa phương." },
  { id: "vp-ubnd", name: "Văn phòng UBND tỉnh", shortName: "VP UBND", kind: "office", parentId: "ubnd", description: "Tham mưu tổng hợp, điều hành; quản lý Cổng TTĐT và công báo tỉnh." },
  { id: "tt-cong-bao", name: "Trung tâm Công báo – Tin học", shortName: "TT Công báo – Tin học", kind: "center", parentId: "vp-ubnd", description: "Xuất bản Công báo tỉnh, vận hành hạ tầng tin học Văn phòng." },
  { id: "tt-hcc", name: "Trung tâm Phục vụ hành chính công tỉnh", shortName: "TT Phục vụ HCC", kind: "center", parentId: "vp-ubnd", description: "Tiếp nhận, trả kết quả thủ tục hành chính một cửa." },

  { id: "so-noi-vu", name: "Sở Nội vụ", shortName: "Sở Nội vụ", kind: "department", parentId: "ubnd", renamedFrom: "Hợp nhất Sở Nội vụ và Sở Lao động – Thương binh và Xã hội (2025)" },
  { id: "tt-dvvl", name: "Trung tâm Dịch vụ việc làm", shortName: "TT Dịch vụ việc làm", kind: "center", parentId: "so-noi-vu" },
  { id: "tt-luu-tru", name: "Trung tâm Lưu trữ lịch sử", shortName: "TT Lưu trữ lịch sử", kind: "center", parentId: "so-noi-vu" },

  { id: "so-tai-chinh", name: "Sở Tài chính", shortName: "Sở Tài chính", kind: "department", parentId: "ubnd", renamedFrom: "Hợp nhất Sở Kế hoạch và Đầu tư và Sở Tài chính (2025)" },
  { id: "tt-xtdt", name: "Trung tâm Xúc tiến đầu tư và Hỗ trợ doanh nghiệp", shortName: "TT Xúc tiến ĐT & HTDN", kind: "center", parentId: "so-tai-chinh" },

  { id: "so-tu-phap", name: "Sở Tư pháp", shortName: "Sở Tư pháp", kind: "department", parentId: "ubnd" },
  { id: "tt-tgpl", name: "Trung tâm Trợ giúp pháp lý nhà nước", shortName: "TT Trợ giúp pháp lý", kind: "center", parentId: "so-tu-phap" },
  { id: "tt-dau-gia", name: "Trung tâm Dịch vụ đấu giá tài sản", shortName: "TT Đấu giá tài sản", kind: "center", parentId: "so-tu-phap" },

  { id: "so-cong-thuong", name: "Sở Công Thương", shortName: "Sở Công Thương", kind: "department", parentId: "ubnd" },
  { id: "tt-khuyen-cong", name: "Trung tâm Khuyến công và Xúc tiến thương mại", shortName: "TT Khuyến công & XTTM", kind: "center", parentId: "so-cong-thuong" },

  { id: "so-nnmt", name: "Sở Nông nghiệp và Môi trường", shortName: "Sở NN & MT", kind: "department", parentId: "ubnd", renamedFrom: "Hợp nhất Sở NN&PTNT và Sở TN&MT (2025)" },
  { id: "vp-dkdd", name: "Văn phòng Đăng ký đất đai", shortName: "VP Đăng ký đất đai", kind: "center", parentId: "so-nnmt" },
  { id: "tt-quan-trac", name: "Trung tâm Quan trắc tài nguyên và môi trường", shortName: "TT Quan trắc TN&MT", kind: "center", parentId: "so-nnmt" },
  { id: "tt-khuyen-nong", name: "Trung tâm Khuyến nông", shortName: "TT Khuyến nông", kind: "center", parentId: "so-nnmt" },

  { id: "so-xay-dung", name: "Sở Xây dựng", shortName: "Sở Xây dựng", kind: "department", parentId: "ubnd", renamedFrom: "Hợp nhất Sở Xây dựng và Sở Giao thông vận tải (2025)" },
  { id: "tt-quy-hoach", name: "Trung tâm Quy hoạch và Kiểm định xây dựng", shortName: "TT Quy hoạch & KĐXD", kind: "center", parentId: "so-xay-dung" },

  { id: "so-khcn", name: "Sở Khoa học và Công nghệ", shortName: "Sở KH&CN", kind: "department", parentId: "ubnd", renamedFrom: "Hợp nhất Sở KH&CN và Sở Thông tin và Truyền thông (2025)" },
  { id: "tt-dhtm", name: "Trung tâm Điều hành thông minh, Khoa học công nghệ và Đổi mới sáng tạo", shortName: "TT Điều hành thông minh, KHCN & ĐMST", kind: "center", parentId: "so-khcn", renamedFrom: "Tên mới sau sắp xếp (2025) – vận hành IOC, Trung tâm dữ liệu và nền tảng LGSP của tỉnh", description: "Vận hành Trung tâm điều hành thông minh (IOC), trung tâm dữ liệu và trục LGSP." },
  { id: "tt-tdc", name: "Trung tâm Kỹ thuật Tiêu chuẩn Đo lường Chất lượng", shortName: "TT Kỹ thuật TĐC", kind: "center", parentId: "so-khcn" },

  { id: "so-gddt", name: "Sở Giáo dục và Đào tạo", shortName: "Sở GD&ĐT", kind: "department", parentId: "ubnd" },
  { id: "so-y-te", name: "Sở Y tế", shortName: "Sở Y tế", kind: "department", parentId: "ubnd" },
  { id: "cdc", name: "Trung tâm Kiểm soát bệnh tật (CDC)", shortName: "CDC Hà Tĩnh", kind: "center", parentId: "so-y-te" },

  { id: "so-vhttdl", name: "Sở Văn hóa, Thể thao và Du lịch", shortName: "Sở VH-TT&DL", kind: "department", parentId: "ubnd" },
  { id: "tt-xtdl", name: "Trung tâm Xúc tiến Du lịch", shortName: "TT Xúc tiến Du lịch", kind: "center", parentId: "so-vhttdl" },

  { id: "thanh-tra", name: "Thanh tra tỉnh", shortName: "Thanh tra tỉnh", kind: "inspectorate", parentId: "ubnd" },
];

// ---- Helpers cho khai báo ngắn gọn -------------------------------------------------------------
// Cột: "*ten:kieu" = khoá chính, "ten:kieu?" = cho phép null
const col = (spec: string): Column => {
  const pk = spec.startsWith("*");
  const s = pk ? spec.slice(1) : spec;
  const nullable = s.endsWith("?");
  const [name, type] = (nullable ? s.slice(0, -1) : s).split(":");
  return { name, type: type ?? "text", pk: pk || undefined, nullable: nullable || undefined };
};
const t = (dbId: string, name: string, cols: string[]): Table => ({
  id: `${dbId}.${name}`,
  name,
  columns: cols.map(col),
});
const db = (
  id: string,
  orgId: string,
  title: string,
  purpose: string,
  engine: Engine,
  tables: [string, string[]][],
  links: string[] = [],
  viaLgsp = true,
): DatabaseSystem => ({
  id,
  orgId,
  title,
  purpose,
  engine,
  tables: tables.map(([n, c]) => t(id, n, c)),
  links,
  viaLgsp,
  updatedAt: "2026-09-01T00:00:00.000Z",
});

const AUDIT = ["created_at:timestamptz", "updated_at:timestamptz?"];

export const SEED_DATABASES: DatabaseSystem[] = [
  db("db-hdnd-ky-hop", "vp-dbqh-hdnd", "CSDL Kỳ họp & Nghị quyết HĐND", "Quản lý kỳ họp, tài liệu, nghị quyết và chất vấn.", "PostgreSQL", [
    ["ky_hop", ["*id:uuid", "khoa:int", "so_ky_hop:int", "ngay_bat_dau:date", "ngay_ket_thuc:date?", ...AUDIT]],
    ["nghi_quyet", ["*id:uuid", "ky_hop_id:uuid", "so_hieu:varchar(32)", "trich_yeu:text", "ngay_ban_hanh:date", "file_url:text?"]],
    ["dai_bieu", ["*id:uuid", "ho_ten:varchar(128)", "don_vi_bau_cu:varchar(128)", "nhiem_ky:varchar(16)"]],
    ["chat_van", ["*id:uuid", "dai_bieu_id:uuid", "co_quan_tra_loi:varchar(128)", "noi_dung:text", "trang_thai:varchar(16)"]],
  ], ["db-vbqppl"]),
  db("db-kien-nghi-cu-tri", "vp-dbqh-hdnd", "CSDL Kiến nghị cử tri", "Tổng hợp, theo dõi giải quyết kiến nghị cử tri.", "MongoDB", [
    ["kien_nghi", ["*_id:ObjectId", "ky_tiep_xuc:string", "linh_vuc:string", "noi_dung:string", "co_quan_giai_quyet:string", "trang_thai:string"]],
    ["phan_hoi", ["*_id:ObjectId", "kien_nghi_id:ObjectId", "noi_dung:string", "ngay:Date"]],
  ], ["db-hdnd-ky-hop"]),

  db("db-qlvb", "vp-ubnd", "Hệ thống Quản lý văn bản & điều hành", "Văn bản đến/đi, luồng xử lý, chữ ký số liên thông 4 cấp.", "SQL Server", [
    ["van_ban_den", ["*id:bigint", "so_den:int", "noi_gui:nvarchar(256)", "trich_yeu:nvarchar(max)", "ngay_den:datetime2", "do_khan:tinyint"]],
    ["van_ban_di", ["*id:bigint", "so_ky_hieu:nvarchar(64)", "nguoi_ky:nvarchar(128)", "ngay_ky:datetime2", "chu_ky_so:varbinary(max)?"]],
    ["luong_xu_ly", ["*id:bigint", "van_ban_id:bigint", "can_bo_id:int", "hanh_dong:nvarchar(32)", "thoi_diem:datetime2"]],
    ["so_van_ban", ["*id:int", "ten_so:nvarchar(128)", "nam:smallint"]],
  ], ["db-dvc"]),
  db("db-cong-bao", "tt-cong-bao", "CSDL Công báo tỉnh", "Lưu trữ, xuất bản số Công báo điện tử.", "MySQL", [
    ["so_cong_bao", ["*id:int", "so:int", "nam:year", "ngay_xuat_ban:date", "file_pdf:varchar(255)"]],
    ["van_ban_dang", ["*id:int", "so_cong_bao_id:int", "so_ky_hieu:varchar(64)", "co_quan_ban_hanh:varchar(128)", "trang:varchar(16)"]],
  ], ["db-vbqppl", "db-qlvb"]),
  db("db-dvc", "tt-hcc", "Hệ thống thông tin giải quyết TTHC", "Hồ sơ một cửa, dịch vụ công trực tuyến, đồng bộ Cổng DVC quốc gia.", "Oracle", [
    ["ho_so", ["*ma_ho_so:varchar2(32)", "thu_tuc_id:number", "cong_dan_cccd:varchar2(12)", "ngay_nop:date", "han_xu_ly:date", "trang_thai:varchar2(16)"]],
    ["thu_tuc", ["*id:number", "ma_thu_tuc:varchar2(32)", "ten:nvarchar2(512)", "linh_vuc:varchar2(64)", "muc_do:number(1)"]],
    ["thanh_phan_ho_so", ["*id:number", "ma_ho_so:varchar2(32)", "ten_giay_to:nvarchar2(256)", "file_ref:varchar2(255)"]],
    ["danh_gia", ["*id:number", "ma_ho_so:varchar2(32)", "diem:number(1)", "y_kien:nclob?"]],
    ["thanh_toan", ["*id:number", "ma_ho_so:varchar2(32)", "so_tien:number(18,2)", "kenh:varchar2(32)"]],
  ], ["db-ho-tich", "db-dat-dai", "db-dkkd"]),

  db("db-cbccvc", "so-noi-vu", "CSDL Cán bộ, công chức, viên chức", "Hồ sơ nhân sự, biên chế, đồng bộ CSDL quốc gia về CBCCVC.", "PostgreSQL", [
    ["can_bo", ["*id:uuid", "ho_ten:varchar(128)", "ngay_sinh:date", "cccd:char(12)", "co_quan_id:uuid", "ngach:varchar(16)", "bac_luong:numeric(4,2)"]],
    ["qua_trinh_cong_tac", ["*id:uuid", "can_bo_id:uuid", "tu_ngay:date", "den_ngay:date?", "chuc_vu:varchar(128)"]],
    ["dao_tao_boi_duong", ["*id:uuid", "can_bo_id:uuid", "chuong_trinh:varchar(256)", "nam:int"]],
    ["bien_che", ["*id:uuid", "co_quan_id:uuid", "nam:int", "so_duoc_giao:int", "so_co_mat:int"]],
    ["khen_thuong_ky_luat", ["*id:uuid", "can_bo_id:uuid", "loai:varchar(16)", "quyet_dinh:varchar(64)", "ngay:date"]],
  ]),
  db("db-an-sinh", "so-noi-vu", "CSDL An sinh xã hội", "Đối tượng bảo trợ xã hội, người có công, hộ nghèo.", "PostgreSQL", [
    ["doi_tuong_btxh", ["*id:uuid", "cccd:char(12)", "loai_doi_tuong:varchar(32)", "muc_tro_cap:numeric(12,0)", "xa_phuong:varchar(64)"]],
    ["nguoi_co_cong", ["*id:uuid", "cccd:char(12)", "dien:varchar(64)", "so_ho_so:varchar(32)"]],
    ["ho_ngheo", ["*id:uuid", "ma_ho:varchar(32)", "nam:int", "phan_loai:varchar(16)"]],
  ], ["db-dvc"]),
  db("db-viec-lam", "tt-dvvl", "CSDL Thị trường lao động – việc làm", "Cung – cầu lao động, bảo hiểm thất nghiệp.", "MySQL", [
    ["nguoi_lao_dong", ["*id:bigint", "cccd:char(12)", "trinh_do:varchar(32)", "nganh_nghe:varchar(64)", "tinh_trang:varchar(16)"]],
    ["nhu_cau_tuyen_dung", ["*id:bigint", "doanh_nghiep_mst:varchar(14)", "vi_tri:varchar(128)", "so_luong:int"]],
    ["tro_cap_that_nghiep", ["*id:bigint", "nguoi_lao_dong_id:bigint", "so_thang:int", "tu_ngay:date"]],
  ], ["db-dkkd"]),
  db("db-luu-tru", "tt-luu-tru", "CSDL Tài liệu lưu trữ điện tử", "Mục lục hồ sơ, tài liệu số hoá phông lưu trữ tỉnh.", "Elasticsearch", [
    ["phong_luu_tru", ["*_id:keyword", "ten_phong:text", "co_quan:keyword", "thoi_gian:date_range"]],
    ["ho_so_luu_tru", ["*_id:keyword", "phong_id:keyword", "tieu_de:text", "thoi_han_bao_quan:keyword", "noi_dung_ocr:text"]],
  ]),

  db("db-ngan-sach", "so-tai-chinh", "CSDL Tài chính – Ngân sách", "Dự toán, quyết toán ngân sách địa phương.", "Oracle", [
    ["du_toan", ["*id:number", "nam:number(4)", "don_vi_id:number", "chuong:varchar2(8)", "tieu_muc:varchar2(8)", "so_tien:number(18,0)"]],
    ["quyet_toan", ["*id:number", "nam:number(4)", "don_vi_id:number", "so_tien:number(18,0)"]],
    ["tai_san_cong", ["*id:number", "don_vi_id:number", "loai:varchar2(32)", "nguyen_gia:number(18,0)", "nam_su_dung:number(4)"]],
  ]),
  db("db-dau-tu-cong", "so-tai-chinh", "CSDL Đầu tư công", "Danh mục dự án, kế hoạch vốn trung hạn, giải ngân.", "PostgreSQL", [
    ["du_an", ["*id:uuid", "ma_du_an:varchar(32)", "ten:text", "chu_dau_tu:varchar(256)", "tong_muc:numeric(18,0)", "nhom:char(1)"]],
    ["ke_hoach_von", ["*id:uuid", "du_an_id:uuid", "nam:int", "so_von:numeric(18,0)"]],
    ["giai_ngan", ["*id:uuid", "du_an_id:uuid", "thang:date", "so_tien:numeric(18,0)"]],
  ], ["db-ngan-sach", "db-cong-trinh"]),
  db("db-dkkd", "so-tai-chinh", "CSDL Đăng ký doanh nghiệp (bản sao địa phương)", "Đồng bộ từ Hệ thống thông tin quốc gia về đăng ký doanh nghiệp.", "PostgreSQL", [
    ["doanh_nghiep", ["*mst:varchar(14)", "ten:text", "loai_hinh:varchar(64)", "dia_chi:text", "ngay_thanh_lap:date", "trang_thai:varchar(16)"]],
    ["nganh_nghe_kd", ["*id:uuid", "mst:varchar(14)", "ma_nganh:varchar(8)", "chinh:boolean"]],
  ]),
  db("db-xtdt", "tt-xtdt", "CSDL Nhà đầu tư & dự án kêu gọi", "Danh mục dự án kêu gọi đầu tư, nhà đầu tư quan tâm.", "MongoDB", [
    ["du_an_keu_goi", ["*_id:ObjectId", "ten:string", "linh_vuc:string", "dia_diem:GeoJSON", "quy_mo_von:Decimal128"]],
    ["nha_dau_tu", ["*_id:ObjectId", "ten:string", "quoc_gia:string", "lien_he:object"]],
  ], ["db-dau-tu-cong"]),

  db("db-ho-tich", "so-tu-phap", "CSDL Hộ tịch điện tử", "Khai sinh, kết hôn, khai tử – liên thông CSDL quốc gia về dân cư.", "SQL Server", [
    ["khai_sinh", ["*id:bigint", "so_dang_ky:nvarchar(32)", "ho_ten:nvarchar(128)", "ngay_sinh:date", "noi_dang_ky:nvarchar(128)"]],
    ["ket_hon", ["*id:bigint", "so_dang_ky:nvarchar(32)", "chong_cccd:char(12)", "vo_cccd:char(12)", "ngay_dang_ky:date"]],
    ["khai_tu", ["*id:bigint", "so_dang_ky:nvarchar(32)", "cccd:char(12)", "ngay_mat:date"]],
  ], ["db-dvc"]),
  db("db-vbqppl", "so-tu-phap", "CSDL Văn bản quy phạm pháp luật tỉnh", "Hệ thống hoá, rà soát văn bản QPPL của HĐND, UBND tỉnh.", "PostgreSQL", [
    ["van_ban", ["*id:uuid", "so_ky_hieu:varchar(64)", "loai:varchar(32)", "co_quan_ban_hanh:varchar(128)", "hieu_luc:varchar(16)", "ngay_hieu_luc:date"]],
    ["ra_soat", ["*id:uuid", "van_ban_id:uuid", "ket_qua:varchar(32)", "ngay:date"]],
  ]),
  db("db-ly-lich-tu-phap", "so-tu-phap", "CSDL Lý lịch tư pháp", "Thông tin lý lịch tư pháp, cấp phiếu LLTP.", "Oracle", [
    ["ly_lich", ["*id:number", "cccd:varchar2(12)", "an_tich:nclob?", "cap_nhat:date"]],
    ["phieu_lltp", ["*id:number", "ly_lich_id:number", "loai_phieu:number(1)", "ngay_cap:date"]],
  ], ["db-dvc"]),
  db("db-tgpl", "tt-tgpl", "CSDL Vụ việc trợ giúp pháp lý", "Theo dõi vụ việc, người được TGPL.", "MySQL", [
    ["vu_viec", ["*id:int", "linh_vuc:varchar(64)", "hinh_thuc:varchar(32)", "tro_giup_vien_id:int", "trang_thai:varchar(16)"]],
    ["nguoi_duoc_tgpl", ["*id:int", "dien:varchar(64)", "cccd:char(12)"]],
  ]),
  db("db-dau-gia", "tt-dau-gia", "CSDL Tài sản đấu giá", "Cuộc đấu giá, tài sản, kết quả.", "MySQL", [
    ["cuoc_dau_gia", ["*id:int", "tai_san:text", "gia_khoi_diem:decimal(18,0)", "ngay:date", "ket_qua:decimal(18,0)?"]],
  ], [], false),

  db("db-cong-thuong", "so-cong-thuong", "CSDL Công nghiệp – Thương mại", "Cụm công nghiệp, chợ, cửa hàng xăng dầu, năng lượng.", "PostgreSQL", [
    ["cum_cong_nghiep", ["*id:uuid", "ten:varchar(256)", "dien_tich_ha:numeric(10,2)", "ty_le_lap_day:numeric(5,2)", "geom:geometry(Polygon)"]],
    ["cho", ["*id:uuid", "ten:varchar(256)", "hang:smallint", "xa_phuong:varchar(64)"]],
    ["cua_hang_xang_dau", ["*id:uuid", "ten:varchar(256)", "mst:varchar(14)", "giay_phep:varchar(64)"]],
    ["du_an_nang_luong", ["*id:uuid", "loai:varchar(32)", "cong_suat_mw:numeric(10,2)"]],
  ], ["db-dkkd"]),
  db("db-khuyen-cong", "tt-khuyen-cong", "CSDL Sản phẩm OCOP & xúc tiến thương mại", "Sản phẩm OCOP, hội chợ, doanh nghiệp tham gia.", "MongoDB", [
    ["san_pham_ocop", ["*_id:ObjectId", "ten:string", "hang_sao:int", "chu_the:string", "hinh_anh:array"]],
    ["hoi_cho", ["*_id:ObjectId", "ten:string", "thoi_gian:Date", "doanh_nghiep:array"]],
  ], ["db-nong-nghiep"]),

  db("db-dat-dai", "vp-dkdd", "CSDL Đất đai", "Hồ sơ địa chính, bản đồ địa chính, biến động – kết nối CSDL đất đai quốc gia.", "PostgreSQL", [
    ["thua_dat", ["*id:uuid", "so_to:int", "so_thua:int", "dien_tich:numeric(12,2)", "muc_dich_su_dung:varchar(16)", "geom:geometry(MultiPolygon,5899)"]],
    ["chu_su_dung", ["*id:uuid", "loai:varchar(16)", "ho_ten_hoac_ten_to_chuc:text", "giay_to_id:varchar(32)"]],
    ["giay_chung_nhan", ["*id:uuid", "so_phat_hanh:varchar(16)", "thua_dat_id:uuid", "ngay_cap:date"]],
    ["bien_dong", ["*id:uuid", "thua_dat_id:uuid", "loai_bien_dong:varchar(32)", "ngay:date", "ho_so_dvc:varchar(32)?"]],
    ["gia_dat", ["*id:uuid", "vi_tri:varchar(64)", "loai_dat:varchar(16)", "don_gia:numeric(14,0)", "nam:int"]],
  ], ["db-dvc", "db-quy-hoach"]),
  db("db-moi-truong", "tt-quan-trac", "CSDL Quan trắc môi trường", "Dữ liệu trạm quan trắc tự động nước, không khí theo thời gian thực.", "Cassandra", [
    ["tram_quan_trac", ["*ma_tram:text", "loai:text", "toa_do:frozen<point>", "don_vi_quan_ly:text"]],
    ["so_lieu_theo_gio", ["*ma_tram:text", "*thoi_diem:timestamp", "chi_tieu:text", "gia_tri:double", "vuot_nguong:boolean"]],
  ]),
  db("db-tai-nguyen-nuoc", "so-nnmt", "CSDL Tài nguyên nước & khoáng sản", "Giấy phép khai thác, công trình thuỷ lợi, mỏ khoáng sản.", "PostgreSQL", [
    ["giay_phep_khai_thac", ["*id:uuid", "loai:varchar(32)", "to_chuc:text", "thoi_han:date", "cong_suat:numeric(12,2)"]],
    ["mo_khoang_san", ["*id:uuid", "ten:text", "loai_khoang_san:varchar(64)", "geom:geometry(Polygon)"]],
    ["cong_trinh_thuy_loi", ["*id:uuid", "ten:text", "loai:varchar(32)", "dung_tich:numeric(14,2)"]],
  ], ["db-moi-truong"]),
  db("db-nong-nghiep", "tt-khuyen-nong", "CSDL Nông nghiệp", "Vùng trồng, mã số vùng trồng, chăn nuôi, dịch bệnh.", "MySQL", [
    ["vung_trong", ["*id:bigint", "ma_so:varchar(32)", "cay_trong:varchar(64)", "dien_tich_ha:decimal(10,2)"]],
    ["co_so_chan_nuoi", ["*id:bigint", "chu_co_so:varchar(128)", "vat_nuoi:varchar(32)", "quy_mo:int"]],
    ["dich_benh", ["*id:bigint", "loai:varchar(64)", "xa_phuong:varchar(64)", "ngay_phat_hien:date"]],
  ]),

  db("db-cong-trinh", "so-xay-dung", "CSDL Công trình xây dựng & giấy phép", "Giấy phép xây dựng, chất lượng công trình, nhà ở.", "SQL Server", [
    ["giay_phep_xd", ["*id:bigint", "so_giay_phep:nvarchar(32)", "chu_dau_tu:nvarchar(256)", "dia_diem:nvarchar(256)", "ngay_cap:date"]],
    ["cong_trinh", ["*id:bigint", "ten:nvarchar(256)", "cap:tinyint", "loai:nvarchar(64)"]],
    ["nha_o_xa_hoi", ["*id:bigint", "du_an:nvarchar(256)", "so_can:int", "trang_thai:nvarchar(32)"]],
  ], ["db-dvc", "db-quy-hoach"]),
  db("db-giao-thong", "so-xay-dung", "CSDL Kết cấu hạ tầng giao thông", "Mạng lưới đường, cầu, bến xe; phương tiện, giấy phép lái xe.", "PostgreSQL", [
    ["tuyen_duong", ["*id:uuid", "ma_tuyen:varchar(16)", "cap_quan_ly:varchar(16)", "chieu_dai_km:numeric(8,2)", "geom:geometry(LineString)"]],
    ["cau", ["*id:uuid", "ten:varchar(128)", "tai_trong_tan:numeric(6,1)", "tinh_trang:varchar(32)"]],
    ["ben_xe", ["*id:uuid", "ten:varchar(128)", "loai:smallint"]],
    ["giay_phep_lai_xe", ["*id:uuid", "so:varchar(16)", "hang:varchar(4)", "cccd:char(12)", "han:date?"]],
  ]),
  db("db-quy-hoach", "tt-quy-hoach", "CSDL Quy hoạch xây dựng", "Đồ án quy hoạch chung, phân khu, chi tiết (GIS).", "PostgreSQL", [
    ["do_an_quy_hoach", ["*id:uuid", "ten:text", "cap_do:varchar(16)", "quyet_dinh:varchar(64)", "geom:geometry(MultiPolygon)"]],
    ["o_chuc_nang", ["*id:uuid", "do_an_id:uuid", "ky_hieu:varchar(16)", "chuc_nang:varchar(64)", "mat_do_xd:numeric(5,2)"]],
  ]),

  db("db-lgsp", "tt-dhtm", "Nền tảng tích hợp, chia sẻ dữ liệu (LGSP)", "Trục liên thông dữ liệu dùng chung của tỉnh, kết nối NDXP quốc gia.", "PostgreSQL", [
    ["dich_vu_api", ["*id:uuid", "ten:varchar(128)", "he_thong_cung_cap:varchar(128)", "phien_ban:varchar(16)", "trang_thai:varchar(16)"]],
    ["ung_dung_ket_noi", ["*id:uuid", "ten:varchar(128)", "co_quan:varchar(128)", "client_id:varchar(64)"]],
    ["nhat_ky_giao_dich", ["*id:bigint", "api_id:uuid", "app_id:uuid", "thoi_diem:timestamptz", "ma_ket_qua:int", "do_tre_ms:int"]],
  ], [], false),
  db("db-ioc", "tt-dhtm", "Kho dữ liệu IOC – Điều hành thông minh", "Chỉ số KT-XH, camera, phản ánh hiện trường, dashboard lãnh đạo.", "Elasticsearch", [
    ["chi_so_kt_xh", ["*_id:keyword", "chi_tieu:keyword", "ky:date", "gia_tri:double", "nguon:keyword"]],
    ["phan_anh_hien_truong", ["*_id:keyword", "noi_dung:text", "vi_tri:geo_point", "trang_thai:keyword", "don_vi_xu_ly:keyword"]],
    ["su_kien_camera", ["*_id:keyword", "camera_id:keyword", "loai_su_kien:keyword", "thoi_diem:date"]],
  ], ["db-dvc", "db-ngan-sach", "db-moi-truong", "db-y-te"]),
  db("db-cache-sso", "tt-dhtm", "Dịch vụ xác thực tập trung (SSO) – phiên", "Lưu phiên đăng nhập một lần cho các hệ thống dùng chung.", "Redis", [
    ["session:*", ["*key:string", "user_id:string", "exp:ttl"]],
    ["token_revoked:*", ["*key:string", "revoked_at:string"]],
  ], [], false),
  db("db-khcn", "so-khcn", "CSDL Khoa học và Công nghệ", "Nhiệm vụ KH&CN, tổ chức KH&CN, chuyên gia, sở hữu trí tuệ.", "MySQL", [
    ["nhiem_vu_khcn", ["*id:int", "ten:text", "cap:varchar(16)", "chu_nhiem:varchar(128)", "kinh_phi:decimal(14,0)", "trang_thai:varchar(16)"]],
    ["chuyen_gia", ["*id:int", "ho_ten:varchar(128)", "linh_vuc:varchar(64)", "hoc_ham:varchar(32)?"]],
    ["so_huu_tri_tue", ["*id:int", "loai:varchar(32)", "so_bang:varchar(32)", "chu_so_huu:varchar(256)"]],
  ]),
  db("db-bao-chi", "so-khcn", "CSDL Báo chí, xuất bản & viễn thông", "Cơ quan báo chí, giấy phép xuất bản, hạ tầng viễn thông (BTS).", "PostgreSQL", [
    ["co_quan_bao_chi", ["*id:uuid", "ten:varchar(256)", "loai_hinh:varchar(32)", "giay_phep:varchar(64)"]],
    ["tram_bts", ["*id:uuid", "nha_mang:varchar(32)", "cong_nghe:varchar(8)", "geom:geometry(Point)"]],
  ]),
  db("db-tdc", "tt-tdc", "CSDL Đo lường – Chất lượng", "Phương tiện đo, kiểm định, hiệu chuẩn.", "SQL Server", [
    ["phuong_tien_do", ["*id:int", "loai:nvarchar(64)", "so_serial:nvarchar(64)", "chu_so_huu:nvarchar(256)"]],
    ["kiem_dinh", ["*id:int", "phuong_tien_id:int", "ngay:date", "ket_qua:nvarchar(16)", "han:date"]],
  ], [], false),

  db("db-giao-duc", "so-gddt", "CSDL Ngành Giáo dục", "Trường, lớp, học sinh, giáo viên – đồng bộ CSDL ngành GD quốc gia.", "SQL Server", [
    ["truong_hoc", ["*id:int", "ma_truong:nvarchar(16)", "ten:nvarchar(256)", "cap_hoc:tinyint", "xa_phuong:nvarchar(64)"]],
    ["hoc_sinh", ["*id:bigint", "ma_dinh_danh:char(12)", "ho_ten:nvarchar(128)", "truong_id:int", "lop:nvarchar(16)"]],
    ["giao_vien", ["*id:int", "ho_ten:nvarchar(128)", "truong_id:int", "mon:nvarchar(32)", "trinh_do:nvarchar(32)"]],
    ["ket_qua_hoc_tap", ["*id:bigint", "hoc_sinh_id:bigint", "nam_hoc:nchar(9)", "xep_loai:nvarchar(16)"]],
  ], ["db-ho-tich"]),
  db("db-thi-tuyen", "so-gddt", "CSDL Thi & tuyển sinh", "Tuyển sinh lớp 10, thi tốt nghiệp THPT.", "PostgreSQL", [
    ["thi_sinh", ["*id:uuid", "so_bao_danh:varchar(12)", "hoc_sinh_id:bigint", "hoi_dong_thi:varchar(64)"]],
    ["diem_thi", ["*id:uuid", "thi_sinh_id:uuid", "mon:varchar(32)", "diem:numeric(4,2)"]],
  ], ["db-giao-duc"]),

  db("db-y-te", "so-y-te", "CSDL Y tế – Hồ sơ sức khoẻ", "Hồ sơ sức khoẻ điện tử, cơ sở KCB, hành nghề y dược.", "PostgreSQL", [
    ["co_so_kcb", ["*id:uuid", "ma_co_so:varchar(8)", "ten:varchar(256)", "tuyen:smallint", "giuong_benh:int"]],
    ["ho_so_suc_khoe", ["*id:uuid", "cccd:char(12)", "nhom_mau:varchar(4)?", "tien_su:jsonb", "cap_nhat:timestamptz"]],
    ["chung_chi_hanh_nghe", ["*id:uuid", "so:varchar(32)", "ho_ten:varchar(128)", "pham_vi:text"]],
    ["co_so_duoc", ["*id:uuid", "ten:varchar(256)", "loai:varchar(32)", "gcn_gpp:varchar(32)?"]],
  ], ["db-an-sinh"]),
  db("db-cdc", "cdc", "CSDL Tiêm chủng & giám sát dịch bệnh", "Tiêm chủng mở rộng, ca bệnh truyền nhiễm.", "MongoDB", [
    ["mui_tiem", ["*_id:ObjectId", "cccd:string", "vaccine:string", "lieu:int", "ngay:Date", "co_so:string"]],
    ["ca_benh", ["*_id:ObjectId", "benh:string", "xa_phuong:string", "ngay_khoi_phat:Date", "phan_loai:string"]],
  ], ["db-y-te"]),

  db("db-van-hoa", "so-vhttdl", "CSDL Di sản văn hoá", "Di tích, lễ hội, di sản phi vật thể, hiện vật bảo tàng.", "PostgreSQL", [
    ["di_tich", ["*id:uuid", "ten:varchar(256)", "cap_xep_hang:varchar(32)", "xa_phuong:varchar(64)", "geom:geometry(Point)"]],
    ["di_san_phi_vat_the", ["*id:uuid", "ten:varchar(256)", "loai_hinh:varchar(64)"]],
    ["hien_vat", ["*id:uuid", "ma:varchar(32)", "ten:varchar(256)", "nien_dai:varchar(64)?"]],
  ]),
  db("db-du-lich", "tt-xtdl", "CSDL Du lịch", "Cơ sở lưu trú, điểm du lịch, lượt khách.", "MySQL", [
    ["co_so_luu_tru", ["*id:int", "ten:varchar(256)", "hang_sao:tinyint?", "so_phong:int"]],
    ["diem_du_lich", ["*id:int", "ten:varchar(256)", "loai:varchar(64)"]],
    ["luot_khach", ["*id:int", "thang:date", "noi_dia:int", "quoc_te:int"]],
  ], ["db-ioc"]),

  db("db-khieu-nai", "thanh-tra", "CSDL Khiếu nại, tố cáo", "Tiếp công dân, xử lý đơn, giải quyết khiếu nại, tố cáo.", "SQL Server", [
    ["tiep_cong_dan", ["*id:bigint", "ngay:date", "nguoi_tiep:nvarchar(128)", "noi_dung:nvarchar(max)"]],
    ["don_thu", ["*id:bigint", "loai:nvarchar(16)", "linh_vuc:nvarchar(64)", "co_quan_giai_quyet:nvarchar(128)", "trang_thai:nvarchar(16)"]],
    ["ket_qua_giai_quyet", ["*id:bigint", "don_id:bigint", "quyet_dinh:nvarchar(64)", "ngay:date"]],
  ]),
  db("db-thanh-tra", "thanh-tra", "CSDL Thanh tra, kiểm tra", "Kế hoạch, cuộc thanh tra, kết luận và kiến nghị xử lý.", "PostgreSQL", [
    ["cuoc_thanh_tra", ["*id:uuid", "doi_tuong:text", "linh_vuc:varchar(64)", "nam:int", "trang_thai:varchar(16)"]],
    ["ket_luan", ["*id:uuid", "cuoc_thanh_tra_id:uuid", "so:varchar(32)", "ngay:date", "kien_nghi_thu_hoi:numeric(18,0)"]],
  ], ["db-ngan-sach"]),
];

/** Đơn vị trung tâm của cảnh 3D (trục LGSP). */
export const HUB_DB_ID = "db-lgsp";
