import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import PurchaseDashboard from "../features/purchase/PurchaseDashboard";
import PurchaseOrderPage from "../features/purchase/pages/PurchaseOrderPages";
import CreatePuchaseOrderPage from "../features/purchase/pages/CreatePurchaseOrderPage";
import EditPurchaseOrderPage from "../features/purchase/pages/EditPurchaseOrderPage";
import ViewPurchaseOrderPage from "../features/purchase/pages/ViewPurchaseOrderPage";
import { Roles } from "@/types/enum";
import ApInvoicePages from "@/features/purchase/pages/ap_invoice/ApInvoicePages";
import ViewApInvoicePage from "@/features/purchase/pages/ap_invoice/ViewApInvoicePage";

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
      <ProtectedRoute
        allowedRoles={[
          Roles.PURCHASE,
          Roles.PURCHASEMANAGER,
          Roles.ACCOUNT,
          Roles.WHSTAFF,
          Roles.CEO,
        ]}
      >
        <PurchaseOrderPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "purchase/invoices",
    element: (
      <ProtectedRoute allowedRoles={[Roles.ACCOUNT, Roles.CHACC]}>
        <ApInvoicePages />
      </ProtectedRoute>
    ),
  },

  {
    path: "purchase/invoices/:id",
    element: (
      <ProtectedRoute allowedRoles={[Roles.ACCOUNT, Roles.CHACC]}>
        <ViewApInvoicePage />
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
      <ProtectedRoute
        allowedRoles={[
          Roles.PURCHASE,
          Roles.PURCHASEMANAGER,
          Roles.WHSTAFF,
          Roles.ACCOUNT,
        ]}
      >
        <ViewPurchaseOrderPage />
      </ProtectedRoute>
    ),
  },
];

export default purchaseRoutes;
