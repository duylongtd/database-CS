/**
 * Bộ máy nhận diện khuôn mặt chạy hoàn toàn trên trình duyệt (@vladmandic/face-api + TensorFlow.js).
 * Model được phục vụ tĩnh từ /models (copy lúc npm install) → không phụ thuộc CDN, không gửi ảnh đi đâu.
 */
type FaceApi = typeof import("@vladmandic/face-api");

let apiPromise: Promise<FaceApi> | null = null;
let backendName = "";

export class FaceEngineError extends Error {}

export function loadFaceEngine(): Promise<FaceApi> {
  if (apiPromise) return apiPromise;
  apiPromise = (async () => {
    const faceapi = await import("@vladmandic/face-api");
    const tf = faceapi.tf as unknown as {
      setBackend: (b: string) => Promise<boolean>;
      ready: () => Promise<void>;
      getBackend: () => string;
      env: () => { set: (k: string, v: unknown) => void };
    };
    // Ưu tiên WebGL (GPU). Máy yếu/không có WebGL → CPU (chậm hơn nhưng vẫn chạy).
    for (const b of ["webgl", "cpu"]) {
      try {
        if (await tf.setBackend(b)) {
          await tf.ready();
          break;
        }
      } catch {
        /* thử backend kế tiếp */
      }
    }
    backendName = tf.getBackend();
    try {
      // Giảm lỗi mất độ chính xác trên GPU di động (float16).
      if (backendName === "webgl") tf.env().set("WEBGL_PACK", true);
    } catch {
      /* ignore */
    }
    const base = "/models";
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(base),
      faceapi.nets.faceLandmark68Net.loadFromUri(base),
      faceapi.nets.faceRecognitionNet.loadFromUri(base),
    ]);
    return faceapi;
  })().catch((e) => {
    apiPromise = null; // cho phép thử lại lần sau
    throw new FaceEngineError(`Không tải được mô-đun nhận diện: ${(e as Error)?.message ?? e}`);
  });
  return apiPromise;
}

export const faceBackend = () => backendName;

export type Point = { x: number; y: number };
export type FaceObservation = {
  box: { x: number; y: number; width: number; height: number };
  score: number;
  landmarks: Point[];
  descriptor: Float32Array;
};

export async function detectFaces(
  faceapi: FaceApi,
  input: HTMLVideoElement,
  inputSize: number,
): Promise<FaceObservation[]> {
  const res = await faceapi
    .detectAllFaces(input, new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptors();
  return res.map((r) => ({
    box: { x: r.detection.box.x, y: r.detection.box.y, width: r.detection.box.width, height: r.detection.box.height },
    score: r.detection.score,
    landmarks: r.landmarks.positions.map((p) => ({ x: p.x, y: p.y })),
    descriptor: r.descriptor,
  }));
}

// ---- Liveness (chống dùng ảnh tĩnh) ---------------------------------------------------------------

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Eye Aspect Ratio – giảm mạnh khi nhắm mắt. Landmark 68 điểm: mắt trái 36–41, mắt phải 42–47. */
export function eyeAspectRatio(lm: Point[]): number {
  const ear = (i: number) =>
    (dist(lm[i + 1], lm[i + 5]) + dist(lm[i + 2], lm[i + 4])) / (2 * dist(lm[i], lm[i + 3]) || 1);
  return (ear(36) + ear(42)) / 2;
}

/** Độ lệch đầu trái/phải: -1..1 (vị trí mũi so với hai khoé mắt ngoài). */
export function headYaw(lm: Point[]): number {
  const left = lm[36];
  const right = lm[45];
  const nose = lm[30];
  const mid = (left.x + right.x) / 2;
  const half = Math.abs(right.x - left.x) / 2 || 1;
  return (nose.x - mid) / half;
}

// ---- So khớp -----------------------------------------------------------------------------------

export const MATCH_THRESHOLD = 0.45; // khoảng cách Euclid; càng nhỏ càng khắt khe
export const AMBIGUITY_MARGIN = 0.06; // 2 tài khoản quá giống nhau → không tự quyết

export function euclidean(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}

export type MatchResult =
  | { kind: "match"; userId: string; distance: number }
  | { kind: "none"; best?: number }
  | { kind: "ambiguous"; userIds: string[] };

export function bestMatch(
  probe: ArrayLike<number>,
  users: { id: string; faceSamples: number[][] }[],
): MatchResult {
  const scored = users
    .filter((u) => u.faceSamples.length)
    .map((u) => ({ id: u.id, d: Math.min(...u.faceSamples.map((s) => euclidean(probe, s))) }))
    .sort((a, b) => a.d - b.d);
  if (!scored.length || scored[0].d > MATCH_THRESHOLD) return { kind: "none", best: scored[0]?.d };
  if (scored[1] && scored[1].d - scored[0].d < AMBIGUITY_MARGIN && scored[1].d <= MATCH_THRESHOLD) {
    return { kind: "ambiguous", userIds: [scored[0].id, scored[1].id] };
  }
  return { kind: "match", userId: scored[0].id, distance: scored[0].d };
}

export function averageDescriptor(samples: ArrayLike<number>[]): number[] {
  const n = samples[0].length;
  const out = new Array<number>(n).fill(0);
  for (const s of samples) for (let i = 0; i < n; i++) out[i] += s[i] / samples.length;
  return out;
}

export const round = (d: ArrayLike<number>) => Array.from(d, (v) => Math.round(v * 1e5) / 1e5);
