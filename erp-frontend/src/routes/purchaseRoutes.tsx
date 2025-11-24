import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import PurchaseDashboard from "../features/purchase/PurchaseDashboard";
import PurchaseOrderPage from "../features/purchase/pages/PurchaseOrderPages";
import CreatePuchaseOrderPage from "../features/purchase/pages/CreatePurchaseOrderPage";
import EditPurchaseOrderPage from "../features/purchase/pages/EditPurchaseOrderPage";

const purchaseRoutes: RouteObject[] = [
  {
    path: "/purchase",
    element: (
      <ProtectedRoute allowedRoles={["PURCHASE"]}>
        <PurchaseDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/orders",
    element: (
      <ProtectedRoute allowedRoles={["PURCHASE"]}>
        <PurchaseOrderPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase-orders/create",
    element: (
      <ProtectedRoute allowedRoles={["PURCHASE"]}>
        <CreatePuchaseOrderPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "purchase-orders/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={["PURCHASE"]}>
        <EditPurchaseOrderPage />
      </ProtectedRoute>
    ),
  },
];

export default purchaseRoutes;
