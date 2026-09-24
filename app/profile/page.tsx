"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { RequireAuth } from "@/components/auth";
import FaceScanner from "@/components/FaceScanner";
import { toast } from "@/components/ui";
import { bestMatch } from "@/lib/face/engine";
import { getState, replaceFace, useStore } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/types";

export default function ProfilePage() {
  return (
    <RequireAuth>
      {(user) => (
        <AppShell user={user}>
          <Profile userId={user.id} />
        </AppShell>
      )}
    </RequireAuth>
  );
}

function Profile({ userId }: { userId: string }) {
  const user = useStore((s) => s.data.users.find((u) => u.id === userId))!;
  const orgs = useStore((s) => s.data.orgs);
  const dbs = useStore((s) => s.data.databases);
  const [scan, setScan] = useState(false);
  const [key, setKey] = useState(0);
  const org = orgs.find((o) => o.id === user.orgId);
  const req = orgs.find((o) => o.id === user.requestedOrgId);

  return (
    <div className="container narrow-page stack-lg">
      <header>
        <p className="eyebrow">Tài khoản</p>
        <h1 className="h-2xl">{user.name}</h1>
        <p className="muted">{user.email}</p>
      </header>
      <dl className="kv card">
        <dt>Vai trò</dt>
        <dd>{ROLE_LABEL[user.role]}</dd>
        <dt>Cơ quan</dt>
        <dd>{org?.name ?? (req ? `Đang chờ duyệt: ${req.name}` : "Chưa xác nhận")}</dd>
        <dt>Quyền xem chi tiết</dt>
        <dd>{user.role === "super_admin" ? "Toàn bộ" : user.grants.length ? user.grants.map((g) => dbs.find((d) => d.id === g)?.title).filter(Boolean).join(", ") : "Chưa được cấp"}</dd>
        <dt>Face ID</dt>
        <dd>{user.faceSamples.length} mẫu đặc trưng</dd>
      </dl>
      <section className="card stack">
        <h2 className="h-lg">Cập nhật Face ID</h2>
        <p className="muted">Dùng khi khuôn mặt thay đổi (kiểu tóc, râu, kính…) khiến việc nhận diện kém chính xác.</p>
        {scan ? (
          <FaceScanner
            key={key}
            mode="enroll"
            onComplete={({ samples }) => {
              const others = getState().data.users.filter((u) => u.id !== user.id);
              const dup = samples.some((s) => bestMatch(s, others).kind !== "none");
              if (dup) {
                toast("Khuôn mặt này trùng với tài khoản khác – không thể cập nhật.", "error");
                setKey((k) => k + 1);
                return;
              }
              replaceFace(user.email, user.id, samples);
              toast("Đã cập nhật Face ID", "success");
              setScan(false);
            }}
          />
        ) : (
          <button className="btn btn-secondary" onClick={() => setScan(true)}>
            Quét lại khuôn mặt
          </button>
        )}
      </section>
    </div>
  );
}
