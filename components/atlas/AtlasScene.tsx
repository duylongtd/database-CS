"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Html, Line, OrbitControls, RoundedBox } from "@react-three/drei";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { nodePalette } from "@/lib/design/tokens";
import type { DatabaseSystem, Org } from "@/lib/types";
import { computeLayout, type Link } from "./layout";

type Props = {
  orgs: Org[];
  databases: DatabaseSystem[];
  hubDbId: string;
  selectedOrgId: string | null;
  selectedDbId: string | null;
  highlight: Set<string> | null; // org ids khớp tìm kiếm
  onSelectOrg: (id: string | null) => void;
  onSelectDb: (id: string) => void;
  reducedMotion: boolean;
  dark: boolean;
  onContextLost: () => void;
};

const KIND_COLOR: Record<Org["kind"], string> = {
  council: nodePalette.council,
  government: nodePalette.government,
  office: nodePalette.office,
  department: nodePalette.department,
  inspectorate: nodePalette.inspectorate,
  center: nodePalette.center,
};

export default function AtlasScene(props: Props) {
  const { orgs, databases, hubDbId } = props;
  const layout = useMemo(() => computeLayout(orgs, databases, hubDbId), [orgs, databases, hubDbId]);

  // Tập org "đang hoạt động" để làm nổi bật: org được chọn + cha + con + org có CSDL liên thông.
  const active = useMemo(() => {
    if (!props.selectedOrgId) return null;
    const s = new Set<string>([props.selectedOrgId]);
    const sel = orgs.find((o) => o.id === props.selectedOrgId);
    if (sel?.parentId) s.add(sel.parentId);
    orgs.filter((o) => o.parentId === props.selectedOrgId).forEach((o) => s.add(o.id));
    layout.links.forEach((l) => {
      if (l.kind === "sync" && l.orgs.includes(props.selectedOrgId!)) l.orgs.forEach((o) => s.add(o));
    });
    return s;
  }, [props.selectedOrgId, orgs, layout.links]);

  const focusPos = props.selectedDbId
    ? layout.dbNodes.get(props.selectedDbId)?.pos
    : props.selectedOrgId
      ? layout.nodes.get(props.selectedOrgId)?.pos
      : undefined;

  return (
    <Canvas
      className="atlas-canvas"
      dpr={[1, 1.75]}
      camera={{ position: [0, 16, 30], fov: 45, near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: false }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          props.onContextLost();
        });
      }}
      onPointerMissed={(e) => e.type === "click" && props.onSelectOrg(null)}
    >
      <AdaptiveDpr pixelated={false} />
      <ambientLight intensity={props.dark ? 0.55 : 0.8} />
      <directionalLight position={[10, 20, 10]} intensity={props.dark ? 1.1 : 1.4} />
      <directionalLight position={[-12, 6, -10]} intensity={0.4} color="#F6E7E0" />

      <Floor dark={props.dark} />
      <Hub reducedMotion={props.reducedMotion} selected={props.selectedOrgId === databases.find((d) => d.id === hubDbId)?.orgId} onClick={() => {
        const hubOrg = databases.find((d) => d.id === hubDbId)?.orgId;
        if (hubOrg) props.onSelectOrg(hubOrg);
      }} />

      <Links links={layout.links} active={active} dark={props.dark} />
      <Pulses links={layout.links} active={active} reducedMotion={props.reducedMotion} />

      {orgs.map((o) => {
        const n = layout.nodes.get(o.id);
        if (!n) return null;
        const dim = (active && !active.has(o.id)) || (props.highlight && !props.highlight.has(o.id));
        return (
          <OrgNode
            key={o.id}
            org={o}
            pos={n.pos}
            tier={n.tier}
            selected={props.selectedOrgId === o.id}
            dim={!!dim}
            showLabel={n.tier <= 2 || props.selectedOrgId === o.id || props.selectedOrgId === o.parentId || !!props.highlight?.has(o.id)}
            onSelect={props.onSelectOrg}
          />
        );
      })}

      {databases.map((d) => {
        const p = layout.dbNodes.get(d.id);
        if (!p) return null;
        const dim = (active && !active.has(d.orgId)) || (props.highlight && !props.highlight.has(d.orgId));
        return (
          <DbNode
            key={d.id}
            db={d}
            pos={p.pos}
            selected={props.selectedDbId === d.id}
            dim={!!dim}
            onSelect={props.onSelectDb}
          />
        );
      })}

      <CameraRig focus={focusPos} reducedMotion={props.reducedMotion} idle={!props.selectedOrgId} />
    </Canvas>
  );
}

// ---- Thành phần cảnh ---------------------------------------------------------------------------------

