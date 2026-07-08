import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import { Navigate } from "react-router-dom";
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
import InvoiceGeneratorPage from "@/features/purchase/pages/document_intelligence/InvoiceGeneratorPage";
// New pages
import RfqListPage from "@/features/purchase/pages/rfq/RfqListPage";
import RfqDetailPage from "@/features/purchase/pages/rfq/RfqDetailPage";
import RfqCreatePage from "@/features/purchase/pages/rfq/RfqCreatePage";
import RfqEditPage from "@/features/purchase/pages/rfq/RfqEditPage";
import RfqComparePage from "@/features/purchase/pages/rfq/RfqComparePage";
import PraListPage from "@/features/purchase/pages/purchaseReturn/PraListPage";
import PraDetailPage from "@/features/purchase/pages/purchaseReturn/PraDetailPage";
import PraCreatePage from "@/features/purchase/pages/purchaseReturn/PraCreatePage";
import PraEditPage from "@/features/purchase/pages/purchaseReturn/PraEditPage";
import DebitNoteListPage from "@/features/purchase/pages/purchaseReturn/DebitNoteListPage";
import DebitNoteDetailPage from "@/features/purchase/pages/purchaseReturn/DebitNoteDetailPage";
import VendorRefundListPage from "@/features/purchase/pages/purchaseReturn/VendorRefundListPage";
import VendorRefundDetailPage from "@/features/purchase/pages/purchaseReturn/VendorRefundDetailPage";
import VendorRefundCreatePage from "@/features/purchase/pages/purchaseReturn/VendorRefundCreatePage";
import PurchaseReturnCreatePage from "@/features/purchase/pages/purchaseReturn/PurchaseReturnCreatePage";
import PurchaseReturnDetailPage from "@/features/purchase/pages/purchaseReturn/PurchaseReturnDetailPage";
import PurchaseReturnEditPage from "@/features/purchase/pages/purchaseReturn/PurchaseReturnEditPage";
import PurchaseReturnListPage from "@/features/purchase/pages/purchaseReturn/PurchaseReturnListPage";
import PriceListListPage from "@/features/purchase/pages/price-lists/PriceListListPage";
import PriceListCreatePage from "@/features/purchase/pages/price-lists/PriceListCreatePage";
import PriceListDetailPage from "@/features/purchase/pages/price-lists/PriceListDetailPage";

