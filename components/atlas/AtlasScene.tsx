"use client";

import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { colors, nodePalette } from "@/lib/design/tokens";
import type { DatabaseSystem, Org } from "@/lib/types";
import { computeLayout, type DbLayout, type Link, type NodeLayout } from "./layout";

/**
 * Cảnh 3D tối ưu cho số lượng lớn:
 *  - Mọi cơ quan = 1 InstancedMesh, mọi tầng CSDL = 1 InstancedMesh, mọi đường nối = 1 LineSegments,
 *    mọi xung dữ liệu = 1 InstancedMesh → số draw call gần như KHÔNG đổi dù có 40 hay 5.000 CSDL.
 *  - Nhãn HTML chỉ hiển thị cho số ít đối tượng quan trọng (không tỉ lệ theo số CSDL).
 *  - PerformanceMonitor tự hạ DPR và số xung khi FPS giảm.
 */

type Props = {
  orgs: Org[];
  databases: DatabaseSystem[];
  hubDbId: string;
  selectedOrgId: string | null;
  selectedDbId: string | null;
  highlight: Set<string> | null;
  onSelectOrg: (id: string | null) => void;
  onSelectDb: (id: string) => void;
  reducedMotion: boolean;
  dark: boolean;
  onContextLost: () => void;
};

const STEP = 0.125; // chiều cao mỗi tầng (= 1 bảng)
const DISC_H = 0.09;
const KIND_COLOR: Record<Org["kind"], string> = {
  council: nodePalette.council,
  government: nodePalette.government,
  office: nodePalette.office,
  department: nodePalette.department,
  inspectorate: nodePalette.inspectorate,
  center: nodePalette.center,
};
const tierSize = (tier: number) => (tier === 1 ? 1.9 : tier === 2 ? 1.3 : 0.85);