function Floor({ dark }: { dark: boolean }) {
  const rings = [5, 11, 17, 23];
  return (
    <group position={[0, -3.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {rings.map((r) => (
        <mesh key={r}>
          <ringGeometry args={[r - 0.02, r + 0.02, 128]} />
          <meshBasicMaterial color={dark ? "#56554E" : "#D1CFC5"} transparent opacity={0.6} />
        </mesh>
      ))}
      <mesh>
        <circleGeometry args={[26, 96]} />
        <meshBasicMaterial color={dark ? "#1F1E1D" : "#F0EEE6"} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function Hub({ reducedMotion, selected, onClick }: { reducedMotion: boolean; selected: boolean; onClick: () => void }) {
  const outer = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (reducedMotion) return;
    if (outer.current) outer.current.rotation.y += dt * 0.25;
    if (ring.current) ring.current.rotation.z += dt * 0.4;
  });
  return (
    <group onClick={(e) => (e.stopPropagation(), onClick())}>
      <mesh ref={outer}>
        <icosahedronGeometry args={[1.9, 1]} />
        <meshStandardMaterial color={nodePalette.hub} wireframe transparent opacity={0.55} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.05, 32, 32]} />
        <meshStandardMaterial color={nodePalette.hub} emissive={nodePalette.hub} emissiveIntensity={selected ? 1 : 0.55} roughness={0.35} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[2.7, 0.03, 8, 96]} />
        <meshBasicMaterial color={nodePalette.hub} transparent opacity={0.7} />
      </mesh>
      <Html center position={[0, -2.9, 0]} className="node-label-wrap" zIndexRange={[20, 0]}>
        <div className="node-label node-label-hub">Trục LGSP tỉnh</div>
      </Html>
    </group>
  );
}

const OrgNode = memo(function OrgNode({
  org,
  pos,
  tier,
  selected,
  dim,
  showLabel,
  onSelect,
}: {
  org: Org;
  pos: THREE.Vector3;
  tier: number;
  selected: boolean;
  dim: boolean;
  showLabel: boolean;
  onSelect: (id: string) => void;
}) {
  const [hover, setHover] = useState(false);
  const size = tier === 1 ? 1.9 : tier === 2 ? 1.3 : 0.85;
  const color = KIND_COLOR[org.kind];
  useCursor(hover);
  return (
    <group position={pos}>
      <RoundedBox
        args={[size, size * 0.7, size]}
        radius={0.12}
        smoothness={3}
        onClick={(e) => (e.stopPropagation(), onSelect(org.id))}
        onPointerOver={(e) => (e.stopPropagation(), setHover(true))}
        onPointerOut={() => setHover(false)}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.55 : hover ? 0.35 : 0.08}
          roughness={0.45}
          metalness={0.05}
          transparent
          opacity={dim ? 0.18 : 1}
        />
      </RoundedBox>
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -size * 0.45, 0]}>
          <ringGeometry args={[size * 0.85, size * 0.95, 48]} />
          <meshBasicMaterial color={nodePalette.hub} />
        </mesh>
      )}
      {(showLabel || hover) && !dim && (
        <Html center position={[0, size * 0.75, 0]} className="node-label-wrap" zIndexRange={[20, 0]}>
          <button
            className={`node-label${selected ? " is-selected" : ""}${tier >= 3 ? " is-small" : ""}`}
            onClick={() => onSelect(org.id)}
            tabIndex={-1}
          >
            {org.shortName}
          </button>
        </Html>
      )}
    </group>
  );
});

const DbNode = memo(function DbNode({
  db,
  pos,
  selected,
  dim,
  onSelect,
}: {
  db: DatabaseSystem;
  pos: THREE.Vector3;
  selected: boolean;
  dim: boolean;
  onSelect: (id: string) => void;
}) {
  const [hover, setHover] = useState(false);
  useCursor(hover);
  // Chiều cao trụ tỉ lệ số bảng – "nhìn thấy có bao nhiêu bảng" mà không lộ cấu trúc.
  const n = db.tables.length;
  const disc = 0.09;
  const gap = 0.035;
  return (
    <group position={pos}>
      <group
        onClick={(e) => (e.stopPropagation(), onSelect(db.id))}
        onPointerOver={(e) => (e.stopPropagation(), setHover(true))}
        onPointerOut={() => setHover(false)}
      >
        {Array.from({ length: n }, (_, i) => (
          <mesh key={i} position={[0, i * (disc + gap), 0]}>
            <cylinderGeometry args={[0.32, 0.32, disc, 20]} />
            <meshStandardMaterial
              color={nodePalette.database}
              emissive={nodePalette.database}
              emissiveIntensity={selected ? 0.7 : hover ? 0.4 : 0.1}
              transparent
              opacity={dim ? 0.15 : 0.95}
            />
          </mesh>
        ))}
        {/* vùng bắt chuột rộng hơn cho màn hình cảm ứng */}
        <mesh position={[0, (n * (disc + gap)) / 2, 0]} visible={false}>
          <cylinderGeometry args={[0.5, 0.5, n * (disc + gap) + 0.4, 8]} />
        </mesh>
      </group>
      {(hover || selected) && !dim && (
        <Html center position={[0, n * (disc + gap) + 0.45, 0]} className="node-label-wrap" zIndexRange={[30, 0]}>
          <div className="node-label is-db">
            {db.title}
            <span>{n} bảng</span>
          </div>
        </Html>
      )}
    </group>
  );
});

