"use client";

import { useSyncExternalStore } from "react";
import { SEED_DATABASES, SEED_ORGS } from "./seed";
import type { AuditEntry, DatabaseSystem, Org, Session, User } from "./types";

/**
 * Store phía client (không backend). Toàn bộ dữ liệu lưu trong localStorage của trình duyệt,
 * đồng bộ giữa các tab qua sự kiện `storage`.
 * LƯU Ý: đây là bản mô phỏng giao diện – khi triển khai thật, mọi kiểm tra quyền phải đặt ở server.
 */

const DATA_KEY = "hatinh-csdl:data";
const SESSION_KEY = "hatinh-csdl:session";
const SCHEMA_VERSION = 2;

export const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // hết hạn tuyệt đối sau 8 giờ
export const IDLE_TTL_MS = 30 * 60 * 1000; // hết hạn khi không thao tác 30 phút

export type Data = {
  version: number;
  orgs: Org[];
  databases: DatabaseSystem[];
  users: User[];
  audit: AuditEntry[];
};

export type StoreState = {
  hydrated: boolean;
  data: Data;
  session: Session | null;
  /** Lỗi lưu trữ gần nhất (vd: hết dung lượng, bị chặn ở chế độ ẩn danh). */
  storageError: string | null;
};

const seedData = (): Data => ({
  version: SCHEMA_VERSION,
  orgs: structuredClone(SEED_ORGS),
  databases: structuredClone(SEED_DATABASES),
  users: [],
  audit: [],
});

const SERVER_STATE: StoreState = { hydrated: false, data: seedData(), session: null, storageError: null };
let state: StoreState = SERVER_STATE;
let loaded = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null): string | null {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
    return null;
  } catch (e) {
    const quota = e instanceof DOMException && (e.name === "QuotaExceededError" || e.code === 22);
    return quota
      ? "Bộ nhớ trình duyệt đã đầy – thay đổi chỉ giữ trong phiên hiện tại."
      : "Trình duyệt chặn lưu trữ cục bộ (chế độ ẩn danh/chính sách) – thay đổi sẽ mất khi tải lại trang.";
  }
}

function isValidData(d: unknown): d is Data {
  const x = d as Data;
  return !!x && Array.isArray(x.orgs) && Array.isArray(x.databases) && Array.isArray(x.users) && Array.isArray(x.audit);
}

function readData(): Data {
  const raw = safeGet(DATA_KEY);
  if (!raw) return seedData();
  try {
    const parsed = JSON.parse(raw);
    if (!isValidData(parsed)) throw new Error("invalid");
    if (parsed.version !== SCHEMA_VERSION) {
      // Nâng cấp schema: giữ người dùng & nhật ký, làm mới danh mục mẫu.
      return { ...seedData(), users: parsed.users, audit: parsed.audit };
    }
    return parsed;
  } catch {
    // Dữ liệu hỏng: sao lưu bản cũ để không mất hẳn, rồi khởi tạo lại.
    safeSet(`${DATA_KEY}:corrupt-${Date.now()}`, raw);
    return seedData();
  }
}

function readSession(): Session | null {
  const raw = safeGet(SESSION_KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Session;
    if (typeof s.userId !== "string" || typeof s.expiresAt !== "number") return null;
    return s;
  } catch {
    return null;
  }
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  state = { hydrated: true, data: readData(), session: readSession(), storageError: null };
  window.addEventListener("storage", (e) => {
    if (e.key === DATA_KEY) state = { ...state, data: readData() };
    else if (e.key === SESSION_KEY) state = { ...state, session: readSession() };
    else if (e.key === null) state = { ...state, data: readData(), session: readSession() };
    else return;
    emit();
  });
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  return () => listeners.delete(l);
}
const getSnapshot = () => {
  load();
  return state;
};
const getServerSnapshot = () => SERVER_STATE;

export function useStore<T>(selector: (s: StoreState) => T): T {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return selector(s);
}
export const getState = () => getSnapshot();