export default function AtlasScene(props: Props) {
  const { orgs, databases, hubDbId, selectedOrgId, highlight } = props;
  const layout = useMemo(() => computeLayout(orgs, databases, hubDbId), [orgs, databases, hubDbId]);
  const [quality, setQuality] = useState<"high" | "low">("high");
  const [hoverOrg, setHoverOrg] = useState<string | null>(null);
  const [hoverDb, setHoverDb] = useState<string | null>(null);
  const bg = props.dark ? colors.bg.dark : colors.bg.light;

  const active = useMemo(() => {
    if (!selectedOrgId) return null;
    const s = new Set<string>([selectedOrgId]);
    const sel = orgs.find((o) => o.id === selectedOrgId);
    if (sel?.parentId) s.add(sel.parentId);
    orgs.forEach((o) => o.parentId === selectedOrgId && s.add(o.id));
    layout.links.forEach((l) => {
      if (l.kind === "sync" && (l.orgA === selectedOrgId || l.orgB === selectedOrgId)) {
        s.add(l.orgA);
        s.add(l.orgB);
      }
    });
    return s;
  }, [selectedOrgId, orgs, layout.links]);

  const isDim = (orgId: string) => (!!active && !active.has(orgId)) || (!!highlight && !highlight.has(orgId));

  const focusPos = props.selectedDbId
    ? layout.dbNodes.get(props.selectedDbId)?.pos
    : selectedOrgId
      ? layout.nodes.get(selectedOrgId)?.pos
      : undefined;

  // Nhãn: chỉ cho cơ quan cấp 1–2, cơ quan đang chọn & đơn vị con, kết quả tìm kiếm (tối đa 16), đối tượng đang hover.
  const labelOrgs = useMemo(() => {
    const out: Org[] = [];
    let hits = 0;
    for (const o of orgs) {
      const n = layout.nodes.get(o.id);
      if (!n) continue;
      const hit = highlight?.has(o.id);
      if (hit) hits++;
      if (n.tier <= 2 || o.id === selectedOrgId || o.parentId === selectedOrgId || o.id === hoverOrg || (hit && hits <= 16)) out.push(o);
    }
    return out;
  }, [orgs, layout.nodes, highlight, selectedOrgId, hoverOrg]);

  const labelDb = databases.find((d) => d.id === (hoverDb ?? props.selectedDbId));

  return (
    <Canvas
      className="atlas-canvas"
      dpr={quality === "high" ? [1, 1.75] : 1}
      camera={{ position: [0, 16, 30], fov: 45, near: 0.1, far: 220 }}
      gl={{ antialias: quality === "high", alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        if (window.location.search.includes("stress")) (window as unknown as { __gl: unknown }).__gl = gl;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          props.onContextLost();
        });
      }}
      onPointerMissed={(e) => e.type === "click" && props.onSelectOrg(null)}
    >
      <PerformanceMonitor flipflops={3} onDecline={() => setQuality("low")} onIncline={() => setQuality("high")} onFallback={() => setQuality("low")} />
      <ambientLight intensity={props.dark ? 0.6 : 0.85} />
      <directionalLight position={[10, 22, 12]} intensity={props.dark ? 1.2 : 1.5} />
      <directionalLight position={[-14, 8, -10]} intensity={0.35} color="#BFDDF2" />

      <Contours dark={props.dark} />
      <Hub reducedMotion={props.reducedMotion} dark={props.dark} />
      <LinkLines links={layout.links} active={active} highlight={highlight} bg={bg} dark={props.dark} />
      <Pulses links={layout.links} active={active} reducedMotion={props.reducedMotion} budget={quality === "high" ? 1500 : 400} />
      <Orgs orgs={orgs} nodes={layout.nodes} selectedId={selectedOrgId} hoverId={hoverOrg} isDim={isDim} bg={bg} onHover={setHoverOrg} onSelect={props.onSelectOrg} />
      <Databases
        databases={databases}
        dbNodes={layout.dbNodes}
        selectedId={props.selectedDbId}
        hoverId={hoverDb}
        isDim={isDim}
        bg={bg}
        onHover={setHoverDb}
        onSelect={props.onSelectDb}
      />
      <SelectionRing node={selectedOrgId ? layout.nodes.get(selectedOrgId) : undefined} />

      {labelOrgs.map((o) => {
        const n = layout.nodes.get(o.id)!;
        if (isDim(o.id) && o.id !== hoverOrg) return null;
        return (
          <Html key={o.id} center position={[n.pos.x, n.pos.y + tierSize(n.tier) * 0.85, n.pos.z]} className="node-label-wrap" zIndexRange={[20, 0]}>
            <button className={`node-label${o.id === selectedOrgId ? " is-selected" : ""}${n.tier >= 3 ? " is-small" : ""}`} onClick={() => props.onSelectOrg(o.id)} tabIndex={-1}>
              {o.shortName}
            </button>
          </Html>
        );
      })}
      {labelDb && layout.dbNodes.get(labelDb.id) && (
        <Html
          center
          position={(() => {
            const p = layout.dbNodes.get(labelDb.id)!;
            return [p.pos.x, p.pos.y + p.tables * STEP + 0.5, p.pos.z] as [number, number, number];
          })()}
          className="node-label-wrap"
          zIndexRange={[30, 0]}
        >
          <div className="node-label is-db">
            {labelDb.title}
            <span>{labelDb.tables.length} bảng</span>
          </div>
        </Html>
      )}

      <CameraRig focus={focusPos} reducedMotion={props.reducedMotion} idle={!selectedOrgId} />
    </Canvas>
  );
}

// ---- Nền & dòng chính --------------------------------------------------------------------------------

