import type { DatabaseSystem, Engine, Org } from "./types";

/**
 * Sinh CSDL giả để kiểm thử tải cảnh 3D: mở `/?stress=1000`.
 * Dữ liệu chỉ nằm trong bộ nhớ, KHÔNG ghi vào localStorage.
 */
const ENGINES: Engine[] = ["PostgreSQL", "MySQL", "SQL Server", "Oracle", "MongoDB", "Elasticsearch"];

export function stressDatabases(orgs: Org[], n: number, seed = 42): DatabaseSystem[] {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const out: DatabaseSystem[] = [];
  for (let i = 0; i < n; i++) {
    const org = orgs[Math.floor(rnd() * orgs.length)];
    const id = `stress-${i}`;
    const tables = 2 + Math.floor(rnd() * 11);
    out.push({
      id,
      orgId: org.id,
      title: `CSDL kiểm thử #${i + 1}`,
      purpose: "Dữ liệu sinh tự động để đo hiệu năng.",
      engine: ENGINES[i % ENGINES.length],
      tables: Array.from({ length: tables }, (_, t) => ({
        id: `${id}.t${t}`,
        name: `bang_${t}`,
        columns: [{ name: "id", type: "uuid", pk: true }],
      })),
      links: i > 0 && rnd() < 0.35 ? [`stress-${Math.floor(rnd() * i)}`] : [],
      viaLgsp: rnd() < 0.8,
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
  }
  return out;
}
