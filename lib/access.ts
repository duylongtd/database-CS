import type { DatabaseSystem, User } from "./types";

/**
 * Ma trận phân quyền
 * ┌──────────────┬──────────────────────────┬────────────────────────────┬───────────────┐
 * │ Vai trò      │ Tổng quan (tên, số bảng)  │ Chi tiết (engine, bảng, cột)│ Thêm/Sửa/Xoá  │
 * ├──────────────┼──────────────────────────┼────────────────────────────┼───────────────┤
 * │ Super Admin  │ ✔ tất cả                  │ ✔ tất cả                    │ ✔ tất cả      │
 * │ Chuyên viên  │ ✔ tất cả                  │ ✔ CSDL được cấp (trong sở)  │ ✘             │
 * │ Khách        │ ✔ tất cả                  │ ✘                           │ ✘             │
 * └──────────────┴──────────────────────────┴────────────────────────────┴───────────────┘
 */
export function canViewDetail(user: User | null, db: DatabaseSystem): boolean {
  if (!user || user.status !== "active") return false;
  if (user.role === "super_admin") return true;
  if (user.role === "specialist") return user.grants.includes(db.id);
  return false;
}

export const canManage = (user: User | null) => !!user && user.status === "active" && user.role === "super_admin";

export const columnCount = (db: DatabaseSystem) => db.tables.reduce((n, t) => n + t.columns.length, 0);
