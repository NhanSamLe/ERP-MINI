import { RouteObject } from "react-router-dom";
import UserDashBoard from "../features/user/page/UserDashBoard";
import AdminDashboard from "../features/user/page/AdminDashboard";
import ProtectedRoute from "../components/ProtectedRoute";

const userRoutes: RouteObject[] = [
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <UserDashBoard />
      </ProtectedRoute>
    ),
  },
];

export default userRoutes;
