import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import MasterDataDashboard from "../features/master-data/MasterDataDashboard";

const masterDataRoutes: RouteObject[] = [
  {
    path: "/master-data",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <MasterDataDashboard />
      </ProtectedRoute>
    ),
  },
];

export default masterDataRoutes;
