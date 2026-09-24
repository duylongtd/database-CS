export type OrgKind =
  | "council" // HĐND và cơ quan giúp việc
  | "government" // UBND tỉnh
  | "office" // Văn phòng (UBND / Đoàn ĐBQH & HĐND)
  | "department" // Sở, cơ quan chuyên môn
  | "inspectorate" // Thanh tra tỉnh
  | "center"; // Đơn vị sự nghiệp cấp 2 (trung tâm, văn phòng đăng ký...)

export type Org = {
  id: string;
  name: string;
  shortName: string;
  kind: OrgKind;
  parentId?: string;
  description?: string;
  /** Ghi chú lịch sử: tên cũ / hợp nhất từ đơn vị nào. */
  renamedFrom?: string;
};

export type Engine =
  | "PostgreSQL"
  | "MySQL"
  | "SQL Server"
  | "Oracle"
  | "MongoDB"
  | "Elasticsearch"
  | "Redis"
  | "Cassandra";

export type Paradigm = "SQL" | "NoSQL";

export const ENGINE_PARADIGM: Record<Engine, Paradigm> = {
  PostgreSQL: "SQL",
  MySQL: "SQL",
  "SQL Server": "SQL",
  Oracle: "SQL",
  MongoDB: "NoSQL",
  Elasticsearch: "NoSQL",
  Redis: "NoSQL",
  Cassandra: "NoSQL",
};

export type Column = { name: string; type: string; pk?: boolean; nullable?: boolean; note?: string };
export type Table = { id: string; name: string; columns: Column[] };

export type DatabaseSystem = {
  id: string;
  orgId: string;
  /** Tên chức năng – mọi người dùng đăng nhập đều thấy. */
  title: string;
  purpose: string;
  engine: Engine;
  tables: Table[];
  /** Id các CSDL khác mà hệ này liên thông/đồng bộ dữ liệu. */
  links: string[];
  /** Có kết nối qua nền tảng LGSP của tỉnh hay không. */
  viaLgsp: boolean;
  updatedAt: string;
};

export type Role = "super_admin" | "specialist" | "guest";
export type UserStatus = "active" | "locked";

export type User = {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: Role;
  status: UserStatus;
  /** Cơ quan công tác đã được admin xác nhận. */
  orgId?: string;
  /** Cơ quan người dùng khai báo khi đăng ký – chờ admin duyệt. */
  requestedOrgId?: string;
  /** Danh sách CSDL được cấp quyền đọc chi tiết. */
  grants: string[];
  /** Vector đặc trưng khuôn mặt (128 chiều) – KHÔNG lưu ảnh. */
  faceSamples: number[][];
  createdAt: string;
  lastLoginAt?: string;
};

export type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  action: string;
  target?: string;
};

export type Session = {
  userId: string;
  method: "face" | "google";
  issuedAt: number;
  expiresAt: number;
  lastActiveAt: number;
};

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  specialist: "Chuyên viên",
  guest: "Khách (chờ duyệt)",
};

export const KIND_LABEL: Record<OrgKind, string> = {
  council: "Hội đồng nhân dân",
  government: "Ủy ban nhân dân",
  office: "Văn phòng",
  department: "Sở / cơ quan chuyên môn",
  inspectorate: "Thanh tra",
  center: "Đơn vị trực thuộc",
};
