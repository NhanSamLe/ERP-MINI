import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { setToken, setUser } from "./authSlice";
import * as authService from "./auth.service";
import { AxiosError } from "axios";
import { roleRoutes } from "../../routes/roleRoutes";
import { User} from "lucide-react";
import { FaFacebook, FaGoogle, FaGithub } from "react-icons/fa";
import AuthLayout from "./AuthLayout";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Alert } from "../../components/ui/Alert";
import { FormInput } from "../../components/ui/FormInput";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { Button } from "../../components/ui/Button";
import { SocialLoginButtons } from "../../components/ui/SocialLoginButtons";
export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const message = (location.state as { message?: string })?.message;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const socialButtons = [
  {
    name: 'Facebook',
    icon: <FaFacebook className="w-5 h-5 text-blue-600" />,
  
  },
  {
    name: 'Google',
    icon: <FaGoogle className="w-5 h-5 text-red-500" />,
  },
  {
    name: 'GitHub',
    icon: <FaGithub className="w-5 h-5" />,
  },
];

  // check  auth neu co chuyen trang k vao login 
  const { isAuthenticated, user , loading} = useSelector((state: RootState) => state.auth);
  if (loading) {
    return <div>Loading...</div>;
  }
  if (isAuthenticated && user) {
    const rolePath = roleRoutes[user.role.code] || "/profile";
    return <Navigate to={rolePath} replace />;
  }
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // 1. gọi API login → lấy access token
      const { token } = await authService.login({ username, password , rememberMe});
      dispatch(setToken(token));
      // 2. gọi API /auth/me → lấy thông tin user
      const user = await authService.getProfile();
      dispatch(setUser(user));
      const rolePath = roleRoutes[user.role.code] || "/profile";
      navigate(rolePath);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message || "Login failed");
    }
  };

  return (
    <AuthLayout>
       
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng nhập</h1>
        {message && <Alert type="success" message={message} />}
        <p className="text-gray-600 mb-6">
          Truy cập hệ thống ERP để quản lý doanh nghiệp của bạn.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <FormInput
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="Enter your username"
          required
          icon={<User className="w-5 h-5 text-gray-400" />}
        />

        <PasswordInput
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          required
        />
        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-orange-400 border-gray-300 rounded focus:ring-orange-400"
            />
            <span className="ml-2 text-sm text-gray-700">Remember me</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            Forgot Password?
          </Link>
        </div>

       {error && <Alert type="error" message={error} />}


       <Button type="submit" fullWidth>
          Sign in
        </Button>
      </form>

      <SocialLoginButtons buttons={socialButtons} />
    </AuthLayout>
  );
}
