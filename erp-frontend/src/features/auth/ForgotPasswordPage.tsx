import { useState } from "react";
import { Mail } from "lucide-react";
import * as authService from "./auth.service";
import { getErrorMessage } from "../../utils/ErrorHelper";
import AuthLayout from "./AuthLayout";
import { Link } from "react-router-dom";

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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
              placeholder="Nhập username "
              required
            />
            <Mail className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">{message}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !!message}
          className="w-full bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 rounded-lg transition duration-200"
        >
            Xác thực Email
        </button>

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