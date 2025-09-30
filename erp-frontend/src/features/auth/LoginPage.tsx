import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setToken, setUser } from "./authSlice";
import * as authService  from "./auth.service";
import { AxiosError } from "axios";
import { roleRoutes } from "../../routes/roleRoutes";
export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // 1. gọi API login → lấy access token
      const { token } = await authService.login({ username, password });
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
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Login Page</h1>

      <form
        onSubmit={handleLogin}
        className="mt-4 w-80 flex flex-col gap-4 bg-gray-100 p-6 rounded-lg shadow"
      >
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border rounded p-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded p-2"
          required
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Login
        </button>
      </form>
    </div>
  );
}
