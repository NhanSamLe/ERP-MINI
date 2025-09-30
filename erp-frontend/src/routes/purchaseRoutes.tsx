import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import PurchaseDashboard from "../features/purchase/PurchaseDashboard";

const purchaseRoutes: RouteObject[] = [
  {
    path: "/purchase",
    element: (
      <ProtectedRoute allowedRoles={["PURCHASE"]}>
        <PurchaseDashboard />
      </ProtectedRoute>
    ),
  },
];

export default purchaseRoutes;
