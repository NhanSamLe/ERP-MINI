import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import CrmDashboard from "../features/crm/CrmDashboard";

const crmRoutes: RouteObject[] = [
  {
    path: "/crm",
    element: (
      <ProtectedRoute allowedRoles={["CEO", "SALESMANAGER"]}>
        <CrmDashboard />
      </ProtectedRoute>
    ),
  },
];

export default crmRoutes;
