import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import PurchaseDashboard from "../features/purchase/PurchaseDashboard";
import PurchaseOrderPage from "../features/purchase/pages/PurchaseOrderPages";
import CreatePuchaseOrderPage from "../features/purchase/pages/CreatePurchaseOrderPage";
import EditPurchaseOrderPage from "../features/purchase/pages/EditPurchaseOrderPage";
import ViewPurchaseOrderPage from "../features/purchase/pages/ViewPurchaseOrderPage";
import AuditLogPage from "../features/purchase/pages/AuditLogPage";
import { Roles } from "@/types/enum";
import ApInvoicePages from "@/features/purchase/pages/ap_invoice/ApInvoicePages";
import ViewApInvoicePage from "@/features/purchase/pages/ap_invoice/ViewApInvoicePage";
import ApPaymentPages from "@/features/purchase/pages/ap_payment/ApPaymentPages";
import ViewApPaymentPage from "@/features/purchase/pages/ap_payment/ViewApPaymentPage";
import DocumentUploadPage from "@/features/purchase/pages/document_intelligence/DocumentUploadPage";
import DocumentHistoryPage from "@/features/purchase/pages/document_intelligence/DocumentHistoryPage";
import AnomalyDashboardPage from "@/features/purchase/pages/document_intelligence/AnomalyDashboardPage";

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
    path: "purchase/payments",
    element: (
      <ProtectedRoute allowedRoles={[Roles.ACCOUNT, Roles.CHACC]}>
        <ApPaymentPages />
      </ProtectedRoute>
    ),
  },

  {
    path: "purchase/payments/:id",
    element: (
      <ProtectedRoute allowedRoles={[Roles.ACCOUNT, Roles.CHACC]}>
        <ViewApPaymentPage />
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
  {
    path: "purchase-orders/:po_id/audit-logs",
    element: (
      <ProtectedRoute
        allowedRoles={[
          Roles.PURCHASE,
          Roles.PURCHASEMANAGER,
          Roles.WHSTAFF,
          Roles.ACCOUNT,
          Roles.CEO,
        ]}
      >
        <AuditLogPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/document-intelligence",
    element: (
      <ProtectedRoute allowedRoles={[Roles.ACCOUNT, Roles.CHACC]}>
        <DocumentUploadPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/document-intelligence/upload",
    element: (
      <ProtectedRoute allowedRoles={[Roles.ACCOUNT, Roles.CHACC]}>
        <DocumentUploadPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/document-intelligence/history",
    element: (
      <ProtectedRoute allowedRoles={[Roles.ACCOUNT, Roles.CHACC]}>
        <DocumentHistoryPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/document-intelligence/anomalies",
    element: (
      <ProtectedRoute
        allowedRoles={[
          Roles.ACCOUNT,
          Roles.CHACC,
          Roles.PURCHASEMANAGER,
          Roles.CEO,
        ]}
      >
        <AnomalyDashboardPage />
      </ProtectedRoute>
    ),
  },
];

export default purchaseRoutes;
