// Sao chép model nhận diện khuôn mặt vào public/models để chạy offline (không phụ thuộc CDN).
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const src = join(process.cwd(), "node_modules/@vladmandic/face-api/model");
const dst = join(process.cwd(), "public/models");
const files = [
  "tiny_face_detector_model",
  "face_landmark_68_model",
  "face_recognition_model",
];

if (!existsSync(src)) {
  console.warn("[face-models] Không tìm thấy @vladmandic/face-api/model – bỏ qua.");
  process.exit(0);
}
mkdirSync(dst, { recursive: true });
for (const f of files) {
  for (const ext of ["-weights_manifest.json", ".bin"]) {
    cpSync(join(src, f + ext), join(dst, f + ext));
  }
}
console.log("[face-models] Đã sao chép", files.length, "model vào public/models");
