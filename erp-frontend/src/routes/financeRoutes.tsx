import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import FinanceDashboard from "../features/finance/FinanceDashboard";

const financeRoutes: RouteObject[] = [
  {
    path: "/finance",
    element: (
      <ProtectedRoute allowedRoles={["CHACC", "ACCOUNT"]}>
        <FinanceDashboard />
      </ProtectedRoute>
    ),
  },
];

export default financeRoutes;