// ---- ghi dữ liệu ----------------------------------------------------------------------------------

function commit(next: Data) {
  const err = safeSet(DATA_KEY, JSON.stringify(next));
  state = { ...state, data: next, storageError: err };
  emit();
}

function setSession(s: Session | null) {
  const err = safeSet(SESSION_KEY, s ? JSON.stringify(s) : null);
  state = { ...state, session: s, storageError: err ?? state.storageError };
  emit();
}

export const uid = (p = "id") =>
  `${p}_${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)}`;

function withAudit(d: Data, actor: string, action: string, target?: string): Data {
  const entry: AuditEntry = { id: uid("log"), at: new Date().toISOString(), actor, action, target };
  return { ...d, audit: [entry, ...d.audit].slice(0, 500) };
}

export class DomainError extends Error {}

const superAdminEmails = () =>
  (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

const activeSuperAdmins = (d: Data) => d.users.filter((u) => u.role === "super_admin" && u.status === "active");

/** Danh sách org mà người thuộc `orgId` có thể được cấp quyền (chính nó + các đơn vị trực thuộc). */
export function orgScope(orgs: Org[], orgId?: string): Set<string> {
  const scope = new Set<string>();
  if (!orgId) return scope;
  const walk = (id: string) => {
    scope.add(id);
    orgs.filter((o) => o.parentId === id).forEach((c) => walk(c.id));
  };
  walk(orgId);
  return scope;
}

function pruneGrants(d: Data, u: User): User {
  if (u.role !== "specialist" || !u.orgId) return { ...u, grants: [] };
  const scope = orgScope(d.orgs, u.orgId);
  const valid = new Set(d.databases.filter((x) => scope.has(x.orgId)).map((x) => x.id));
  return { ...u, grants: u.grants.filter((g) => valid.has(g)) };
}

// ---- Người dùng ------------------------------------------------------------------------------------

export function registerUser(input: {
  email: string;
  name: string;
  picture?: string;
  faceSamples: number[][];
  requestedOrgId?: string;
}): User {
  load();
  const d = state.data;
  const email = input.email.trim().toLowerCase();
  if (!email) throw new DomainError("Thiếu email Google.");
  if (d.users.some((u) => u.email === email)) {
    throw new DomainError("Email này đã được liên kết với một tài khoản khác. Hãy đăng nhập thay vì đăng ký.");
  }
  if (!input.faceSamples.length) throw new DomainError("Chưa có dữ liệu khuôn mặt.");
  const bootstrap = activeSuperAdmins(d).length === 0 && superAdminEmails().length === 0;
  const isSuper = bootstrap || superAdminEmails().includes(email);
  const user: User = {
    id: uid("usr"),
    email,
    name: input.name.trim() || email.split("@")[0],
    picture: input.picture,
    role: isSuper ? "super_admin" : "guest",
    status: "active",
    requestedOrgId: isSuper ? undefined : input.requestedOrgId,
    grants: [],
    faceSamples: input.faceSamples,
    createdAt: new Date().toISOString(),
  };
  commit(withAudit({ ...d, users: [...d.users, user] }, email, isSuper ? "Đăng ký (Super Admin)" : "Đăng ký tài khoản", user.id));
  return user;
}

export function updateUser(actorEmail: string, id: string, patch: Partial<Omit<User, "id" | "email" | "createdAt">>) {
  const d = state.data;
  const cur = d.users.find((u) => u.id === id);
  if (!cur) throw new DomainError("Người dùng không tồn tại (có thể đã bị xoá ở tab khác).");
  let next: User = { ...cur, ...patch };
  const losingSuper =
    cur.role === "super_admin" && cur.status === "active" && (next.role !== "super_admin" || next.status !== "active");
  if (losingSuper && activeSuperAdmins(d).length <= 1) {
    throw new DomainError("Không thể hạ quyền/khoá Super Admin cuối cùng của hệ thống.");
  }
  if (next.role === "specialist" && !next.orgId) throw new DomainError("Chuyên viên phải thuộc một cơ quan.");
  if (next.orgId && next.requestedOrgId === next.orgId) next.requestedOrgId = undefined;
  next = pruneGrants(d, next);
  const users = d.users.map((u) => (u.id === id ? next : u));
  commit(withAudit({ ...d, users }, actorEmail, "Cập nhật người dùng", cur.email));
}

export function deleteUser(actorEmail: string, id: string) {
  const d = state.data;
  const cur = d.users.find((u) => u.id === id);
  if (!cur) return;
  if (cur.email === actorEmail) throw new DomainError("Không thể tự xoá tài khoản đang đăng nhập.");
  if (cur.role === "super_admin" && activeSuperAdmins(d).length <= 1) {
    throw new DomainError("Không thể xoá Super Admin cuối cùng.");
  }
  commit(withAudit({ ...d, users: d.users.filter((u) => u.id !== id) }, actorEmail, "Xoá người dùng", cur.email));
}

export function replaceFace(actorEmail: string, id: string, samples: number[][]) {
  const d = state.data;
  const users = d.users.map((u) => (u.id === id ? { ...u, faceSamples: samples } : u));
  commit(withAudit({ ...d, users }, actorEmail, "Đăng ký lại Face ID", id));
}

// ---- Cơ quan ---------------------------------------------------------------------------------------

export function upsertOrg(actorEmail: string, org: Org) {
  const d = state.data;
  if (!org.name.trim() || !org.shortName.trim()) throw new DomainError("Tên cơ quan không được để trống.");
  if (org.parentId === org.id) throw new DomainError("Cơ quan không thể trực thuộc chính nó.");
  // chống vòng lặp cha-con
  let p = org.parentId;
  const seen = new Set<string>([org.id]);
  while (p) {
    if (seen.has(p)) throw new DomainError("Quan hệ trực thuộc tạo thành vòng lặp.");
    seen.add(p);
    p = d.orgs.find((o) => o.id === p)?.parentId;
  }
  const exists = d.orgs.some((o) => o.id === org.id);
  const orgs = exists ? d.orgs.map((o) => (o.id === org.id ? org : o)) : [...d.orgs, org];
  const base = { ...d, orgs };
  const users = base.users.map((u) => pruneGrants(base, u));
  commit(withAudit({ ...base, users }, actorEmail, exists ? "Sửa cơ quan" : "Thêm cơ quan", org.shortName));
}

export function deleteOrg(actorEmail: string, id: string) {
  const d = state.data;
  const org = d.orgs.find((o) => o.id === id);
  if (!org) return;
  if (d.orgs.some((o) => o.parentId === id)) {
    throw new DomainError("Cơ quan còn đơn vị trực thuộc – hãy chuyển hoặc xoá các đơn vị con trước.");
  }
  const removedDb = new Set(d.databases.filter((x) => x.orgId === id).map((x) => x.id));
  const databases = d.databases
    .filter((x) => x.orgId !== id)
    .map((x) => ({ ...x, links: x.links.filter((l) => !removedDb.has(l)) }));
  const base = { ...d, orgs: d.orgs.filter((o) => o.id !== id), databases };
  const users = base.users.map((u) => {
    const moved: User = {
      ...u,
      orgId: u.orgId === id ? undefined : u.orgId,
      requestedOrgId: u.requestedOrgId === id ? undefined : u.requestedOrgId,
      role: u.orgId === id && u.role === "specialist" ? "guest" : u.role,
    };
    return pruneGrants(base, moved);
  });
  commit(withAudit({ ...base, users }, actorEmail, `Xoá cơ quan (kèm ${removedDb.size} CSDL)`, org.shortName));
}

// ---- CSDL -----------------------------------------------------------------------------------------

export function upsertDatabase(actorEmail: string, x: DatabaseSystem) {
  const d = state.data;
  if (!x.title.trim()) throw new DomainError("Tên CSDL không được để trống.");
  if (!d.orgs.some((o) => o.id === x.orgId)) throw new DomainError("Cơ quan chủ quản không tồn tại.");
  const names = x.tables.map((t) => t.name.trim().toLowerCase());
  if (names.some((n) => !n)) throw new DomainError("Tên bảng không được để trống.");
  if (new Set(names).size !== names.length) throw new DomainError("Tên bảng bị trùng trong cùng một CSDL.");
  for (const t of x.tables) {
    const cols = t.columns.map((c) => c.name.trim().toLowerCase());
    if (cols.some((c) => !c)) throw new DomainError(`Bảng ${t.name}: tên cột không được để trống.`);
    if (new Set(cols).size !== cols.length) throw new DomainError(`Bảng ${t.name}: tên cột bị trùng.`);
  }
  const clean: DatabaseSystem = {
    ...x,
    links: Array.from(new Set(x.links.filter((l) => l !== x.id && d.databases.some((o) => o.id === l)))),
    updatedAt: new Date().toISOString(),
  };
  const exists = d.databases.some((o) => o.id === x.id);
  const databases = exists ? d.databases.map((o) => (o.id === x.id ? clean : o)) : [...d.databases, clean];
  const base = { ...d, databases };
  const users = base.users.map((u) => pruneGrants(base, u)); // CSDL chuyển cơ quan → thu hồi quyền ngoài phạm vi
  commit(withAudit({ ...base, users }, actorEmail, exists ? "Sửa CSDL" : "Thêm CSDL", x.title));
}

export function deleteDatabase(actorEmail: string, id: string) {
  const d = state.data;
  const x = d.databases.find((o) => o.id === id);
  if (!x) return;
  const databases = d.databases.filter((o) => o.id !== id).map((o) => ({ ...o, links: o.links.filter((l) => l !== id) }));
  const users = d.users.map((u) => ({ ...u, grants: u.grants.filter((g) => g !== id) }));
  commit(withAudit({ ...d, databases, users }, actorEmail, "Xoá CSDL", x.title));
}

export function resetDemoData(actorEmail: string) {
  const d = state.data;
  const base = { ...seedData(), users: d.users, audit: d.audit };
  const users = base.users.map((u) => pruneGrants(base, u));
  commit(withAudit({ ...base, users }, actorEmail, "Khôi phục danh mục mẫu"));
}

// ---- Phiên đăng nhập ---------------------------------------------------------------------------------

export function signIn(userId: string, method: Session["method"]) {
  const d = state.data;
  const u = d.users.find((x) => x.id === userId);
  if (!u) throw new DomainError("Tài khoản không tồn tại.");
  if (u.status !== "active") throw new DomainError("Tài khoản đã bị khoá. Liên hệ quản trị viên.");
  const now = Date.now();
  const users = d.users.map((x) => (x.id === userId ? { ...x, lastLoginAt: new Date(now).toISOString() } : x));
  commit(withAudit({ ...d, users }, u.email, method === "face" ? "Đăng nhập bằng Face ID" : "Đăng nhập bằng Google"));
  setSession({ userId, method, issuedAt: now, expiresAt: now + SESSION_TTL_MS, lastActiveAt: now });
}

export function signOut() {
  setSession(null);
}

let lastTouch = 0;
export function touchSession() {
  const s = state.session;
  if (!s) return;
  const now = Date.now();
  if (now - lastTouch < 60_000) return; // tránh ghi localStorage liên tục
  lastTouch = now;
  setSession({ ...s, lastActiveAt: now });
}

export type SessionCheck = { user: User | null; reason?: "expired" | "idle" | "locked" | "deleted" };

export function checkSession(s: StoreState, now = Date.now()): SessionCheck {
  if (!s.session) return { user: null };
  if (now > s.session.expiresAt) return { user: null, reason: "expired" };
  if (now - s.session.lastActiveAt > IDLE_TTL_MS) return { user: null, reason: "idle" };
  const u = s.data.users.find((x) => x.id === s.session!.userId);
  if (!u) return { user: null, reason: "deleted" };
  if (u.status !== "active") return { user: null, reason: "locked" };
  return { user: u };
}
