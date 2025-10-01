import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { getErrorMessage } from "../../utils/ErrorHelper";
import * as authService from "./auth.service";
import AuthLayout from "./AuthLayout";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra token khi load trang
    const validate = async () => {
      try {
        if (token) {
          await authService.validateResetToken(token);
          setIsValidToken(true);
        } else {
          setError("Token không tồn tại.");
        }
      } catch {
        setError("Token không hợp lệ hoặc đã hết hạn.");
      }
    };
    validate();
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    try {
      await authService.resetPassword(token!, newPassword);
      setSuccess("Đổi mật khẩu thành công! Đang chuyển hướng...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(getErrorMessage(err) || "Đổi mật khẩu thất bại");
    }
  };

  return (
    <AuthLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Đặt lại mật khẩu</h1>
        <p className="text-gray-600 mb-6">
          Nhập mật khẩu mới cho tài khoản của bạn.
        </p>
      </div>

      {!isValidToken && !success ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
          <Link
            to="/forgot-password"
            className="text-sm text-orange-500 hover:text-orange-600 font-medium mt-2 inline-block"
          >
            Yêu cầu link reset mới →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-5">
          {/* New Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                placeholder="Nhập mật khẩu mới"
                required
                disabled={!!success}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Xác nhận mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                placeholder="Nhập lại mật khẩu mới"
                required
                disabled={!!success}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3.5"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-xs font-medium mb-1">Yêu cầu mật khẩu:</p>
            <ul className="text-blue-700 text-xs space-y-1 ml-4 list-disc">
              <li>Tối thiểu 6 ký tự</li>
              <li>Nên bao gồm chữ hoa, chữ thường và số</li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!!success}
          >
            {success ? "Đang chuyển hướng..." : "Đặt lại mật khẩu"}
          </button>

          {/* Back to Login */}
          {!success && (
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                ← Quay lại đăng nhập
              </Link>
            </div>
          )}
        </form>
      )}
    </AuthLayout>
  );
}
