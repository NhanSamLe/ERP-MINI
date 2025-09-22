/**
 * Sinh code tự động dựa trên prefix + timestamp
 */
export const generateCode = (prefix: string): string => {
  const ts = Date.now().toString().slice(-6);
  return `${prefix}-${ts}`;
};
/**
 * Tạo slug từ chuỗi
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric with dash
    .replace(/(^-|-$)+/g, ""); // remove leading/trailing dash
};
/**
 * Làm sạch chuỗi (trim, loại bỏ khoảng trắng thừa)
 */
export const cleanString = (text: string): string => {
  return text.replace(/\s+/g, " ").trim();
};
