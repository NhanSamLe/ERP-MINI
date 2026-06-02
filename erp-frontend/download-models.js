import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";
const TARGET_DIR = path.join(__dirname, "public/models");

const FILES = [
  { remote: "tiny_face_detector_model-weights_manifest.json", local: "tiny_face_detector_model-weights_manifest.json" },
  { remote: "tiny_face_detector_model.bin", local: "tiny_face_detector_model.bin" },
  { remote: "face_landmark_68_model-weights_manifest.json", local: "face_landmark_68_model-weights_manifest.json" },
  { remote: "face_landmark_68_model.bin", local: "face_landmark_68_model.bin" },
  { remote: "face_recognition_model-weights_manifest.json", local: "face_recognition_model-weights_manifest.json" },
  { remote: "face_recognition_model.bin", local: "face_recognition_model.bin" }
];

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

console.log("Bắt đầu tải các mô hình AI từ CDN...");

function downloadFile(fileItem) {
  return new Promise((resolve, reject) => {
    const fileUrl = `${BASE_URL}${fileItem.remote}`;
    const destPath = path.join(TARGET_DIR, fileItem.local);
    const file = fs.createWriteStream(destPath);

    https.get(fileUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Tải thất bại: ${response.statusCode} cho file ${fileItem.remote}`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        console.log(`Đã tải thành công: ${fileItem.local}`);
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function start() {
  for (const file of FILES) {
    try {
      await downloadFile(file);
    } catch (error) {
      console.error(`Lỗi khi tải file ${file.remote}:`, error.message);
    }
  }
  console.log("Tải hoàn tất tất cả mô hình AI! Thư mục lưu trữ:", TARGET_DIR);
}

start();
