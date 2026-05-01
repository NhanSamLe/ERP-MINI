import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import { ocrConfig } from "../services/ocrConfig.service";

const ALLOWED_MIMETYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];
const TEMP_DIR = "uploads/invoices/temp";

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `invoice-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isMimetypeValid = ALLOWED_MIMETYPES.includes(file.mimetype);
  const isExtValid = ALLOWED_EXTENSIONS.includes(ext);

  if (isMimetypeValid && isExtValid) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Định dạng file không hợp lệ. Chỉ chấp nhận PDF, JPG, JPEG, PNG.",
      ),
    );
  }
};

// Lấy max file size từ config (MB → bytes)
const maxFileSizeBytes = ocrConfig.get("maxFileSizeMb") * 1024 * 1024;

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxFileSizeBytes },
});

export const invoiceUploadMiddleware = (req: Request, res: any, next: any) => {
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        const maxMb = ocrConfig.get("maxFileSizeMb");
        return next(
          new Error(`File quá lớn. Kích thước tối đa là ${maxMb}MB.`),
        );
      }
      return next(err);
    }
    next();
  });
};
