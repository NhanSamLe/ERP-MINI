import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { getErrorMessage } from "../../../utils/ErrorHelper";
import * as authService from "../auth.service";
import AuthLayout from "../AuthLayout";
import { PasswordInput } from "../../../components/ui/PasswordInput";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
        <Alert type="error" message ={
            <div>
          <p className="text-sm">{error}</p>
          <Link
            to="/forgot-password"
            className="text-sm text-orange-500 hover:text-orange-600 font-medium mt-2 inline-block"
          >
            Yêu cầu link reset mới →
          </Link>
          </div>
        }/>   
      ) : (
        <form onSubmit={handleReset} className="space-y-5">

          <PasswordInput 
           label="Mật khẩu mới"
           value={newPassword}
          onChange={setNewPassword}
          placeholder="Nhập mật khẩu mới"
          required
          disabled={!!success}
           error={error ?? undefined}
          />

          <PasswordInput
          label="Xác nhận mật khẩu"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Nhập lại mật khẩu"
          required
          disabled={!!success}
          error={
            confirmPassword && confirmPassword !== newPassword
              ? "Mật khẩu không khớp"
              : undefined
        }
        />

          {/* Password Requirements */}
          <Alert type="info"message={
              <div>
                <p className="text-xs font-medium mb-1">Yêu cầu mật khẩu:</p>
                <ul className="text-xs space-y-1 ml-4 list-disc">
                  <li>Tối thiểu 6 ký tự</li>
                  <li>Nên bao gồm chữ hoa, chữ thường và số</li>
                </ul>
              </div>
            }
          />
          {/* Error Message */}
          {error && <Alert type="error" message={error}/>}
          {/* Success Message */}
          {success && <Alert type="success" message={success}/>}

          {/* Submit Button */}
          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            loading={!!success}
          >
            {success ? "Đang chuyển hướng..." : "Đặt lại mật khẩu"}
          </Button>

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
