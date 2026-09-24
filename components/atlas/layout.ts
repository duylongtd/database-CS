import * as THREE from "three";
import type { DatabaseSystem, Org } from "@/lib/types";

export type NodeLayout = { id: string; pos: THREE.Vector3; tier: number; angle: number };
export type DbLayout = { id: string; orgId: string; pos: THREE.Vector3 };
export type Link = {
  id: string;
  kind: "structure" | "lgsp" | "sync";
  from: string; // org id hoặc db id
  to: string;
  curve: THREE.Curve<THREE.Vector3>;
  /** Các org liên quan – dùng để làm nổi bật khi chọn. */
  orgs: string[];
};

const RING_MAIN = 11;
const RING_OUTER = 17;

/**
 * Bố cục "chòm sao":
 *  - Tâm: trục LGSP (hub) – nơi mọi đường truyền dữ liệu hội tụ.
 *  - Tầng trên: HĐND & UBND (gốc).
 *  - Vành chính: các sở / văn phòng / thanh tra.
 *  - Vành ngoài: trung tâm, đơn vị trực thuộc (đặt gần góc của cơ quan cha).
 *  - CSDL: các khối trụ bao quanh cơ quan sở hữu.
 */
export function computeLayout(orgs: Org[], dbs: DatabaseSystem[], hubDbId: string) {
  const nodes = new Map<string, NodeLayout>();
  const roots = orgs.filter((o) => !o.parentId || !orgs.some((p) => p.id === o.parentId));
  const tier2 = orgs.filter((o) => o.parentId && roots.some((r) => r.id === o.parentId));
  const rest = orgs.filter((o) => !roots.includes(o) && !tier2.includes(o));

  roots.forEach((o, i) => {
    const x = (i - (roots.length - 1) / 2) * 7;
    nodes.set(o.id, { id: o.id, pos: new THREE.Vector3(x, 6.5, 0), tier: 1, angle: Math.PI / 2 });
  });

  // Nhóm tier-2 theo gốc để các cơ quan cùng khối nằm cạnh nhau trên vành.
  const ordered = roots.flatMap((r) => tier2.filter((o) => o.parentId === r.id));
  ordered.forEach((o, i) => {
    const angle = (i / Math.max(1, ordered.length)) * Math.PI * 2 - Math.PI / 2;
    nodes.set(o.id, {
      id: o.id,
      pos: new THREE.Vector3(Math.cos(angle) * RING_MAIN, 0, Math.sin(angle) * RING_MAIN),
      tier: 2,
      angle,
    });
  });

  // Tier 3+ – toả ra quanh góc của cha
  const placeChildren = (parentId: string, depth: number) => {
    const parent = nodes.get(parentId);
    if (!parent) return;
    const kids = rest.filter((o) => o.parentId === parentId);
    const spread = 0.2;
    kids.forEach((o, i) => {
      const angle = parent.angle + (i - (kids.length - 1) / 2) * spread;
      const r = RING_OUTER + (depth - 3) * 4;
      nodes.set(o.id, {
        id: o.id,
        pos: new THREE.Vector3(Math.cos(angle) * r, -1.6 - (i % 2) * 0.9, Math.sin(angle) * r),
        tier: depth,
        angle,
      });
      placeChildren(o.id, depth + 1);
    });
  };
  tier2.forEach((o) => placeChildren(o.id, 3));
  roots.forEach((o) => placeChildren(o.id, 2.5));
  // Phòng trường hợp dữ liệu lỗi (org mồ côi) – đặt trên vòng xa để không bị mất
  orgs.forEach((o, i) => {
    if (!nodes.has(o.id)) {
      const angle = (i / orgs.length) * Math.PI * 2;
      nodes.set(o.id, { id: o.id, pos: new THREE.Vector3(Math.cos(angle) * 24, -3, Math.sin(angle) * 24), tier: 4, angle });
    }
  });

  // CSDL quanh cơ quan
  const dbNodes = new Map<string, DbLayout>();
  const hubPos = new THREE.Vector3(0, 0, 0);
  const byOrg = new Map<string, DatabaseSystem[]>();
  dbs.forEach((d) => {
    if (d.id === hubDbId) return;
    byOrg.set(d.orgId, [...(byOrg.get(d.orgId) ?? []), d]);
  });
  byOrg.forEach((list, orgId) => {
    const n = nodes.get(orgId);
    if (!n) return;
    const tier1 = n.tier === 1;
    const out = tier1 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(Math.cos(n.angle), 0, Math.sin(n.angle));
    const tangent = tier1 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-Math.sin(n.angle), 0, Math.cos(n.angle));
    list.forEach((d, i) => {
      const off = (i - (list.length - 1) / 2) * 1.05;
      const pos = n.pos
        .clone()
        .addScaledVector(out, tier1 ? 1.6 : 1.9)
        .addScaledVector(tangent, off)
        .add(new THREE.Vector3(0, tier1 ? 0 : -0.9, 0));
      dbNodes.set(d.id, { id: d.id, orgId, pos });
    });
  });

  // Liên kết
  const links: Link[] = [];
  const arc = (a: THREE.Vector3, b: THREE.Vector3, lift: number) => {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.y += lift;
    return new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone());
  };
  orgs.forEach((o) => {
    const a = nodes.get(o.id);
    const b = o.parentId ? nodes.get(o.parentId) : undefined;
    if (a && b) {
      links.push({ id: `s:${o.id}`, kind: "structure", from: o.id, to: o.parentId!, curve: new THREE.LineCurve3(a.pos.clone(), b.pos.clone()), orgs: [o.id, o.parentId!] });
    }
  });
  dbs.forEach((d) => {
    const p = dbNodes.get(d.id);
    if (!p) return;
    if (d.viaLgsp) {
      links.push({ id: `l:${d.id}`, kind: "lgsp", from: d.id, to: hubDbId, curve: arc(p.pos, hubPos, 2.2), orgs: [d.orgId] });
    }
    d.links.forEach((other) => {
      const q = dbNodes.get(other);
      const od = dbs.find((x) => x.id === other);
      if (!q || !od || d.id > other && od.links.includes(d.id)) return; // tránh vẽ trùng 2 chiều
      links.push({ id: `y:${d.id}:${other}`, kind: "sync", from: d.id, to: other, curve: arc(p.pos, q.pos, 4 + p.pos.distanceTo(q.pos) * 0.18), orgs: [d.orgId, od.orgId] });
    });
  });

  return { nodes, dbNodes, links, hubPos };
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
