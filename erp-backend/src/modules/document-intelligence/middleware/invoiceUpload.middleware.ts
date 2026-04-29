import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

const ALLOWED_MIMETYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export const invoiceUploadMiddleware = (req: Request, res: any, next: any) => {
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new Error("File quá lớn. Kích thước tối đa là 10MB."));
      }
      return next(err);
    }
    next();
  });
};
