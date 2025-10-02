import { useState } from "react";
import { Mail } from "lucide-react";
import * as authService from "./auth.service";
import { getErrorMessage } from "../../utils/ErrorHelper";
import AuthLayout from "./AuthLayout";
import { Link } from "react-router-dom";
import { Alert } from "../../components/ui/Alert";
import { FormInput } from "../../components/ui/FormInput";
import { Button } from "../../components/ui/Button";
export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setMessage(null);
    setLoading(true);
    
    try {
      const res = await authService.requestPasswordReset(username);
      setMessage(res.message);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <AuthLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quên mật khẩu</h1>
        <p className="text-gray-600 mb-6">
          Nhập tên đăng nhập của bạn, hệ thống sẽ hướng dẫn cách đặt lại mật khẩu qua email.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Username/Email Input */}
         <FormInput
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="Nhập username"
          required
          disabled={loading || !!message}
          icon={<Mail className="w-5 h-5 text-gray-400" />}
        />

        {/* Error Message */}
        {error && <Alert type="error" message={error} />}

        {/* Success Message */}
        {message && <Alert type="success" message={message} />}


        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          disabled={loading || !!message}
          loading={loading}
        >
          {loading ? "Đang gửi..." : message ? "Đã gửi Email" : "Xác thực Email"}
        </Button>

        {/* Back to Login */}
        <div className="text-center">
            <Link
                to="/login"
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
                ← Quay lại đăng nhập
            </Link>
        </div>
      </form>
    </AuthLayout>
  );
}