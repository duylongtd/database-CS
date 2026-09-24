"use client";

import type { DatabaseSystem, Org } from "@/lib/types";
import { kindColor } from "./InfoPanel";

/** Chế độ danh sách: fallback khi không có WebGL, và cho người dùng trình đọc màn hình. */
export default function ListView({
  orgs,
  databases,
  highlight,
  selectedOrgId,
  onSelectOrg,
}: {
  orgs: Org[];
  databases: DatabaseSystem[];
  highlight: Set<string> | null;
  selectedOrgId: string | null;
  onSelectOrg: (id: string) => void;
}) {
  const roots = orgs.filter((o) => !o.parentId || !orgs.some((p) => p.id === o.parentId));
  const render = (o: Org, depth: number): React.ReactNode => {
    const kids = orgs.filter((c) => c.parentId === o.id);
    const n = databases.filter((d) => d.orgId === o.id).length;
    const dim = highlight && !highlight.has(o.id) && !kids.some((k) => highlight.has(k.id));
    return (
      <li key={o.id} className={dim ? "is-dim" : ""}>
        <button className={`tree-row${selectedOrgId === o.id ? " is-selected" : ""}`} style={{ paddingLeft: 12 + depth * 20 }} onClick={() => onSelectOrg(o.id)}>
          <span className="kind-dot sm" style={{ background: kindColor(o.kind) }} />
          <span className="tree-name">{o.name}</span>
          {n > 0 && <span className="chip-count">{n} CSDL</span>}
        </button>
        {kids.length > 0 && <ul>{kids.map((k) => render(k, depth + 1))}</ul>}
      </li>
    );
  };
  return (
    <div className="listview">
      <ul className="tree">{roots.map((r) => render(r, 0))}</ul>
    </div>
  );
}
