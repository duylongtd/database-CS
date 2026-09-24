"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { RequireAuth } from "@/components/auth";
import { kindColor } from "@/components/atlas/InfoPanel";
import { Badge, Confirm, Icon, Modal, toast } from "@/components/ui";
import { columnCount } from "@/lib/access";
import {
  deleteDatabase,
  deleteOrg,
  deleteUser,
  DomainError,
  orgScope,
  resetDemoData,
  uid,
  updateUser,
  upsertDatabase,
  upsertOrg,
  useStore,
} from "@/lib/store";
import { normalize } from "@/lib/text";
import {
  ENGINE_PARADIGM,
  KIND_LABEL,
  ROLE_LABEL,
  type Column,
  type DatabaseSystem,
  type Engine,
  type Org,
  type OrgKind,
  type Role,
  type User,
} from "@/lib/types";

type Tab = "users" | "orgs" | "dbs" | "audit";

export default function AdminPage() {
  return (
    <RequireAuth admin>
      {(user) => (
        <AppShell user={user}>
          <Admin me={user} />
        </AppShell>
      )}
    </RequireAuth>
  );
}

/** Bọc thao tác để hiển thị lỗi nghiệp vụ thay vì làm vỡ trang. */
function run(fn: () => void, ok?: string) {
  try {
    fn();
    if (ok) toast(ok, "success");
    return true;
  } catch (e) {
    toast(e instanceof DomainError ? e.message : "Thao tác thất bại.", "error");
    return false;
  }
}

