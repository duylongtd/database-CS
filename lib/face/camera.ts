/**
 * Mở camera an toàn trên mọi thiết bị (desktop, Android, iOS Safari, in-app browser...).
 * - Kiểm tra secure context & hỗ trợ API trước khi gọi.
 * - Thử lần lượt nhiều bộ constraint (một số máy báo OverconstrainedError với độ phân giải cụ thể).
 * - Có timeout vì một số trình duyệt treo vô thời hạn nếu người dùng bỏ qua hộp thoại xin quyền.
 * - Chuẩn hoá lỗi thành mã có thể hiển thị & gợi ý fallback đăng nhập Google.
 */

export type CameraErrorCode =
  | "insecure" // trang không chạy HTTPS
  | "unsupported" // trình duyệt / webview không hỗ trợ getUserMedia
  | "denied" // người dùng hoặc chính sách từ chối quyền
  | "not-found" // không có camera
  | "in-use" // camera đang bị ứng dụng khác chiếm
  | "timeout" // không phản hồi hộp thoại xin quyền
  | "ended" // camera bị ngắt giữa chừng (rút cáp, OS thu hồi)
  | "unknown";

export class CameraError extends Error {
  constructor(public code: CameraErrorCode, message?: string) {
    super(message ?? code);
  }
}

export const CAMERA_ERROR_TEXT: Record<CameraErrorCode, { title: string; hint: string }> = {
  insecure: { title: "Kết nối không an toàn", hint: "Camera chỉ hoạt động qua HTTPS hoặc localhost." },
  unsupported: {
    title: "Trình duyệt không hỗ trợ camera",
    hint: "Nếu bạn đang mở trong Zalo/Facebook, hãy chọn “Mở bằng trình duyệt” (Chrome/Safari).",
  },
  denied: {
    title: "Chưa được cấp quyền camera",
    hint: "Bấm biểu tượng ổ khoá cạnh thanh địa chỉ → cho phép Camera, rồi thử lại.",
  },
  "not-found": { title: "Không tìm thấy camera", hint: "Thiết bị không có camera hoặc camera đã bị tắt trong hệ điều hành." },
  "in-use": { title: "Camera đang được dùng", hint: "Đóng ứng dụng khác đang dùng camera (Zoom, Meet, Teams...) rồi thử lại." },
  timeout: { title: "Không nhận được phản hồi", hint: "Hãy chấp nhận hộp thoại xin quyền camera của trình duyệt." },
  ended: { title: "Camera bị ngắt", hint: "Kết nối camera bị gián đoạn. Kiểm tra thiết bị rồi thử lại." },
  unknown: { title: "Không mở được camera", hint: "Vui lòng thử lại hoặc dùng đăng nhập Google." },
};

function mapError(e: unknown): CameraError {
  if (e instanceof CameraError) return e;
  const name = (e as { name?: string })?.name ?? "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return new CameraError("denied");
    case "NotFoundError":
    case "DevicesNotFoundError":
      return new CameraError("not-found");
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return new CameraError("in-use");
    default:
      return new CameraError("unknown", String((e as Error)?.message ?? e));
  }
}

const CONSTRAINTS: MediaStreamConstraints[] = [
  { audio: false, video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 } } },
  { audio: false, video: { facingMode: "user" } },
  { audio: false, video: true },
];

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new CameraError("timeout")), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    );
  });
}

export async function openCamera(video: HTMLVideoElement, timeoutMs = 20000): Promise<MediaStream> {
  if (typeof window === "undefined") throw new CameraError("unsupported");
  if (!window.isSecureContext) throw new CameraError("insecure");
  if (!navigator.mediaDevices?.getUserMedia) throw new CameraError("unsupported");

  let lastErr: unknown;
  for (const c of CONSTRAINTS) {
    try {
      const stream = await withTimeout(navigator.mediaDevices.getUserMedia(c), timeoutMs);
      // iOS Safari: bắt buộc playsInline + muted để tự phát, nếu không video đứng hình.
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      video.muted = true;
      video.srcObject = stream;
      await waitForVideo(video);
      try {
        await video.play();
      } catch {
        /* Một số trình duyệt chặn autoplay – khung hình vẫn đọc được khi đã có dữ liệu. */
      }
      return stream;
    } catch (e) {
      const err = mapError(e);
      lastErr = err;
      // Chỉ thử constraint tiếp theo khi lỗi liên quan tới cấu hình; lỗi quyền thì dừng ngay.
      if (err.code === "denied" || err.code === "timeout" || err.code === "in-use") throw err;
    }
  }
  throw mapError(lastErr);
}

function waitForVideo(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 2 && video.videoWidth > 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      cleanup();
      reject(new CameraError("unknown", "video metadata timeout"));
    }, 10000);
    const ok = () => {
      if (video.videoWidth > 0) {
        cleanup();
        resolve();
      }
    };
    const cleanup = () => {
      clearTimeout(t);
      video.removeEventListener("loadedmetadata", ok);
      video.removeEventListener("loadeddata", ok);
    };
    video.addEventListener("loadedmetadata", ok);
    video.addEventListener("loadeddata", ok);
  });
}

export function stopStream(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((t) => {
    try {
      t.stop();
    } catch {
      /* ignore */
    }
  });
}

/** Độ sáng trung bình (0–255) của khung hình, lấy mẫu nhỏ cho nhanh – phát hiện camera bị che/thiếu sáng. */
export function frameBrightness(video: HTMLVideoElement, canvas: HTMLCanvasElement): number {
  const w = 32;
  const h = 24;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 128;
  ctx.drawImage(video, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  return sum / (w * h);
}
