"use client";

import AppShell from "@/components/AppShell";
import Atlas from "@/components/atlas/Atlas";
import { RequireAuth } from "@/components/auth";

export default function Home() {
  return (
    <RequireAuth>
      {(user) => (
        <AppShell user={user} flush>
          <Atlas user={user} />
        </AppShell>
      )}
    </RequireAuth>
  );
}
