import { RouteObject } from "react-router-dom";
import UserDashBoard from "../features/user/page/UserDashBoard";
import ProtectedRoute from "../components/ProtectedRoute";

const userRoutes: RouteObject[] = [
  {
    path: "/admin/users",
    element: (
      <ProtectedRoute>
          <UserDashBoard />
      </ProtectedRoute>
    ),
  },
];

export default userRoutes;
