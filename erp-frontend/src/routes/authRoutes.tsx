import { RouteObject } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import ProtectedRoute from "../components/ProtectedRoute";
import ForgotPasswordPage from "../features/auth/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/ResetPasswordPage";
// Định nghĩa các route liên quan đến auth
const authRoutes: RouteObject[] = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <div>Đây là trang Profile (chỉ xem được khi login)</div>
      </ProtectedRoute>
    ),
  },
];

export default authRoutes;