const purchaseRoutes: RouteObject[] = [
  {
    path: "/purchase",
    element: (
      <ProtectedRoute
        allowedRoles={[
          "PURCHASE",
          "PURCHASEMANAGER",
          "ACCOUNT",
          "CHACC",
          "CEO",
          "ADMIN",
        ]}
      >
        <PurchaseDashboard />
      </ProtectedRoute>
    ),
  },
  // ─── Price Lists ──────────────────────────────────────────────────────────
  {
    path: "purchase/price-lists",
    element: (
      <ProtectedRoute
        allowedRoles={[
          Roles.PURCHASE,
          Roles.PURCHASEMANAGER,
          Roles.ACCOUNT,
          Roles.CEO,
        ]}
      >
        <PriceListListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/price-lists/create",
    element: (
      <ProtectedRoute allowedRoles={[Roles.PURCHASEMANAGER]}>
        <PriceListCreatePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/price-lists/:id",
    element: (
      <ProtectedRoute
        allowedRoles={[
          Roles.PURCHASE,
          Roles.PURCHASEMANAGER,
          Roles.ACCOUNT,
        ]}
      >
        <PriceListDetailPage />
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
      <ProtectedRoute allowedRoles={["ACCOUNT", "CHACC"]}>
        <ApInvoicePages />
      </ProtectedRoute>
    ),
  },

  {
    path: "purchase/payments",
    element: (
      <ProtectedRoute allowedRoles={["ACCOUNT", "CHACC"]}>
        <ApPaymentPages />
      </ProtectedRoute>
    ),
  },

  {
    path: "purchase/payments/:id",
    element: (
      <ProtectedRoute allowedRoles={["ACCOUNT", "CHACC"]}>
        <ViewApPaymentPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "purchase/invoices/:id",
    element: (
      <ProtectedRoute allowedRoles={["ACCOUNT", "CHACC"]}>
        <ViewApInvoicePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase-orders/create",
    element: (
      <ProtectedRoute allowedRoles={[Roles.PURCHASE, Roles.PURCHASEMANAGER]}>
        <CreatePuchaseOrderPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "purchase-orders/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[Roles.PURCHASE, Roles.PURCHASEMANAGER]}>
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
      <ProtectedRoute allowedRoles={["ACCOUNT", "CHACC"]}>
        <DocumentUploadPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/document-intelligence/upload",
    element: (
      <ProtectedRoute allowedRoles={["ACCOUNT", "CHACC"]}>
        <DocumentUploadPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/document-intelligence/history",
    element: (
      <ProtectedRoute allowedRoles={["ACCOUNT", "CHACC"]}>
        <DocumentHistoryPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/document-intelligence/sandbox",
    element: (
      <ProtectedRoute allowedRoles={["ACCOUNT", "CHACC"]}>
        <InvoiceGeneratorPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/document-intelligence/anomalies",
    element: (
      <ProtectedRoute
        allowedRoles={[
          "ACCOUNT",
          "CHACC",
          "PURCHASEMANAGER",
          "CEO",
        ]}
      >
        <AnomalyDashboardPage />
      </ProtectedRoute>
    ),
  },
  // ─── Vendor redirect ──────────────────────────────────────────────────────
  {
    path: "purchase/vendors",
    element: <Navigate to="/partners?type=supplier" replace />,
  },
  // ─── RFQ ──────────────────────────────────────────────────────────────────
  {
    path: "purchase/rfqs",
    element: (
      <ProtectedRoute
        allowedRoles={[Roles.PURCHASE, Roles.PURCHASEMANAGER, Roles.ACCOUNT]}
      >
        <RfqListPage />
      </ProtectedRoute>
    ),
  },
  // IMPORTANT: "create" and "edit" routes MUST be before ":id" to avoid being matched as id="create"
  {
    path: "purchase/rfqs/create",
    element: (
      <ProtectedRoute allowedRoles={[Roles.PURCHASE, Roles.PURCHASEMANAGER]}>
        <RfqCreatePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/rfqs/:id/edit",
    element: (
      <ProtectedRoute allowedRoles={[Roles.PURCHASE, Roles.PURCHASEMANAGER]}>
        <RfqEditPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/rfqs/compare",
    element: (
      <ProtectedRoute
        allowedRoles={[Roles.PURCHASE, Roles.PURCHASEMANAGER, Roles.ACCOUNT]}
      >
        <RfqComparePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/rfqs/:id",
    element: (
      <ProtectedRoute
        allowedRoles={[Roles.PURCHASE, Roles.PURCHASEMANAGER, Roles.ACCOUNT]}
      >
        <RfqDetailPage />
      </ProtectedRoute>
    ),
  },
  // ─── Purchase Returns ──────────────────────────────────────────────────────
  {
    path: "purchase/return-authorizations",
    element: (
      <ProtectedRoute
        allowedRoles={[
          Roles.PURCHASE,
          Roles.PURCHASEMANAGER,
          Roles.ACCOUNT,
          Roles.CHACC,
        ]}
      >
        <PraListPage />
      </ProtectedRoute>
    ),
  },
  // IMPORTANT: "create" and "edit" MUST be before ":id"
  {
    path: "purchase/return-authorizations/create",
    element: (
      <ProtectedRoute allowedRoles={[Roles.PURCHASE, Roles.PURCHASEMANAGER]}>
        <PraCreatePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/return-authorizations/:id/edit",
    element: (
      <ProtectedRoute allowedRoles={[Roles.PURCHASE, Roles.PURCHASEMANAGER]}>
        <PraEditPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/return-authorizations/:id",
    element: (
      <ProtectedRoute
        allowedRoles={[
          Roles.PURCHASE,
          Roles.PURCHASEMANAGER,
          Roles.ACCOUNT,
          Roles.CHACC,
        ]}
      >
        <PraDetailPage />
      </ProtectedRoute>
    ),
  },
  // ─── Purchase Returns (physical) ──────────────────────────────────────────
  {
    path: "purchase/returns",
    element: (
      <ProtectedRoute
        allowedRoles={[
          Roles.PURCHASE,
          Roles.PURCHASEMANAGER,
          Roles.ACCOUNT,
          Roles.CHACC,
        ]}
      >
        <PurchaseReturnListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/returns/create",
    element: (
      <ProtectedRoute allowedRoles={[Roles.PURCHASE, Roles.PURCHASEMANAGER]}>
        <PurchaseReturnCreatePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/returns/:id/edit",
    element: (
      <ProtectedRoute allowedRoles={[Roles.PURCHASE, Roles.PURCHASEMANAGER]}>
        <PurchaseReturnEditPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/returns/:id",
    element: (
      <ProtectedRoute
        allowedRoles={[
          Roles.PURCHASE,
          Roles.PURCHASEMANAGER,
          Roles.ACCOUNT,
          Roles.CHACC,
        ]}
      >
        <PurchaseReturnDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/debit-notes",
    element: (
      <ProtectedRoute allowedRoles={[Roles.ACCOUNT, Roles.CHACC]}>
        <DebitNoteListPage />
      </ProtectedRoute>
    ),
  },
  // IMPORTANT: "create" MUST be before ":id"
  {
    path: "purchase/debit-notes/:id",
    element: (
      <ProtectedRoute allowedRoles={[Roles.ACCOUNT, Roles.CHACC]}>
        <DebitNoteDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/vendor-refunds",
    element: (
      <ProtectedRoute allowedRoles={[Roles.ACCOUNT, Roles.CHACC]}>
        <VendorRefundListPage />
      </ProtectedRoute>
    ),
  },
  // IMPORTANT: "create" MUST be before ":id"
  {
    path: "purchase/vendor-refunds/create",
    element: (
      <ProtectedRoute allowedRoles={[Roles.ACCOUNT, Roles.CHACC]}>
        <VendorRefundCreatePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "purchase/vendor-refunds/:id",
    element: (
      <ProtectedRoute allowedRoles={[Roles.ACCOUNT, Roles.CHACC]}>
        <VendorRefundDetailPage />
      </ProtectedRoute>
    ),
  },
];

export default purchaseRoutes;
