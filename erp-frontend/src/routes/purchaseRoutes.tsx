import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import PurchaseDashboard from "../features/purchase/PurchaseDashboard";
import PurchaseOrderPage from "../features/purchase/pages/PurchaseOrderPages";
import CreatePuchaseOrderPage from "../features/purchase/pages/CreatePurchaseOrderPage";
import EditPurchaseOrderPage from "../features/purchase/pages/EditPurchaseOrderPage";
import ViewPurchaseOrderPage from "../features/purchase/pages/ViewPurchaseOrderPage";
import { Roles } from "@/types/enum";

const purchaseRoutes: RouteObject[] = [
  {
    path: "/purchase",
    element: (
      <ProtectedRoute allowedRoles={[Roles.PURCHASE, Roles.PURCHASEMANAGER]}>
        <PurchaseDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/orders",
    element: (
      <ProtectedRoute allowedRoles={[Roles.PURCHASE, Roles.PURCHASEMANAGER]}>
        <PurchaseOrderPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase-orders/create",
    element: (
      <ProtectedRoute allowedRoles={[Roles.PURCHASE]}>
        <CreatePuchaseOrderPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "purchase-orders/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[Roles.PURCHASE]}>
        <EditPurchaseOrderPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase-orders/view/:id",
    element: (
      <ProtectedRoute allowedRoles={[Roles.PURCHASE, Roles.PURCHASEMANAGER]}>
        <ViewPurchaseOrderPage />
      </ProtectedRoute>
    ),
  },
  
];

export default purchaseRoutes;
