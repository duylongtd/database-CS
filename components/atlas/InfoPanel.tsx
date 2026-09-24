"use client";

import { useState } from "react";
import { canViewDetail, columnCount } from "@/lib/access";
import { nodePalette } from "@/lib/design/tokens";
import { ENGINE_PARADIGM, KIND_LABEL, type DatabaseSystem, type Org, type User } from "@/lib/types";
import { Badge, Icon } from "../ui";

type Props = {
  user: User;
  orgs: Org[];
  databases: DatabaseSystem[];
  selectedOrgId: string | null;
  selectedDbId: string | null;
  onSelectOrg: (id: string | null) => void;
  onSelectDb: (id: string | null) => void;
};

export default function InfoPanel(p: Props) {
  const org = p.orgs.find((o) => o.id === p.selectedOrgId);
  if (!org) return <Overview {...p} />;
  const parent = p.orgs.find((o) => o.id === org.parentId);
  const children = p.orgs.filter((o) => o.parentId === org.id);
  const dbs = p.databases.filter((d) => d.orgId === org.id);
  const tables = dbs.reduce((n, d) => n + d.tables.length, 0);
  const cols = dbs.reduce((n, d) => n + columnCount(d), 0);

  return (
    <div className="panel-inner">
      <nav className="crumbs" aria-label="Vị trí">
        <button onClick={() => p.onSelectOrg(null)}>Toàn tỉnh</button>
        {parent && (
          <>
            <Icon name="chevron" size={14} />
            <button onClick={() => p.onSelectOrg(parent.id)}>{parent.shortName}</button>
          </>
        )}
      </nav>
      <header className="panel-head">
        <span className="kind-dot" style={{ background: kindColor(org.kind) }} />
        <div>
          <p className="eyebrow">{KIND_LABEL[org.kind]}</p>
          <h2 className="panel-title">{org.name}</h2>
        </div>
      </header>
      {org.description && <p className="muted">{org.description}</p>}
      {org.renamedFrom && (
        <p className="note">
          <Icon name="reset" size={14} /> {org.renamedFrom}
        </p>
      )}

      <dl className="stats">
        <Stat label="CSDL" value={dbs.length} />
        <Stat label="Bảng" value={tables} />
        <Stat label="Cột" value={cols} />
      </dl>

      {children.length > 0 && (
        <section>
          <h3 className="section-title">Đơn vị trực thuộc</h3>
          <ul className="chip-list">
            {children.map((c) => (
              <li key={c.id}>
                <button className="chip" onClick={() => p.onSelectOrg(c.id)}>
                  <span className="kind-dot sm" style={{ background: kindColor(c.kind) }} />
                  {c.shortName}
                  <span className="chip-count">{p.databases.filter((d) => d.orgId === c.id).length}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="section-title">Cơ sở dữ liệu</h3>
        {dbs.length === 0 && <p className="empty">Chưa khai báo CSDL nào.</p>}
        <div className="db-list">
          {dbs.map((d) => (
            <DbCard
              key={d.id}
              db={d}
              user={p.user}
              all={p.databases}
              orgs={p.orgs}
              open={p.selectedDbId === d.id}
              onToggle={() => p.onSelectDb(p.selectedDbId === d.id ? null : d.id)}
              onJump={(id) => {
                const target = p.databases.find((x) => x.id === id);
                if (target) {
                  p.onSelectOrg(target.orgId);
                  p.onSelectDb(target.id);
                }
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function Overview({ user, orgs, databases, onSelectOrg }: Props) {
  const tables = databases.reduce((n, d) => n + d.tables.length, 0);
  const cols = databases.reduce((n, d) => n + columnCount(d), 0);
  const readable = databases.filter((d) => canViewDetail(user, d)).length;
  const ranking = orgs
    .map((o) => ({ o, n: databases.filter((d) => d.orgId === o.id).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);
  return (
    <div className="panel-inner">
      <p className="eyebrow">Tổng quan toàn tỉnh</p>
      <h2 className="panel-title">Hệ sinh thái dữ liệu Hà Tĩnh</h2>
      <p className="muted">
        Mỗi khối là một cơ quan, mỗi trụ là một CSDL (số tầng = số bảng). Các đường sáng là luồng dữ liệu liên thông về
        trục LGSP của tỉnh.
      </p>
      <dl className="stats stats-4">
        <Stat label="Cơ quan" value={orgs.length} />
        <Stat label="CSDL" value={databases.length} />
        <Stat label="Bảng" value={tables} />
        <Stat label="Cột" value={cols} />
      </dl>
      <div className="access-box">
        <Icon name={readable ? "unlock" : "lock"} />
        <div>
          <strong>
            {user.role === "super_admin"
              ? "Bạn có toàn quyền xem & quản trị"
              : readable
                ? `Bạn được xem chi tiết ${readable} CSDL`
                : "Bạn chỉ xem được số liệu tổng hợp"}
          </strong>
          <p className="muted small">
            {user.role === "guest"
              ? "Tài khoản đang chờ Super Admin xác nhận cơ quan công tác và cấp quyền."
              : "Chi tiết cấu trúc (hệ quản trị, bảng, cột) chỉ hiển thị với CSDL được cấp quyền."}
          </p>
        </div>
      </div>
      <section>
        <h3 className="section-title">Nhiều CSDL nhất</h3>
        <ol className="rank">
          {ranking.map(({ o, n }) => (
            <li key={o.id}>
              <button onClick={() => onSelectOrg(o.id)}>
                <span className="kind-dot sm" style={{ background: kindColor(o.kind) }} />
                <span className="rank-name">{o.shortName}</span>
                <span className="rank-bar" style={{ width: `${(n / ranking[0].n) * 100}%` }} />
                <span className="rank-n">{n}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>
      <Legend />
    </div>
  );
}

function DbCard({
  db,
  user,
  all,
  orgs,
  open,
  onToggle,
  onJump,
}: {
  db: DatabaseSystem;
  user: User;
  all: DatabaseSystem[];
  orgs: Org[];
  open: boolean;
  onToggle: () => void;
  onJump: (id: string) => void;
}) {
  const allowed = canViewDetail(user, db);
  const [openTable, setOpenTable] = useState<string | null>(null);
  const cols = columnCount(db);
  const linked = Array.from(new Set([...db.links, ...all.filter((x) => x.links.includes(db.id)).map((x) => x.id)]))
    .map((id) => all.find((x) => x.id === id))
    .filter(Boolean) as DatabaseSystem[];

  return (
    <article className={`db-card${open ? " is-open" : ""}`}>
      <button className="db-card-head" onClick={onToggle} aria-expanded={open}>
        <Icon name="db" />
        <span className="db-card-title">
          <strong>{db.title}</strong>
          <span className="muted small">
            {db.tables.length} bảng · {cols} cột{db.viaLgsp ? " · qua LGSP" : ""}
          </span>
        </span>
        {allowed ? <Icon name="unlock" size={16} /> : <Icon name="lock" size={16} />}
      </button>
      {open && (
        <div className="db-card-body">
          <p className="muted">{db.purpose}</p>
          {allowed ? (
            <>
              <div className="badges">
                <Badge tone="accent">{db.engine}</Badge>
                <Badge tone={ENGINE_PARADIGM[db.engine] === "SQL" ? "info" : "success"}>{ENGINE_PARADIGM[db.engine]}</Badge>
              </div>
              <ul className="table-list">
                {db.tables.map((t) => (
                  <li key={t.id}>
                    <button className="table-row" onClick={() => setOpenTable(openTable === t.id ? null : t.id)} aria-expanded={openTable === t.id}>
                      <Icon name="table" size={15} />
                      <code>{t.name}</code>
                      <span className="muted small">{t.columns.length} cột</span>
                    </button>
                    {openTable === t.id && (
                      <table className="cols">
                        <thead>
                          <tr>
                            <th>Cột</th>
                            <th>Kiểu</th>
                            <th aria-label="Ràng buộc" />
                          </tr>
                        </thead>
                        <tbody>
                          {t.columns.map((c) => (
                            <tr key={c.name}>
                              <td>
                                <code>{c.name}</code>
                              </td>
                              <td>
                                <code className="muted">{c.type}</code>
                              </td>
                              <td className="small">{c.pk ? <Badge tone="accent">PK</Badge> : c.nullable ? <span className="muted">null</span> : null}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </li>
                ))}
              </ul>
              {user.role !== "super_admin" && <p className="small muted">Chế độ chỉ đọc – bạn không có quyền sửa/xoá.</p>}
            </>
          ) : (
            <div className="locked">
              <div className="masked" aria-hidden>
                {db.tables.map((t) => (
                  <span key={t.id} />
                ))}
              </div>
              <p className="small">
                <Icon name="lock" size={14} /> Cấu trúc được bảo mật. Hệ quản trị, tên bảng và cột chỉ hiển thị với chuyên
                viên được {orgs.find((o) => o.id === db.orgId)?.shortName ?? "cơ quan chủ quản"} cấp quyền.
              </p>
            </div>
          )}
          {linked.length > 0 && (
            <div className="linked">
              <h4 className="section-title sm">
                <Icon name="link" size={14} /> Liên thông với
              </h4>
              <ul className="chip-list">
                {linked.map((l) => (
                  <li key={l.id}>
                    <button className="chip" onClick={() => onJump(l.id)}>
                      {l.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd>{value.toLocaleString("vi-VN")}</dd>
    </div>
  );
}

export function kindColor(kind: Org["kind"]) {
  return nodePalette[kind as keyof typeof nodePalette] ?? nodePalette.department;
}

export function Legend() {
  const items: [string, string][] = [
    [nodePalette.hub, "Trục LGSP / luồng dữ liệu"],
    [nodePalette.council, "HĐND"],
    [nodePalette.government, "UBND"],
    [nodePalette.office, "Văn phòng"],
    [nodePalette.department, "Sở / liên thông CSDL"],
    [nodePalette.inspectorate, "Thanh tra"],
    [nodePalette.center, "Trung tâm trực thuộc"],
    [nodePalette.database, "CSDL (tầng = bảng)"],
  ];
  return (
    <section>
      <h3 className="section-title">Chú giải</h3>
      <ul className="legend">
        {items.map(([c, l]) => (
          <li key={l}>
            <span className="kind-dot sm" style={{ background: c }} />
            {l}
          </li>
        ))}
      </ul>
    </section>
  );
}
