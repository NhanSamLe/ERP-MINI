import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import SalesDashboard from "../features/sales/SalesDashboard";
import SaleOrderListPage from "@/features/sales/pages/SaleOrderListPage";
import SaleOrderDetailPage from "@/features/sales/pages/SaleOrderDetailPage";
import SaleOrderEditPage from "@/features/sales/pages/SaleOrderEditPage";
import SaleOrderCreatePage from "@/features/sales/pages/SaleOrderCreatePage";
// 👇 import thêm
import InvoiceListPage from "@/features/sales/pages/InvoiceListPage";
import InvoiceDetailPage from "@/features/sales/pages/InvoiceDetailPage";
import ReceiptListPage from "@/features/sales/pages/ReceiptListPage";
import ReceiptDetailPage from "@/features/sales/pages/ReceiptDetailPage";
const salesRoutes: RouteObject[] = [
  {
    path: "/sales",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER"]}>
        <SalesDashboard />
      </ProtectedRoute>
    ),
  },
   {
    path: "/sales/orders",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER"]}>
        <SaleOrderListPage />
      </ProtectedRoute>
    ),
  },
  {
  path: "/sales/orders/:id/edit",
  element: (
    <ProtectedRoute allowedRoles={["SALES"]}>
      <SaleOrderEditPage />
    </ProtectedRoute>
  ),
},
{
  path: "/sales/orders/:id",
  element: (
    <ProtectedRoute allowedRoles={[
      "SALES", "SALESMANAGER", "BRMN", "CEO", "ADMIN", "ACCOUNT", "CHACC"
    ]}>
      <SaleOrderDetailPage />
    </ProtectedRoute>
  ),
},
{
  path: "/sales/orders/create",
  element: (
    <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER"]}>
      <SaleOrderCreatePage />
    </ProtectedRoute>
  ),
  
},

// 💰 AR INVOICE LIST
  {
    path: "/sales/invoices",
    element: (
      <ProtectedRoute allowedRoles={["ACCOUNT", "CHACC", "BRMN", "CEO", "ADMIN"]}>
        <InvoiceListPage />
      </ProtectedRoute>
    ),
  },

  // 💰 AR INVOICE DETAIL + POST
  {
    path: "/sales/invoices/:id",
    element: (
      <ProtectedRoute allowedRoles={["ACCOUNT", "CHACC", "BRMN", "CEO", "ADMIN"]}>
        <InvoiceDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/sales/receipts",
    element: (
      <ProtectedRoute allowedRoles={["ACCOUNT", "CHACC"]}>
        <ReceiptListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/sales/receipts/:id",
    element: (
      <ProtectedRoute
        allowedRoles={[
          "ACCOUNT",
          "CHACC",
          "BRANCH_MANAGER",
          "CEO",
          "ADMIN",
        ]}
      >
        <ReceiptDetailPage />
      </ProtectedRoute>
    ),
  },
];

export default salesRoutes;
