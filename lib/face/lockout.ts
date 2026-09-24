/** Giới hạn số lần quét Face ID thất bại liên tiếp (chống dò khuôn mặt) – lưu theo trình duyệt. */
const KEY = "hatinh-csdl:face-lock";
export const MAX_FAILS = 5;
export const LOCK_MS = 60_000;

type Lock = { fails: number; until: number };

const read = (): Lock => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "");
    if (typeof v.fails === "number" && typeof v.until === "number") return v;
  } catch {
    /* ignore */
  }
  return { fails: 0, until: 0 };
};
const write = (l: Lock) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(l));
  } catch {
    /* ignore */
  }
};

export const lockRemainingMs = () => Math.max(0, read().until - Date.now());

export function registerFail(): Lock {
  const l = read();
  const fails = l.fails + 1;
  const next = fails >= MAX_FAILS ? { fails: 0, until: Date.now() + LOCK_MS } : { fails, until: l.until };
  write(next);
  return { fails, until: next.until };
}

export const resetFails = () => write({ fails: 0, until: 0 });
