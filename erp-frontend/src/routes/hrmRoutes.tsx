import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import HrmDashboard from "../features/hrm/HrmDashboard";

const hrmRoutes: RouteObject[] = [
  {
    path: "/hrm",
    element: (
      <ProtectedRoute allowedRoles={["HRMANAGER"]}>
        <HrmDashboard />
      </ProtectedRoute>
    ),
  },
];

export default hrmRoutes;
