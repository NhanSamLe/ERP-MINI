import { RouteObject } from "react-router-dom";
import LoginPage from "../features/auth/page/LoginPage";
import ProtectedRoute from "../components/ProtectedRoute";
import ForgotPasswordPage from "../features/auth/page/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/page/ResetPasswordPage";
import UserProfile from "../features/auth/page/UserProfilePage";
import Layout from "../components/layout/Layout";
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
