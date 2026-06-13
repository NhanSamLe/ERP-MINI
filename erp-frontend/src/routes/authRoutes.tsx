import { RouteObject, Navigate, useLocation } from "react-router-dom";
import LoginPage from "../features/auth/page/LoginPage";
import ProtectedRoute from "../components/ProtectedRoute";
import ForgotPasswordPage from "../features/auth/page/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/page/ResetPasswordPage";
import UserProfile from "../features/auth/page/UserProfilePage";
import Layout from "../components/layout/Layout";

// Redirect /activate?token=... → /reset-password?token=...
function ActivateRedirect() {
  const location = useLocation();
  return <Navigate to={`/reset-password${location.search}`} replace />;
}

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
    path: "/activate",
    element: <ActivateRedirect />,
  },
  {
  path: "/profile",
  element: (
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  ),
  children: [
    {
      path: "",
      element: <UserProfile />,
    },
  ],
}
];

export default authRoutes;
