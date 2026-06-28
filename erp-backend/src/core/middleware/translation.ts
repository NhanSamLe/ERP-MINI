import { Request, Response, NextFunction } from "express";

const dictionary: { [key: string]: string } = {
  // General & Auth errors
  "User not found": "Không tìm thấy người dùng.",
  "Invalid password": "Mật khẩu không chính xác.",
  "Access denied": "Truy cập bị từ chối.",
  "Unauthorized": "Không có quyền truy cập.",
  "Forbidden": "Không có quyền thực hiện hành động này.",
  "Internal Server Error": "Lỗi hệ thống.",
  "Server error": "Lỗi máy chủ.",
  "Database connection error": "Lỗi kết nối cơ sở dữ liệu.",
  "Validation error": "Lỗi xác thực dữ liệu.",
  "Token expired": "Phiên đăng nhập đã hết hạn.",
  "Invalid token": "Mã xác thực không hợp lệ.",
  "No refresh token provided": "Không tìm thấy mã làm mới (refresh token).",
  "Invalid or expired refresh token": "Mã làm mới không hợp lệ hoặc đã hết hạn.",
  "You cannot delete your own account": "Bạn không thể tự xóa tài khoản của chính mình.",
  "No file uploaded": "Không có tập tin nào được tải lên.",
  "Failed to initialize Qdrant Collection: fetch failed": "Lỗi kết nối bộ lưu trữ vector (Qdrant).",
  "WebSocket authentication error: jwt expired": "Phiên kết nối WebSocket đã hết hạn.",
  "Cannot read properties of undefined": "Lỗi đọc thuộc tính của đối tượng không xác định.",
  "Unexpected token": "Dữ liệu không đúng định dạng.",

  // Master Data & General DB
  "UOM not found": "Không tìm thấy đơn vị tính.",
  "Product not found": "Không tìm thấy sản phẩm.",
  "Branch not found": "Không tìm thấy chi nhánh.",
  "Company not found": "Không tìm thấy công ty.",
  "Partner not found": "Không tìm thấy đối tác.",
  "Role not found": "Không tìm thấy vai trò.",
  "Invalid role ID provided": "Vai trò được cung cấp không hợp lệ.",
  "Username already exists": "Tên đăng nhập đã tồn tại.",
  "Email already exists": "Địa chỉ email đã tồn tại.",
  "Phone number already exists": "Số điện thoại đã tồn tại.",
  "Cannot find exchange rate": "Không tìm thấy thông tin tỷ giá.",
  "Exchange rate already exists": "Tỷ giá cho cặp tiền này đã tồn tại."
};

export function translationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Intercept res.json
  const originalJson = res.json;
  res.json = function(body: any) {
    if (res.statusCode >= 400 && body && typeof body === "object") {
      if (typeof body.message === "string") {
        body.message = translateMessage(body.message);
      }
    }
    return originalJson.call(this, body);
  };

  // Intercept res.send
  const originalSend = res.send;
  res.send = function(body: any) {
    if (res.statusCode >= 400 && typeof body === "string") {
      try {
        const parsed = JSON.parse(body);
        if (parsed && typeof parsed === "object" && typeof parsed.message === "string") {
          parsed.message = translateMessage(parsed.message);
          body = JSON.stringify(parsed);
        }
      } catch (e) {
        body = translateMessage(body);
      }
    }
    return originalSend.call(this, body);
  };

  next();
}

function translateMessage(msg: string): string {
  if (!msg) return msg;

  // 1. Exact match dictionary
  if (dictionary[msg]) {
    return dictionary[msg];
  }

  // 2. Pattern match for database errors
  if (msg.includes("in field list is ambiguous")) {
    return "Trường dữ liệu bị trùng lặp hoặc không rõ ràng khi truy vấn cơ sở dữ liệu.";
  }
  if (msg.includes("Unknown column")) {
    const colMatch = msg.match(/Unknown column '([^']+)'/);
    const colName = colMatch ? colMatch[1] : "";
    return `Trường dữ liệu không tồn tại trên hệ thống: ${colName || msg}`;
  }
  if (msg.includes("cannot be null")) {
    const fieldMatch = msg.match(/Column '([^']+)' cannot be null/);
    const fieldName = fieldMatch ? fieldMatch[1] : "";
    return `Trường thông tin bắt buộc không được để trống: ${fieldName || msg}`;
  }
  if (msg.includes("is not valid JSON")) {
    return "Định dạng JSON không hợp lệ.";
  }
  if (msg.includes("Cannot find module")) {
    return "Lỗi hệ thống: Thiếu module phụ thuộc.";
  }
  if (msg.includes("jwt expired")) {
    return "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.";
  }
  if (msg.includes("Validation error") || msg.includes("validation error")) {
    return "Lỗi xác thực dữ liệu. Vui lòng kiểm tra lại thông tin nhập vào.";
  }

  return msg;
}
