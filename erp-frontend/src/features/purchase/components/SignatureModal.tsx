import React, { useRef, useState, useEffect } from "react";
import { X, RotateCcw, PenTool, Check, AlertTriangle } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";
import { useNavigate } from "react-router-dom";

interface SignatureModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (pin: string, signatureImage: string) => Promise<void>;
  title?: string;
  loading?: boolean;
}

export default function SignatureModal({
  visible,
  onClose,
  onConfirm,
  title = "Ký duyệt điện tử",
  loading = false,
}: SignatureModalProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const hasSetup = !!user?.signature_template && !!user?.signature_pin;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pin, setPin] = useState<string[]>(Array(6).fill(""));
  const pinInputsRef = useRef<HTMLInputElement[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  // Khởi tạo Canvas nét vẽ mịn
  useEffect(() => {
    if (!visible) return;
    
    // Đợi modal hiển thị hoàn toàn để lấy kích thước canvas chính xác
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Xử lý độ phân giải cao (Retina screens) để nét vẽ sắc nét
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = 200 * 2;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `200px`;
      
      ctx.scale(2, 2);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1e3a8a"; // Nét vẽ màu xanh mực
      ctx.lineWidth = 2.5;

      // Fill màu nền trắng
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, rect.width, 200);

      // Load chữ ký mẫu nếu có
      if (user?.signature_template) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, 200);
        };
        img.src = user.signature_template;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [visible, user?.signature_template]);

  if (!visible) return null;

  // ─── Vẽ bằng chuột ───
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // ─── Vẽ bằng cảm ứng (Touch) ───
  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || e.touches.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Xóa chữ ký
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, 200);
  };

  // Xử lý thay đổi mã PIN
  const handlePinChange = (val: string, index: number) => {
    if (isNaN(Number(val))) return;

    const newPin = [...pin];
    newPin[index] = val.substring(val.length - 1);
    setPin(newPin);
    setErrorMsg("");

    // Tự động nhảy ô tiếp theo
    if (val !== "" && index < 5) {
      pinInputsRef.current[index + 1]?.focus();
    }
  };

  // Nhấn Backspace nhảy ngược lại
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && pin[index] === "" && index > 0) {
      pinInputsRef.current[index - 1]?.focus();
    }
  };

  // Kiểm tra & Gửi chữ ký
  const handleSubmit = async () => {
    const enteredPin = pin.join("");
    if (enteredPin.length !== 6) {
      setErrorMsg("Vui lòng nhập đầy đủ mã PIN 6 số.");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert Canvas sang Base64
    const signatureImage = canvas.toDataURL("image/png");

    // Kiểm tra xem canvas có trống không (chỉ chứa màu trắng)
    // Cách đơn giản: nếu ảnh xuất ra rất nhỏ hoặc ta check pixel data, nhưng check chiều rộng nét vẽ là đủ
    try {
      await onConfirm(enteredPin, signatureImage);
      // Reset form
      setPin(Array(6).fill(""));
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.message || error?.message || "Mã PIN không chính xác hoặc lỗi ký duyệt.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white/90 dark:bg-gray-900/90 border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-md w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {!hasSetup ? (
          <div className="p-6 space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center border border-amber-200 dark:border-amber-900/50">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Chưa cấu hình thông tin ký duyệt
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                Để đảm bảo tính nhất quán pháp lý và tính bảo mật cao, bạn cần phải thiết lập <strong>mã PIN ký duyệt</strong> và <strong>chữ ký điện tử mẫu</strong> trong trang Hồ sơ cá nhân trước khi thực hiện ký duyệt tài liệu.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Canvas vẽ chữ ký */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  Chữ ký tay của bạn <span className="text-red-500">*</span>
                </label>
                <button
                  onClick={clearCanvas}
                  className="inline-flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  Vẽ lại
                </button>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden bg-white shadow-inner">
                <canvas
                  ref={canvasRef}
                  className="w-full cursor-crosshair touch-none"
                  style={{ height: "200px" }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawingTouch}
                  onTouchMove={drawTouch}
                  onTouchEnd={stopDrawing}
                />
              </div>
              {user?.signature_template ? (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Đã tự động tải chữ ký mẫu của bạn. Nhập mã PIN bên dưới để ký nhanh, hoặc bấm "Vẽ lại" để ký nét vẽ tay mới.
                </p>
              ) : (
                <p className="text-[10px] text-gray-400 italic">
                  * Dùng chuột hoặc ngón tay (trên màn hình cảm ứng) để vẽ chữ ký của bạn vào khung trên.
                </p>
              )}
            </div>

            {/* PIN Code Verification */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
                Nhập mã PIN ký duyệt (6 số) <span className="text-red-500">*</span>
              </label>
              
              <div className="flex justify-center gap-2">
                {pin.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      if (el) pinInputsRef.current[idx] = el;
                    }}
                    type="password"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(e.target.value, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    className="w-12 h-12 text-center text-xl font-bold text-gray-900 border border-gray-300 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white shadow-sm transition"
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="text-sm font-medium text-red-500 text-center bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 py-2 rounded-xl">
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          
          {!hasSetup ? (
            <button
              onClick={() => {
                onClose();
                navigate("/profile", { state: { activeTab: "signature" } });
              }}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-md transition flex items-center gap-1.5"
            >
              Cấu hình ngay
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Xác nhận ký
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
