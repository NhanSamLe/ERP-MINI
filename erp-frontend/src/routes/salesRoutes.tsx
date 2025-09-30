import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import SalesDashboard from "../features/sales/SalesDashboard";

const salesRoutes: RouteObject[] = [
  {
    path: "/sales",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER"]}>
        <SalesDashboard />
      </ProtectedRoute>
    ),
  },
];

export default salesRoutes;
