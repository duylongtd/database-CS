"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { canViewDetail } from "@/lib/access";
import { HUB_DB_ID } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { stressDatabases } from "@/lib/stress";
import { normalize } from "@/lib/text";
import type { User } from "@/lib/types";
import { Icon, useMediaQuery } from "../ui";
import InfoPanel from "./InfoPanel";
import { hasWebGL } from "./layout";
import ListView from "./ListView";

const AtlasScene = dynamic(() => import("./AtlasScene"), {
  ssr: false,
  loading: () => (
    <div className="atlas-loading">
      <span className="spinner" /> Đang dựng mô hình 3D…
    </div>
  ),
});

type Sheet = "peek" | "half" | "full";

export default function Atlas({ user }: { user: User }) {
  const orgs = useStore((s) => s.data.orgs);
  const realDatabases = useStore((s) => s.data.databases);
  const [stress, setStress] = useState(0);
  const databases = useMemo(
    () => (stress ? [...realDatabases, ...stressDatabases(orgs, stress)] : realDatabases),
    [realDatabases, orgs, stress],
  );
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedDbId, setSelectedDbId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"3d" | "list">("3d");
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [lost, setLost] = useState(false);
  const [sheet, setSheet] = useState<Sheet>("peek");
  const mobile = useMediaQuery("(max-width: 767px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [dark, setDark] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Theo dõi theme hiện tại (thủ công hoặc theo hệ điều hành)
  useEffect(() => {
    const compute = () => {
      const t = document.documentElement.dataset.theme;
      setDark(t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
    };
    compute();
    const mo = new MutationObserver(compute);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener?.("change", compute);
    return () => {
      mo.disconnect();
      mq.removeEventListener?.("change", compute);
    };
  }, []);

  useEffect(() => {
    const ok = hasWebGL();
    setWebgl(ok);
    if (!ok) setView("list");
    // Khôi phục lựa chọn từ URL (?org=&db=) – bỏ qua id không hợp lệ
    const sp = new URLSearchParams(window.location.search);
    const st = Number(sp.get("stress"));
    if (st > 0) setStress(Math.min(5000, Math.floor(st)));
    const o = sp.get("org");
    const d = sp.get("db");
    if (o) {
      setSelectedOrgId(o);
      if (window.matchMedia("(max-width: 767px)").matches) setSheet("half");
    }
    if (d) setSelectedDbId(d);
  }, []);

  // Dọn lựa chọn nếu cơ quan/CSDL bị xoá (vd: admin xoá ở tab khác)
  useEffect(() => {
    if (selectedOrgId && !orgs.some((o) => o.id === selectedOrgId)) setSelectedOrgId(null);
    if (selectedDbId && !databases.some((d) => d.id === selectedDbId)) setSelectedDbId(null);
  }, [orgs, databases, selectedOrgId, selectedDbId]);

  // Đồng bộ URL để chia sẻ liên kết
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedOrgId) url.searchParams.set("org", selectedOrgId);
    else url.searchParams.delete("org");
    if (selectedDbId) url.searchParams.set("db", selectedDbId);
    else url.searchParams.delete("db");
    window.history.replaceState(null, "", url);
  }, [selectedOrgId, selectedDbId]);

  const selectOrg = useCallback(
    (id: string | null) => {
      setSelectedOrgId(id);
      setSelectedDbId(null);
      if (mobile) setSheet(id ? "half" : "peek");
    },
    [mobile],
  );
  const selectDb = useCallback(
    (id: string | null) => {
      if (id) {
        const d = databases.find((x) => x.id === id);
        if (d) setSelectedOrgId(d.orgId);
        if (mobile) setSheet("half");
      }
      setSelectedDbId(id);
    },
    [databases, mobile],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.matches?.("input,textarea,select");
      if (e.key === "Escape" && !typing && !document.querySelector(".modal")) selectOrg(null);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectOrg]);

  // Tìm kiếm: tên bảng/cột chỉ được dùng để khớp với CSDL mà người dùng có quyền xem chi tiết
  // (tránh lộ cấu trúc qua kết quả tìm kiếm).
  const highlight = useMemo(() => {
    const q = normalize(query);
    if (!q) return null;
    const hit = new Set<string>();
    orgs.forEach((o) => {
      if (normalize(`${o.name} ${o.shortName}`).includes(q)) hit.add(o.id);
    });
    databases.forEach((d) => {
      let text = `${d.title} ${d.purpose}`;
      if (canViewDetail(user, d)) text += " " + d.engine + " " + d.tables.map((t) => `${t.name} ${t.columns.map((c) => c.name).join(" ")}`).join(" ");
      if (normalize(text).includes(q)) hit.add(d.orgId);
    });
    return hit;
  }, [query, orgs, databases, user]);

  const results = highlight ? orgs.filter((o) => highlight.has(o.id)) : [];

  return (
    <div className={`atlas view-${view}`}>
      <div className="atlas-stage">
        {view === "3d" && webgl && !lost ? (
          <AtlasScene
            orgs={orgs}
            databases={databases}
            hubDbId={HUB_DB_ID}
            selectedOrgId={selectedOrgId}
            selectedDbId={selectedDbId}
            highlight={highlight}
            onSelectOrg={selectOrg}
            onSelectDb={selectDb}
            reducedMotion={reducedMotion}
            dark={dark}
            onContextLost={() => setLost(true)}
          />
        ) : view === "3d" ? (
          <div className="atlas-fallback">
            <Icon name="cube" size={28} />
            <p>
              {lost
                ? "Trình duyệt đã thu hồi bộ nhớ đồ hoạ (WebGL context lost)."
                : "Thiết bị/trình duyệt không hỗ trợ WebGL nên không hiển thị được mô hình 3D."}
            </p>
            <div className="row">
              {lost && (
                <button className="btn btn-secondary" onClick={() => setLost(false)}>
                  Dựng lại 3D
                </button>
              )}
              <button className="btn btn-primary" onClick={() => setView("list")}>
                Xem dạng danh sách
              </button>
            </div>
          </div>
        ) : (
          <ListView orgs={orgs} databases={databases} highlight={highlight} selectedOrgId={selectedOrgId} onSelectOrg={selectOrg} />
        )}

        <div className="atlas-toolbar">
          <div className="search">
            <Icon name="search" size={16} />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm cơ quan, CSDL…  ( / )"
              aria-label="Tìm kiếm cơ quan hoặc cơ sở dữ liệu"
              enterKeyHint="search"
              onKeyDown={(e) => {
                if (e.key === "Enter" && results[0]) {
                  selectOrg(results[0].id);
                  (e.target as HTMLInputElement).blur();
                }
                if (e.key === "Escape") setQuery("");
              }}
            />
            {query && (
              <button className="icon-btn sm" onClick={() => setQuery("")} aria-label="Xoá tìm kiếm">
                <Icon name="x" size={14} />
              </button>
            )}
            {query && (
              <div className="search-results" role="listbox">
                {results.length === 0 && <div className="empty small">Không có kết quả phù hợp</div>}
                {results.slice(0, 8).map((o) => (
                  <button key={o.id} role="option" aria-selected={o.id === selectedOrgId} onClick={() => selectOrg(o.id)}>
                    {o.shortName}
                    <span className="muted small">{databases.filter((d) => d.orgId === o.id).length} CSDL</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="segmented" role="tablist" aria-label="Chế độ xem">
            <button role="tab" aria-selected={view === "3d"} onClick={() => setView("3d")} disabled={webgl === false}>
              <Icon name="cube" size={16} /> <span className="hide-sm">3D</span>
            </button>
            <button role="tab" aria-selected={view === "list"} onClick={() => setView("list")}>
              <Icon name="list" size={16} /> <span className="hide-sm">Danh sách</span>
            </button>
          </div>
        </div>
        {view === "3d" && webgl && !lost && (
          <p className="atlas-hint hide-sm">Kéo để xoay · cuộn để thu phóng · bấm một khối để xem chi tiết · Esc để quay lại</p>
        )}
      </div>

      <aside className={`atlas-panel sheet-${sheet}`} aria-label="Thông tin chi tiết">
        {mobile && (
          <button
            className="sheet-handle"
            aria-label="Thu/phóng bảng thông tin"
            onClick={() => setSheet(sheet === "peek" ? "half" : sheet === "half" ? "full" : "peek")}
          >
            <span />
          </button>
        )}
        <div className="panel-scroll">
          <InfoPanel
            user={user}
            orgs={orgs}
            databases={databases}
            selectedOrgId={selectedOrgId}
            selectedDbId={selectedDbId}
            onSelectOrg={selectOrg}
            onSelectDb={selectDb}
          />
        </div>
      </aside>
    </div>
  );
}
