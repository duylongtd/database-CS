import * as THREE from "three";
import type { DatabaseSystem, Org } from "@/lib/types";

export type NodeLayout = { id: string; pos: THREE.Vector3; tier: number; angle: number };
export type DbLayout = { id: string; orgId: string; pos: THREE.Vector3; tables: number };
export type LinkKind = "structure" | "lgsp" | "sync";
export type Link = {
  kind: LinkKind;
  /** Các điểm lấy mẫu dọc đường cong (x,y,z liên tiếp) – dùng cho cả vẽ đường và chạy xung. */
  pts: Float32Array;
  /** Org liên quan – dùng để làm nổi bật khi chọn. */
  orgA: string;
  orgB: string;
};

const RING_MAIN = 11;
const RING_OUTER = 17;
const SAMPLES = 16; // số đoạn cho mỗi đường cong
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/**
 * Bố cục "dãy núi – dòng sông":
 *  - Tâm: dòng chính LGSP.
 *  - Tầng trên: HĐND & UBND.
 *  - Vành chính: các sở / văn phòng / thanh tra. Vành ngoài: đơn vị trực thuộc (gần góc cơ quan cha).
 *  - CSDL: xếp theo xoắn ốc hướng dương (phyllotaxis) cạnh cơ quan sở hữu → không bao giờ chồng lên nhau
 *    và vẫn gọn khi một cơ quan có hàng trăm CSDL.
 */
export function computeLayout(orgs: Org[], dbs: DatabaseSystem[], hubDbId: string) {
  const byId = new Map(orgs.map((o) => [o.id, o]));
  const children = new Map<string, Org[]>();
  orgs.forEach((o) => {
    if (o.parentId && byId.has(o.parentId)) children.set(o.parentId, [...(children.get(o.parentId) ?? []), o]);
  });
  const nodes = new Map<string, NodeLayout>();
  const roots = orgs.filter((o) => !o.parentId || !byId.has(o.parentId));

  roots.forEach((o, i) => {
    const x = (i - (roots.length - 1) / 2) * 7;
    nodes.set(o.id, { id: o.id, pos: new THREE.Vector3(x, 6.5, 0), tier: 1, angle: Math.PI / 2 });
  });
  const ring = roots.flatMap((r) => children.get(r.id) ?? []);
  ring.forEach((o, i) => {
    const angle = (i / Math.max(1, ring.length)) * Math.PI * 2 - Math.PI / 2;
    nodes.set(o.id, { id: o.id, pos: new THREE.Vector3(Math.cos(angle) * RING_MAIN, 0, Math.sin(angle) * RING_MAIN), tier: 2, angle });
  });
  const place = (parentId: string, depth: number) => {
    const parent = nodes.get(parentId)!;
    const kids = (children.get(parentId) ?? []).filter((k) => !nodes.has(k.id));
    kids.forEach((o, i) => {
      const angle = parent.angle + (i - (kids.length - 1) / 2) * 0.2;
      const r = RING_OUTER + (depth - 3) * 4;
      nodes.set(o.id, { id: o.id, pos: new THREE.Vector3(Math.cos(angle) * r, -1.6 - (i % 2) * 0.9, Math.sin(angle) * r), tier: depth, angle });
      place(o.id, depth + 1);
    });
  };
  ring.forEach((o) => place(o.id, 3));
  roots.forEach((o) => place(o.id, 3));
  orgs.forEach((o, i) => {
    if (!nodes.has(o.id)) {
      const angle = (i / orgs.length) * Math.PI * 2;
      nodes.set(o.id, { id: o.id, pos: new THREE.Vector3(Math.cos(angle) * 24, -3, Math.sin(angle) * 24), tier: 4, angle });
    }
  });

  // CSDL
  const dbNodes = new Map<string, DbLayout>();
  const byOrg = new Map<string, DatabaseSystem[]>();
  dbs.forEach((d) => {
    if (d.id !== hubDbId && nodes.has(d.orgId)) byOrg.set(d.orgId, [...(byOrg.get(d.orgId) ?? []), d]);
  });
  byOrg.forEach((list, orgId) => {
    const n = nodes.get(orgId)!;
    const top = n.tier === 1;
    const out = top ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(Math.cos(n.angle), 0, Math.sin(n.angle));
    const tan = top ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-Math.sin(n.angle), 0, Math.cos(n.angle));
    const spacing = 0.78;
    const radiusMax = spacing * Math.sqrt(list.length);
    const center = n.pos.clone().addScaledVector(out, 1.5 + radiusMax).add(new THREE.Vector3(0, top ? 0.2 : -1, 0));
    list.forEach((d, i) => {
      const r = spacing * Math.sqrt(i + 0.5);
      const a = i * GOLDEN;
      const pos = center.clone().addScaledVector(tan, Math.cos(a) * r).addScaledVector(out, Math.sin(a) * r);
      dbNodes.set(d.id, { id: d.id, orgId, pos, tables: Math.max(1, d.tables.length) });
    });
  });

  // Liên kết
  const links: Link[] = [];
  const hub = new THREE.Vector3(0, 0, 0);
  const tmp = new THREE.Vector3();
  const sample = (a: THREE.Vector3, b: THREE.Vector3, lift: number, segs: number) => {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.y += lift;
    const c = new THREE.QuadraticBezierCurve3(a, mid, b);
    const arr = new Float32Array((segs + 1) * 3);
    for (let i = 0; i <= segs; i++) {
      c.getPoint(i / segs, tmp);
      arr[i * 3] = tmp.x;
      arr[i * 3 + 1] = tmp.y;
      arr[i * 3 + 2] = tmp.z;
    }
    return arr;
  };
  orgs.forEach((o) => {
    const a = nodes.get(o.id);
    const b = o.parentId ? nodes.get(o.parentId) : undefined;
    if (a && b) links.push({ kind: "structure", pts: new Float32Array([...a.pos.toArray(), ...b.pos.toArray()]), orgA: o.id, orgB: o.parentId! });
  });
  const dbById = new Map(dbs.map((d) => [d.id, d]));
  dbs.forEach((d) => {
    const p = dbNodes.get(d.id);
    if (!p) return;
    const top = p.pos.clone().setY(p.pos.y + p.tables * 0.125);
    if (d.viaLgsp) links.push({ kind: "lgsp", pts: sample(top, hub, 2.2, SAMPLES), orgA: d.orgId, orgB: d.orgId });
    d.links.forEach((other) => {
      const q = dbNodes.get(other);
      const od = dbById.get(other);
      if (!q || !od || (d.id > other && od.links.includes(d.id))) return; // bỏ cạnh trùng 2 chiều
      links.push({ kind: "sync", pts: sample(top, q.pos.clone().setY(q.pos.y + q.tables * 0.125), 4 + p.pos.distanceTo(q.pos) * 0.18, SAMPLES), orgA: d.orgId, orgB: od.orgId });
    });
  });

  return { nodes, dbNodes, links };
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