function Admin({ me }: { me: User }) {
  const [tab, setTab] = useState<Tab>("users");
  const users = useStore((s) => s.data.users);
  const pending = users.filter((u) => u.role === "guest" && u.requestedOrgId).length;
  const [confirmReset, setConfirmReset] = useState(false);
  const data = useStore((s) => s.data);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ orgs: data.orgs, databases: data.databases }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `csdl-hatinh-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="container stack-lg">
      <header className="page-head">
        <div>
          <p className="eyebrow">Super Admin</p>
          <h1 className="h-2xl">Quản trị hệ thống</h1>
        </div>
        <div className="row">
          <button className="btn btn-ghost" onClick={exportJson}>
            Xuất JSON
          </button>
          <button className="btn btn-ghost" onClick={() => setConfirmReset(true)}>
            <Icon name="reset" size={16} /> Khôi phục danh mục mẫu
          </button>
        </div>
      </header>
      <div className="tabs" role="tablist">
        {(
          [
            ["users", `Người dùng${pending ? ` · ${pending} chờ duyệt` : ""}`],
            ["orgs", "Cơ quan"],
            ["dbs", "Cơ sở dữ liệu"],
            ["audit", "Nhật ký"],
          ] as [Tab, string][]
        ).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>
      {tab === "users" && <UsersTab me={me} />}
      {tab === "orgs" && <OrgsTab me={me} />}
      {tab === "dbs" && <DbsTab me={me} />}
      {tab === "audit" && <AuditTab />}
      <Confirm
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Khôi phục danh mục mẫu?"
        message="Toàn bộ cơ quan và CSDL sẽ trở về dữ liệu mẫu ban đầu. Tài khoản người dùng được giữ nguyên, quyền ngoài phạm vi sẽ bị thu hồi."
        confirmLabel="Khôi phục"
        danger
        onConfirm={() => run(() => resetDemoData(me.email), "Đã khôi phục dữ liệu mẫu")}
      />
    </div>
  );
}

// ---- Người dùng -------------------------------------------------------------------------------------

function UsersTab({ me }: { me: User }) {
  const users = useStore((s) => s.data.users);
  const orgs = useStore((s) => s.data.orgs);
  const [grantFor, setGrantFor] = useState<User | null>(null);
  const [del, setDel] = useState<User | null>(null);
  const [q, setQ] = useState("");
  const list = users
    .filter((u) => !q || normalize(`${u.name} ${u.email}`).includes(normalize(q)))
    .sort((a, b) => Number(!!b.requestedOrgId && b.role === "guest") - Number(!!a.requestedOrgId && a.role === "guest"));

  return (
    <section className="stack">
      <input className="input" placeholder="Tìm theo tên hoặc email…" value={q} onChange={(e) => setQ(e.target.value)} />
      {list.length === 0 && <p className="empty">Không có người dùng.</p>}
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Vai trò</th>
              <th>Cơ quan</th>
              <th>Quyền chi tiết</th>
              <th>Trạng thái</th>
              <th aria-label="Thao tác" />
            </tr>
          </thead>
          <tbody>
            {list.map((u) => {
              const req = orgs.find((o) => o.id === u.requestedOrgId);
              return (
                <tr key={u.id}>
                  <td data-label="Người dùng">
                    <strong>{u.name}</strong>
                    {u.id === me.id && <Badge tone="accent">Bạn</Badge>}
                    <div className="muted small">{u.email}</div>
                    {req && u.role === "guest" && (
                      <div className="pending">
                        Xin vào: {req.shortName}{" "}
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => run(() => updateUser(me.email, u.id, { role: "specialist", orgId: req.id }), `Đã duyệt ${u.name}`)}
                        >
                          Duyệt
                        </button>
                      </div>
                    )}
                  </td>
                  <td data-label="Vai trò">
                    <select
                      value={u.role}
                      onChange={(e) => {
                        const role = e.target.value as Role;
                        run(() => updateUser(me.email, u.id, { role, orgId: role === "specialist" ? u.orgId ?? u.requestedOrgId : u.orgId }));
                      }}
                    >
                      {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td data-label="Cơ quan">
                    <select value={u.orgId ?? ""} onChange={(e) => run(() => updateUser(me.email, u.id, { orgId: e.target.value || undefined }))}>
                      <option value="">— Chưa gán —</option>
                      {orgs.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.shortName}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td data-label="Quyền chi tiết">
                    {u.role === "super_admin" ? (
                      <span className="muted small">Toàn quyền</span>
                    ) : u.role === "specialist" ? (
                      <button className="btn btn-secondary btn-sm" onClick={() => setGrantFor(u)}>
                        {u.grants.length} CSDL · Phân quyền
                      </button>
                    ) : (
                      <span className="muted small">—</span>
                    )}
                  </td>
                  <td data-label="Trạng thái">
                    <button
                      className={`btn btn-sm ${u.status === "active" ? "btn-ghost" : "btn-danger"}`}
                      onClick={() => run(() => updateUser(me.email, u.id, { status: u.status === "active" ? "locked" : "active" }))}
                      disabled={u.id === me.id}
                      title={u.id === me.id ? "Không thể tự khoá" : undefined}
                    >
                      <Icon name={u.status === "active" ? "unlock" : "lock"} size={14} />
                      {u.status === "active" ? "Hoạt động" : "Đã khoá"}
                    </button>
                  </td>
                  <td>
                    <button className="icon-btn" aria-label={`Xoá ${u.name}`} disabled={u.id === me.id} onClick={() => setDel(u)}>
                      <Icon name="trash" size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {grantFor && <GrantModal me={me} userId={grantFor.id} onClose={() => setGrantFor(null)} />}
      <Confirm
        open={!!del}
        onClose={() => setDel(null)}
        title="Xoá người dùng?"
        message={`Tài khoản ${del?.email} và dữ liệu khuôn mặt sẽ bị xoá vĩnh viễn.`}
        confirmLabel="Xoá"
        danger
        onConfirm={() => del && run(() => deleteUser(me.email, del.id), "Đã xoá người dùng")}
      />
    </section>
  );
}

function GrantModal({ me, userId, onClose }: { me: User; userId: string; onClose: () => void }) {
  const user = useStore((s) => s.data.users.find((u) => u.id === userId));
  const orgs = useStore((s) => s.data.orgs);
  const dbs = useStore((s) => s.data.databases);
  const scope = useMemo(() => orgScope(orgs, user?.orgId), [orgs, user?.orgId]);
  const [sel, setSel] = useState<Set<string>>(() => new Set(user?.grants ?? []));
  if (!user) return null;
  const inScope = dbs.filter((d) => scope.has(d.orgId));
  const org = orgs.find((o) => o.id === user.orgId);
  return (
    <Modal
      open
      onClose={onClose}
      title={`Phân quyền · ${user.name}`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Huỷ
          </button>
          <button className="btn btn-primary" onClick={() => run(() => updateUser(me.email, user.id, { grants: [...sel] }), "Đã lưu phân quyền") && onClose()}>
            Lưu
          </button>
        </>
      }
    >
      <p className="muted small">
        Chuyên viên chỉ được cấp quyền <strong>đọc</strong> chi tiết CSDL thuộc {org?.name ?? "cơ quan của mình"} và các đơn vị trực
        thuộc. Không có quyền sửa/xoá.
      </p>
      {inScope.length === 0 ? (
        <p className="empty">Cơ quan này chưa có CSDL nào.</p>
      ) : (
        <>
          <div className="row">
            <button className="btn btn-ghost btn-sm" onClick={() => setSel(new Set(inScope.map((d) => d.id)))}>
              Chọn tất cả
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSel(new Set())}>
              Bỏ chọn
            </button>
          </div>
          <ul className="check-list">
            {inScope.map((d) => (
              <li key={d.id}>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={sel.has(d.id)}
                    onChange={(e) => {
                      const n = new Set(sel);
                      if (e.target.checked) n.add(d.id);
                      else n.delete(d.id);
                      setSel(n);
                    }}
                  />
                  <span>
                    {d.title}
                    <span className="muted small"> · {orgs.find((o) => o.id === d.orgId)?.shortName}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
}

// ---- Cơ quan ----------------------------------------------------------------------------------------

const slug = (s: string) =>
  normalize(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "co-quan";

function OrgsTab({ me }: { me: User }) {
  const orgs = useStore((s) => s.data.orgs);
  const dbs = useStore((s) => s.data.databases);
  const [edit, setEdit] = useState<Org | null>(null);
  const [del, setDel] = useState<Org | null>(null);
  const blank: Org = { id: "", name: "", shortName: "", kind: "department", parentId: "ubnd" };
  const ordered = useMemo(() => {
    const out: { o: Org; depth: number }[] = [];
    const walk = (o: Org, depth: number) => {
      out.push({ o, depth });
      orgs.filter((c) => c.parentId === o.id).forEach((c) => walk(c, depth + 1));
    };
    orgs.filter((o) => !o.parentId || !orgs.some((p) => p.id === o.parentId)).forEach((r) => walk(r, 0));
    return out;
  }, [orgs]);

  return (
    <section className="stack">
      <div className="row between">
        <p className="muted">{orgs.length} cơ quan / đơn vị</p>
        <button className="btn btn-primary" onClick={() => setEdit(blank)}>
          <Icon name="plus" size={16} /> Thêm cơ quan
        </button>
      </div>
      <ul className="org-admin">
        {ordered.map(({ o, depth }) => (
          <li key={o.id} style={{ paddingLeft: depth * 20 }}>
            <span className="kind-dot sm" style={{ background: kindColor(o.kind) }} />
            <span className="grow">
              <strong>{o.name}</strong>
              <span className="muted small">
                {" "}
                · {KIND_LABEL[o.kind]} · {dbs.filter((d) => d.orgId === o.id).length} CSDL
              </span>
            </span>
            <button className="icon-btn" aria-label={`Sửa ${o.shortName}`} onClick={() => setEdit(o)}>
              <Icon name="edit" size={16} />
            </button>
            <button className="icon-btn" aria-label={`Xoá ${o.shortName}`} onClick={() => setDel(o)}>
              <Icon name="trash" size={16} />
            </button>
          </li>
        ))}
      </ul>
      {edit && <OrgForm me={me} initial={edit} onClose={() => setEdit(null)} />}
      <Confirm
        open={!!del}
        onClose={() => setDel(null)}
        title={`Xoá ${del?.shortName}?`}
        message={`Sẽ xoá kèm ${dbs.filter((d) => d.orgId === del?.id).length} CSDL của cơ quan này. Người dùng thuộc cơ quan sẽ chuyển về trạng thái Khách và mất quyền liên quan.`}
        confirmLabel="Xoá"
        danger
        onConfirm={() => del && run(() => deleteOrg(me.email, del.id), "Đã xoá cơ quan")}
      />
    </section>
  );
}

function OrgForm({ me, initial, onClose }: { me: User; initial: Org; onClose: () => void }) {
  const orgs = useStore((s) => s.data.orgs);
  const [o, setO] = useState<Org>(initial);
  const isNew = !initial.id;
  const save = () => {
    let id = o.id;
    if (isNew) {
      id = slug(o.shortName || o.name);
      while (orgs.some((x) => x.id === id)) id = `${slug(o.shortName || o.name)}-${uid("").slice(1, 5)}`;
    }
    if (run(() => upsertOrg(me.email, { ...o, id, parentId: o.parentId || undefined }), isNew ? "Đã thêm cơ quan" : "Đã lưu")) onClose();
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "Thêm cơ quan" : `Sửa · ${initial.shortName}`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Huỷ
          </button>
          <button className="btn btn-primary" onClick={save}>
            Lưu
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="field span-2">
          <span>Tên đầy đủ</span>
          <input value={o.name} onChange={(e) => setO({ ...o, name: e.target.value })} maxLength={160} />
        </label>
        <label className="field">
          <span>Tên ngắn (hiển thị 3D)</span>
          <input value={o.shortName} onChange={(e) => setO({ ...o, shortName: e.target.value })} maxLength={48} />
        </label>
        <label className="field">
          <span>Loại</span>
          <select value={o.kind} onChange={(e) => setO({ ...o, kind: e.target.value as OrgKind })}>
            {(Object.keys(KIND_LABEL) as OrgKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="field span-2">
          <span>Trực thuộc</span>
          <select value={o.parentId ?? ""} onChange={(e) => setO({ ...o, parentId: e.target.value || undefined })}>
            <option value="">— Cấp gốc —</option>
            {orgs
              .filter((x) => x.id !== o.id)
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
          </select>
        </label>
        <label className="field span-2">
          <span>Mô tả</span>
          <textarea rows={2} value={o.description ?? ""} onChange={(e) => setO({ ...o, description: e.target.value })} />
        </label>
        <label className="field span-2">
          <span>Ghi chú đổi tên / hợp nhất</span>
          <input value={o.renamedFrom ?? ""} onChange={(e) => setO({ ...o, renamedFrom: e.target.value || undefined })} />
        </label>
      </div>
    </Modal>
  );
}

// ---- CSDL -------------------------------------------------------------------------------------------

const ENGINES = Object.keys(ENGINE_PARADIGM) as Engine[];
const colsToText = (cols: Column[]) => cols.map((c) => `${c.pk ? "*" : ""}${c.name}:${c.type}${c.nullable ? "?" : ""}`).join("\n");
const textToCols = (s: string): Column[] =>
  s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const pk = l.startsWith("*");
      let x = pk ? l.slice(1) : l;
      const nullable = x.endsWith("?");
      if (nullable) x = x.slice(0, -1);
      const i = x.indexOf(":");
      const name = (i < 0 ? x : x.slice(0, i)).trim();
      const type = (i < 0 ? "text" : x.slice(i + 1)).trim() || "text";
      return { name, type, pk: pk || undefined, nullable: nullable || undefined };
    });

function DbsTab({ me }: { me: User }) {
  const dbs = useStore((s) => s.data.databases);
  const orgs = useStore((s) => s.data.orgs);
  const [org, setOrg] = useState("");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<DatabaseSystem | null>(null);
  const [del, setDel] = useState<DatabaseSystem | null>(null);
  const list = dbs.filter((d) => (!org || d.orgId === org) && (!q || normalize(d.title).includes(normalize(q))));
  const blank = (): DatabaseSystem => ({
    id: "",
    orgId: org || orgs.find((o) => o.kind === "department")?.id || orgs[0]?.id || "",
    title: "",
    purpose: "",
    engine: "PostgreSQL",
    tables: [],
    links: [],
    viaLgsp: true,
    updatedAt: "",
  });
  return (
    <section className="stack">
      <div className="row wrap">
        <input className="input grow" placeholder="Tìm CSDL…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={org} onChange={(e) => setOrg(e.target.value)} aria-label="Lọc theo cơ quan">
          <option value="">Tất cả cơ quan</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.shortName}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={() => setEdit(blank())} disabled={!orgs.length}>
          <Icon name="plus" size={16} /> Thêm CSDL
        </button>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>CSDL</th>
              <th>Cơ quan</th>
              <th>Hệ quản trị</th>
              <th>Bảng / cột</th>
              <th aria-label="Thao tác" />
            </tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.id}>
                <td data-label="CSDL">
                  <strong>{d.title}</strong>
                  <div className="muted small">{d.purpose}</div>
                </td>
                <td data-label="Cơ quan">{orgs.find((o) => o.id === d.orgId)?.shortName}</td>
                <td data-label="Hệ quản trị">
                  <Badge tone="accent">{d.engine}</Badge> <Badge tone={ENGINE_PARADIGM[d.engine] === "SQL" ? "info" : "success"}>{ENGINE_PARADIGM[d.engine]}</Badge>
                </td>
                <td data-label="Bảng / cột">
                  {d.tables.length} / {columnCount(d)}
                </td>
                <td className="nowrap">
                  <button className="icon-btn" aria-label={`Sửa ${d.title}`} onClick={() => setEdit(d)}>
                    <Icon name="edit" size={16} />
                  </button>
                  <button className="icon-btn" aria-label={`Xoá ${d.title}`} onClick={() => setDel(d)}>
                    <Icon name="trash" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="empty">Không có CSDL phù hợp.</p>}
      </div>
      {edit && <DbForm me={me} initial={edit} onClose={() => setEdit(null)} />}
      <Confirm
        open={!!del}
        onClose={() => setDel(null)}
        title="Xoá CSDL?"
        message={`“${del?.title}” sẽ bị xoá, các liên kết và quyền đã cấp liên quan cũng bị thu hồi.`}
        confirmLabel="Xoá"
        danger
        onConfirm={() => del && run(() => deleteDatabase(me.email, del.id), "Đã xoá CSDL")}
      />
    </section>
  );
}

function DbForm({ me, initial, onClose }: { me: User; initial: DatabaseSystem; onClose: () => void }) {
  const orgs = useStore((s) => s.data.orgs);
  const dbs = useStore((s) => s.data.databases);
  const [d, setD] = useState<DatabaseSystem>(initial);
  const [tables, setTables] = useState(() => initial.tables.map((t) => ({ id: t.id, name: t.name, text: colsToText(t.columns) })));
  const isNew = !initial.id;
  const save = () => {
    const id = isNew ? uid("db") : d.id;
    const next: DatabaseSystem = {
      ...d,
      id,
      tables: tables.map((t) => ({ id: t.id || `${id}.${t.name}`, name: t.name.trim(), columns: textToCols(t.text) })),
    };
    if (run(() => upsertDatabase(me.email, next), isNew ? "Đã thêm CSDL" : "Đã lưu CSDL")) onClose();
  };
  return (
    <Modal
      open
      onClose={onClose}
      width={760}
      title={isNew ? "Thêm cơ sở dữ liệu" : `Sửa · ${initial.title}`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Huỷ
          </button>
          <button className="btn btn-primary" onClick={save}>
            Lưu
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="field span-2">
          <span>Tên CSDL (công khai)</span>
          <input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} maxLength={160} />
        </label>
        <label className="field span-2">
          <span>Mục đích</span>
          <textarea rows={2} value={d.purpose} onChange={(e) => setD({ ...d, purpose: e.target.value })} />
        </label>
        <label className="field">
          <span>Cơ quan chủ quản</span>
          <select value={d.orgId} onChange={(e) => setD({ ...d, orgId: e.target.value })}>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.shortName}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Hệ quản trị · loại</span>
          <select value={d.engine} onChange={(e) => setD({ ...d, engine: e.target.value as Engine })}>
            {ENGINES.map((x) => (
              <option key={x} value={x}>
                {x} ({ENGINE_PARADIGM[x]})
              </option>
            ))}
          </select>
        </label>
        <label className="check span-2">
          <input type="checkbox" checked={d.viaLgsp} onChange={(e) => setD({ ...d, viaLgsp: e.target.checked })} />
          <span>Kết nối qua trục LGSP của tỉnh</span>
        </label>
        <fieldset className="field span-2">
          <legend>Liên thông với CSDL</legend>
          <div className="check-grid">
            {dbs
              .filter((x) => x.id !== d.id)
              .map((x) => (
                <label key={x.id} className="check small">
                  <input
                    type="checkbox"
                    checked={d.links.includes(x.id)}
                    onChange={(e) => setD({ ...d, links: e.target.checked ? [...d.links, x.id] : d.links.filter((l) => l !== x.id) })}
                  />
                  <span>{x.title}</span>
                </label>
              ))}
          </div>
        </fieldset>
      </div>
      <div className="stack">
        <div className="row between">
          <h3 className="h-md">Bảng ({tables.length})</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setTables([...tables, { id: "", name: `bang_${tables.length + 1}`, text: "*id:uuid" }])}>
            <Icon name="plus" size={14} /> Thêm bảng
          </button>
        </div>
        <p className="small muted">
          Mỗi dòng một cột: <code>ten_cot:kieu</code>. Tiền tố <code>*</code> = khoá chính, hậu tố <code>?</code> = cho phép null.
        </p>
        {tables.map((t, i) => (
          <div key={i} className="table-edit">
            <div className="row">
              <input className="input mono grow" value={t.name} aria-label="Tên bảng" onChange={(e) => setTables(tables.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <button className="icon-btn" aria-label="Xoá bảng" onClick={() => setTables(tables.filter((_, j) => j !== i))}>
                <Icon name="trash" size={16} />
              </button>
            </div>
            <textarea className="mono" rows={Math.min(8, Math.max(3, t.text.split("\n").length))} value={t.text} aria-label={`Cột của bảng ${t.name}`} onChange={(e) => setTables(tables.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ---- Nhật ký ----------------------------------------------------------------------------------------

function AuditTab() {
  const audit = useStore((s) => s.data.audit);
  return (
    <section>
      {audit.length === 0 ? (
        <p className="empty">Chưa có hoạt động.</p>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Thời điểm</th>
                <th>Người thực hiện</th>
                <th>Hành động</th>
                <th>Đối tượng</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id}>
                  <td data-label="Thời điểm" className="nowrap">
                    {new Date(a.at).toLocaleString("vi-VN")}
                  </td>
                  <td data-label="Người thực hiện">{a.actor}</td>
                  <td data-label="Hành động">{a.action}</td>
                  <td data-label="Đối tượng" className="muted">
                    {a.target ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
