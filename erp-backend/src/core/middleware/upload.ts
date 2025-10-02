import multer from "multer";
// Lưu file trong bộ nhớ tạm (RAM buffer)
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // giới hạn 5MB
});