function Links({ links, active, dark }: { links: Link[]; active: Set<string> | null; dark: boolean }) {
  const base = dark ? "#6B6A63" : "#B9B7AD";
  return (
    <group>
      {links.map((l) => {
        const on = !active || l.orgs.some((o) => active.has(o));
        const color = l.kind === "structure" ? base : l.kind === "lgsp" ? nodePalette.hub : nodePalette.department;
        const pts = l.curve.getPoints(l.kind === "structure" ? 1 : 28);
        return (
          <Line
            key={l.id}
            points={pts}
            color={color}
            lineWidth={l.kind === "structure" ? 1 : on && active ? 2 : 1.2}
            transparent
            opacity={on ? (l.kind === "structure" ? 0.55 : 0.5) : 0.06}
            dashed={l.kind === "sync"}
            dashSize={0.35}
            gapSize={0.2}
          />
        );
      })}
    </group>
  );
}

/** Các "gói dữ liệu" chạy dọc đường truyền – 1 InstancedMesh cho toàn bộ để nhẹ. */
function Pulses({ links, active, reducedMotion }: { links: Link[]; active: Set<string> | null; reducedMotion: boolean }) {
  const data = useMemo(() => links.filter((l) => l.kind !== "structure"), [links]);
  const PER = 2;
  const count = data.length * PER;
  const ref = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const phases = useMemo(() => Array.from({ length: count }, (_, i) => (i % PER) / PER + Math.random() * 0.2), [count]);
  const colorsSet = useRef(false);

  useEffect(() => {
    colorsSet.current = false;
  }, [data]);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    if (!colorsSet.current) {
      const c = new THREE.Color();
      data.forEach((l, i) => {
        c.set(l.kind === "lgsp" ? nodePalette.hub : nodePalette.department);
        for (let k = 0; k < PER; k++) mesh.setColorAt(i * PER + k, c);
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      colorsSet.current = true;
    }
    const t = reducedMotion ? 0.35 : clock.getElapsedTime();
    data.forEach((l, i) => {
      const on = !active || l.orgs.some((o) => active.has(o));
      for (let k = 0; k < PER; k++) {
        const idx = i * PER + k;
        const speed = l.kind === "lgsp" ? 0.18 : 0.12;
        // chiều đi: CSDL → trục; chiều về xen kẽ để thể hiện trao đổi 2 chiều
        let u = (t * speed + phases[idx]) % 1;
        if (k % 2 === 1) u = 1 - u;
        l.curve.getPoint(u, tmp.position);
        const s = on ? (active ? 0.16 : 0.11) : 0;
        tmp.scale.setScalar(s);
        tmp.updateMatrix();
        mesh.setMatrixAt(idx, tmp.matrix);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!count) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

function CameraRig({ focus, reducedMotion, idle }: { focus?: THREE.Vector3; reducedMotion: boolean; idle: boolean }) {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const { camera, size } = useThree();
  const anim = useRef<{ target: THREE.Vector3; cam: THREE.Vector3 } | null>(null);
  const mobile = size.width < 640;

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    if (focus) {
      const dir = focus.clone().setY(0);
      if (dir.lengthSq() < 0.01) dir.set(0, 0, 1);
      dir.normalize();
      const dist = mobile ? 13 : 10;
      // Mobile: bottom sheet che nửa dưới → hạ tâm nhìn để khối được chọn nằm ở nửa trên màn hình.
      const target = focus.clone().add(new THREE.Vector3(0, mobile ? -3 : 0, 0));
      anim.current = {
        target,
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
    const k = reducedMotion ? 1 : 1 - Math.pow(0.001, dt); // nội suy mượt, độc lập FPS
    c.target.lerp(a.target, k);
    camera.position.lerp(a.cam, k);
    c.update();
    if (camera.position.distanceTo(a.cam) < 0.05) anim.current = null; // trả quyền điều khiển cho người dùng
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={4}
      maxDistance={70}
      maxPolarAngle={Math.PI * 0.49}
      autoRotate={idle && !reducedMotion}
      autoRotateSpeed={0.35}
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