/** Mặt nền như bản đồ địa hình: các đường đồng mức gợn sóng, gộp thành 1 draw call. */
function Contours({ dark }: { dark: boolean }) {
  const geom = useMemo(() => {
    const pts: number[] = [];
    const rings = [4, 7.5, 11, 14, 17, 20.5, 24];
    rings.forEach((r, k) => {
      const seg = 160;
      for (let i = 0; i < seg; i++) {
        for (const j of [i, i + 1]) {
          const a = (j / seg) * Math.PI * 2;
          const rr = r * (1 + 0.035 * Math.sin(a * 5 + k * 1.7) + 0.02 * Math.sin(a * 11 + k));
          pts.push(Math.cos(a) * rr, 0, Math.sin(a) * rr);
        }
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  useEffect(() => () => geom.dispose(), [geom]);
  return (
    <group position={[0, -3.2, 0]}>
      <lineSegments geometry={geom} raycast={() => null}>
        <lineBasicMaterial color={dark ? "#2A3B4C" : "#C9D3DD"} transparent opacity={0.8} depthWrite={false} />
      </lineSegments>
      <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <circleGeometry args={[27, 96]} />
        <meshBasicMaterial color={dark ? "#0E1720" : "#EDF1F5"} transparent opacity={0.6} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Hub({ reducedMotion, dark }: { reducedMotion: boolean; dark: boolean }) {
  const ring = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!reducedMotion && ring.current) ring.current.rotation.y += dt * 0.3;
  });
  return (
    <group raycast={() => null}>
      <mesh>
        <sphereGeometry args={[1.05, 32, 32]} />
        <meshStandardMaterial color={nodePalette.hub} emissive={nodePalette.hub} emissiveIntensity={dark ? 0.8 : 0.45} roughness={0.3} />
      </mesh>
      <group ref={ring}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.9, 0.05, 8, 96]} />
          <meshBasicMaterial color={nodePalette.hub} />
        </mesh>
        <mesh rotation={[Math.PI / 2.3, 0.3, 0]}>
          <torusGeometry args={[2.6, 0.025, 8, 96]} />
          <meshBasicMaterial color={nodePalette.pulse} transparent opacity={0.8} />
        </mesh>
      </group>
      <Html center position={[0, -2.6, 0]} className="node-label-wrap" zIndexRange={[20, 0]}>
        <div className="node-label node-label-hub">Dòng chính LGSP</div>
      </Html>
    </group>
  );
}

// ---- Cơ quan (instanced) -------------------------------------------------------------------------------

const orgGeom = new THREE.CylinderGeometry(0.6, 0.95, 1, 6); // "đỉnh núi" lục giác
const dbGeom = new THREE.CylinderGeometry(0.3, 0.3, DISC_H, 12);
/** Trên ngưỡng này, mỗi CSDL vẽ thành 1 trụ liền (LOD) thay vì từng tầng – giảm ~10 lần số tam giác. */
const COMPACT_DISCS = 2500;
const hitGeom = new THREE.CylinderGeometry(0.42, 0.42, 1, 8);
const WHITE = new THREE.Color("#FFFFFF");

function Orgs({
  orgs,
  nodes,
  selectedId,
  hoverId,
  isDim,
  bg,
  onHover,
  onSelect,
}: {
  orgs: Org[];
  nodes: Map<string, NodeLayout>;
  selectedId: string | null;
  hoverId: string | null;
  isDim: (id: string) => boolean;
  bg: string;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const list = useMemo(() => orgs.filter((o) => nodes.has(o.id)), [orgs, nodes]);
  const hovered = useRef<string | null>(null);
  // Mảng màu phải ổn định giữa các lần render – nếu tạo mới, R3F sẽ dựng lại attribute và mất màu.
  const orgColors = useMemo(() => new Float32Array(list.length * 3).fill(1), [list.length]);

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o3 = new THREE.Object3D();
    list.forEach((o, i) => {
      const n = nodes.get(o.id)!;
      const s = tierSize(n.tier);
      o3.position.copy(n.pos);
      o3.scale.set(s, s * 0.85, s);
      o3.rotation.set(0, n.angle, 0);
      o3.updateMatrix();
      m.setMatrixAt(i, o3.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [list, nodes]);

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const c = new THREE.Color();
    const bgc = new THREE.Color(bg);
    list.forEach((o, i) => {
      c.set(KIND_COLOR[o.kind]);
      if (o.id === selectedId) c.lerp(WHITE, 0.18);
      else if (o.id === hoverId) c.lerp(WHITE, 0.25);
      else if (isDim(o.id)) c.lerp(bgc, 0.82);
      m.setColorAt(i, c);
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  useCursor(!!hoverId);
  const pick = (e: ThreeEvent<PointerEvent | MouseEvent>) => (e.instanceId != null ? list[e.instanceId]?.id : undefined);

  return (
    <instancedMesh
      key={list.length}
      ref={ref}
      args={[orgGeom, undefined, list.length]}
      frustumCulled={false}
      onPointerMove={(e) => {
        e.stopPropagation();
        const id = pick(e) ?? null;
        if (id !== hovered.current) onHover((hovered.current = id));
      }}
      onPointerOut={() => onHover((hovered.current = null))}
      onClick={(e) => {
        e.stopPropagation();
        const id = pick(e);
        if (id) onSelect(id);
      }}
    >
      <instancedBufferAttribute attach="instanceColor" args={[orgColors, 3]} />
      <meshStandardMaterial roughness={0.55} metalness={0.05} flatShading />
    </instancedMesh>
  );
}

function SelectionRing({ node }: { node?: NodeLayout }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 2.4) * 0.04);
  });
  if (!node) return null;
  const s = tierSize(node.tier);
  return (
    <mesh ref={ref} position={[node.pos.x, node.pos.y - s * 0.43, node.pos.z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <ringGeometry args={[s * 0.95, s * 1.07, 6]} />
      <meshBasicMaterial color={nodePalette.pulse} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ---- CSDL (instanced) ----------------------------------------------------------------------------------

function Databases({
  databases,
  dbNodes,
  selectedId,
  hoverId,
  isDim,
  bg,
  onHover,
  onSelect,
}: {
  databases: DatabaseSystem[];
  dbNodes: Map<string, DbLayout>;
  selectedId: string | null;
  hoverId: string | null;
  isDim: (id: string) => boolean;
  bg: string;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const discs = useRef<THREE.InstancedMesh>(null);
  const hits = useRef<THREE.InstancedMesh>(null);
  const list = useMemo(() => databases.filter((d) => dbNodes.has(d.id)), [databases, dbNodes]);
  const { discOwner, compact } = useMemo(() => {
    let total = 0;
    list.forEach((d) => (total += dbNodes.get(d.id)!.tables));
    const compact = total > COMPACT_DISCS;
    const arr: number[] = [];
    list.forEach((d, i) => {
      const n = compact ? 1 : dbNodes.get(d.id)!.tables;
      for (let k = 0; k < n; k++) arr.push(i);
    });
    return { discOwner: arr, compact };
  }, [list, dbNodes]);
  const discColors = useMemo(() => new Float32Array(discOwner.length * 3).fill(1), [discOwner.length]);
  const hovered = useRef<string | null>(null);

  useLayoutEffect(() => {
    const dm = discs.current;
    const hm = hits.current;
    if (!dm || !hm) return;
    const o3 = new THREE.Object3D();
    let k = 0;
    list.forEach((d, i) => {
      const p = dbNodes.get(d.id)!;
      if (compact) {
        const h = (p.tables - 1) * STEP + DISC_H;
        o3.position.set(p.pos.x, p.pos.y + h / 2 - DISC_H / 2, p.pos.z);
        o3.scale.set(1, h / DISC_H, 1);
        o3.updateMatrix();
        dm.setMatrixAt(k++, o3.matrix);
      } else {
        for (let t = 0; t < p.tables; t++) {
          o3.position.set(p.pos.x, p.pos.y + t * STEP, p.pos.z);
          o3.scale.set(1, 1, 1);
          o3.updateMatrix();
          dm.setMatrixAt(k++, o3.matrix);
        }
      }
      const h = p.tables * STEP + 0.2;
      o3.position.set(p.pos.x, p.pos.y + h / 2 - 0.1, p.pos.z);
      o3.scale.set(1, h, 1);
      o3.updateMatrix();
      hm.setMatrixAt(i, o3.matrix);
    });
    dm.instanceMatrix.needsUpdate = true;
    hm.instanceMatrix.needsUpdate = true;
    dm.computeBoundingSphere();
    hm.computeBoundingSphere();
  }, [list, dbNodes, compact]);

  useLayoutEffect(() => {
    const dm = discs.current;
    if (!dm) return;
    const base = new THREE.Color(nodePalette.database);
    const bgc = new THREE.Color(bg);
    const per = list.map((d) => {
      const c = base.clone();
      if (d.id === selectedId) c.set(nodePalette.pulse);
      else if (d.id === hoverId) c.lerp(WHITE, 0.35);
      else if (isDim(d.orgId)) c.lerp(bgc, 0.85);
      return c;
    });
    discOwner.forEach((owner, k) => dm.setColorAt(k, per[owner]));
    if (dm.instanceColor) dm.instanceColor.needsUpdate = true;
  });

  useCursor(!!hoverId);
  const pick = (e: ThreeEvent<PointerEvent | MouseEvent>) => (e.instanceId != null ? list[e.instanceId]?.id : undefined);

  return (
    <group>
      <instancedMesh key={`d${discOwner.length}`} ref={discs} args={[dbGeom, undefined, discOwner.length]} frustumCulled={false} raycast={() => null}>
        <instancedBufferAttribute attach="instanceColor" args={[discColors, 3]} />
        <meshStandardMaterial roughness={0.4} metalness={0.1} />
      </instancedMesh>
      {/* Khối bắt sự kiện vô hình, to hơn trụ thật – dễ chạm trên màn hình cảm ứng */}
      <instancedMesh
        key={`h${list.length}`}
        ref={hits}
        args={[hitGeom, undefined, list.length]}
        frustumCulled={false}
        onPointerMove={(e) => {
          e.stopPropagation();
          const id = pick(e) ?? null;
          if (id !== hovered.current) onHover((hovered.current = id));
        }}
        onPointerOut={() => onHover((hovered.current = null))}
        onClick={(e) => {
          e.stopPropagation();
          const id = pick(e);
          if (id) onSelect(id);
        }}
      >
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}

// ---- Đường nối (1 draw call) ---------------------------------------------------------------------------

function LinkLines({ links, active, highlight, bg, dark }: { links: Link[]; active: Set<string> | null; highlight: Set<string> | null; bg: string; dark: boolean }) {
  const geom = useMemo(() => {
    let n = 0;
    links.forEach((l) => (n += (l.pts.length / 3 - 1) * 2));
    const pos = new Float32Array(n * 3);
    let k = 0;
    links.forEach((l) => {
      const p = l.pts;
      for (let i = 0; i < p.length / 3 - 1; i++) {
        pos.set(p.subarray(i * 3, i * 3 + 6), k);
        k += 6;
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    return g;
  }, [links]);
  useEffect(() => () => geom.dispose(), [geom]);

  useLayoutEffect(() => {
    const col = geom.getAttribute("color") as THREE.BufferAttribute;
    const arr = col.array as Float32Array;
    const bgc = new THREE.Color(bg);
    const base = {
      structure: new THREE.Color(dark ? "#3B5063" : "#AEBBC8"),
      lgsp: new THREE.Color(nodePalette.hub),
      sync: new THREE.Color(nodePalette.pulse),
    };
    const c = new THREE.Color();
    let k = 0;
    links.forEach((l) => {
      const on = (!active || active.has(l.orgA) || active.has(l.orgB)) && (!highlight || highlight.has(l.orgA) || highlight.has(l.orgB));
      c.copy(base[l.kind]);
      if (!on) c.lerp(bgc, 0.9);
      else if (!active && l.kind !== "structure") c.lerp(bgc, l.kind === "lgsp" ? 0.45 : 0.55);
      const verts = (l.pts.length / 3 - 1) * 2;
      for (let v = 0; v < verts; v++, k += 3) {
        arr[k] = c.r;
        arr[k + 1] = c.g;
        arr[k + 2] = c.b;
      }
    });
    col.needsUpdate = true;
  }, [geom, links, active, highlight, bg, dark]);

  return (
    <lineSegments geometry={geom} raycast={() => null} frustumCulled={false}>
      <lineBasicMaterial vertexColors transparent opacity={0.85} depthWrite={false} />
    </lineSegments>
  );
}

/** Nhịp dữ liệu chạy dọc đường nối – 1 InstancedMesh, ngân sách xung giới hạn theo chất lượng. */
function Pulses({ links, active, reducedMotion, budget }: { links: Link[]; active: Set<string> | null; reducedMotion: boolean; budget: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const pulseColors = useMemo(() => new Float32Array(budget * 3).fill(1), [budget]);
  const slots = useMemo(() => {
    const data = links.filter((l) => l.kind !== "structure");
    const rel = active ? data.filter((l) => active.has(l.orgA) || active.has(l.orgB)) : data;
    const per = rel.length * 2 <= budget ? 2 : 1;
    const stride = Math.max(1, Math.ceil((rel.length * per) / budget));
    const out: { l: Link; phase: number; rev: boolean; speed: number }[] = [];
    for (let i = 0; i < rel.length; i += stride) {
      for (let k = 0; k < per; k++) {
        out.push({ l: rel[i], phase: ((i * 0.618) % 1) + k / per, rev: k % 2 === 1, speed: rel[i].kind === "lgsp" ? 0.16 : 0.1 });
      }
    }
    return out.slice(0, budget);
  }, [links, active, budget]);

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const c = new THREE.Color();
    slots.forEach((s, i) => {
      c.set(s.l.kind === "lgsp" ? nodePalette.pulse : nodePalette.hub);
      m.setColorAt(i, c);
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.count = slots.length;
  }, [slots]);

  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = reducedMotion ? 0.35 : clock.getElapsedTime();
    const arr = m.instanceMatrix.array as Float32Array;
    const size = active ? 0.15 : 0.1;
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      let u = (t * s.speed + s.phase) % 1;
      if (s.rev) u = 1 - u;
      const p = s.l.pts;
      const segs = p.length / 3 - 1;
      const f = u * segs;
      const j = Math.min(segs - 1, Math.floor(f));
      const fr = f - j;
      const o = i * 16;
      arr[o] = arr[o + 5] = arr[o + 10] = size;
      arr[o + 15] = 1;
      arr[o + 12] = p[j * 3] + (p[j * 3 + 3] - p[j * 3]) * fr;
      arr[o + 13] = p[j * 3 + 1] + (p[j * 3 + 4] - p[j * 3 + 1]) * fr;
      arr[o + 14] = p[j * 3 + 2] + (p[j * 3 + 5] - p[j * 3 + 2]) * fr;
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh key={budget} ref={ref} args={[undefined, undefined, budget]} frustumCulled={false} raycast={() => null}>
      <icosahedronGeometry args={[1, 0]} />
      <instancedBufferAttribute attach="instanceColor" args={[pulseColors, 3]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

// ---- Camera -------------------------------------------------------------------------------------------

function CameraRig({ focus, reducedMotion, idle }: { focus?: THREE.Vector3; reducedMotion: boolean; idle: boolean }) {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const { camera, size } = useThree();
  const anim = useRef<{ target: THREE.Vector3; cam: THREE.Vector3 } | null>(null);
  const mobile = size.width < 640;

  useEffect(() => {
    if (focus) {
      const dir = focus.clone().setY(0);
      if (dir.lengthSq() < 0.01) dir.set(0, 0, 1);
      dir.normalize();
      const dist = mobile ? 13 : 10;
      // Mobile: bottom sheet che nửa dưới → hạ tâm nhìn để đối tượng nằm ở nửa trên màn hình.
      anim.current = {
        target: focus.clone().add(new THREE.Vector3(0, mobile ? -3 : 0, 0)),
        cam: focus.clone().addScaledVector(dir, dist).add(new THREE.Vector3(0, dist * 0.55, 0)),
      };
    } else {
      anim.current = { target: new THREE.Vector3(0, 0, 0), cam: new THREE.Vector3(0, mobile ? 24 : 16, mobile ? 42 : 30) };
    }
  }, [focus, mobile]);

  useFrame((_, dt) => {
    const c = controls.current;
    const a = anim.current;
    if (!c || !a) return;
    const k = reducedMotion ? 1 : 1 - Math.pow(0.001, dt);
    c.target.lerp(a.target, k);
    camera.position.lerp(a.cam, k);
    c.update();
    if (camera.position.distanceTo(a.cam) < 0.05) anim.current = null;
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={4}
      maxDistance={80}
      maxPolarAngle={Math.PI * 0.49}
      autoRotate={idle && !reducedMotion}
      autoRotateSpeed={0.3}
      onStart={() => (anim.current = null)}
    />
  );
}

function useCursor(hover: boolean) {
  useEffect(() => {
    if (!hover) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hover]);
}
