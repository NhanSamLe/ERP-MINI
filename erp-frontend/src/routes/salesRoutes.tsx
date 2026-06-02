import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import SalesDashboard from "../features/sales/SalesDashboard";
import SaleOrderListPage from "@/features/sales/pages/SaleOrderListPage";
import SaleOrderDetailPage from "@/features/sales/pages/SaleOrderDetailPage";
import SaleOrderEditPage from "@/features/sales/pages/SaleOrderEditPage";
import SaleOrderCreatePage from "@/features/sales/pages/SaleOrderCreatePage";
import InvoiceListContainer from "@/features/sales/pages/InvoiceListContainer";
import InvoiceDetailPage from "@/features/sales/pages/InvoiceDetailPage";
import ReceiptListPage from "@/features/sales/pages/ReceiptListPage";
import ReceiptCreatePage from "@/features/sales/pages/ReceiptCreatePage";
import ReceiptDetailPage from "@/features/sales/pages/ReceiptDetailPage";
import QuotationListPage from "@/features/sales/pages/QuotationListPage";
import QuotationCreatePage from "@/features/sales/pages/QuotationCreatePage";
import QuotationDetailPage from "@/features/sales/pages/QuotationDetailPage";
import QuotationEditPage from "@/features/sales/pages/QuotationEditPage";
import SalesReturnListPage from "@/features/sales/pages/SalesReturnListPage";
import SalesReturnCreatePage from "@/features/sales/pages/SalesReturnCreatePage";
import SalesReturnDetailPage from "@/features/sales/pages/SalesReturnDetailPage";
import SalesReturnAccountingPage from "@/features/finance/page/SalesReturnAccountingPage";
const salesRoutes: RouteObject[] = [
  // ── Quotations ──
  {
    path: "/sales/quotations",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "ADMIN"]}>
        <QuotationListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/sales/quotations/create",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER"]}>
        <QuotationCreatePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/sales/quotations/:id/edit",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER"]}>
        <QuotationEditPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/sales/quotations/:id",
    element: (
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "ADMIN", "ACCOUNT", "CEO"]}>
        <QuotationDetailPage />
      </ProtectedRoute>
    ),
  },
  // ── Sales Dashboard ──
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
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER",  "ACCOUNT", "WHSTAFF","CEO"]}>
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
      "SALES", "SALESMANAGER", "BRANCH_MANAGER", "CEO", "ADMIN", "ACCOUNT", "CHACC","WHSTAFF"
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
{
  path: "/sales/returns",
  element: (
    <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "BRANCH_MANAGER", "WHSTAFF", "WHMANAGER", "ACCOUNT", "CHACC"]}>
      <SalesReturnListPage />
    </ProtectedRoute>
  ),
},
{
  path: "/sales/returns/create",
  element: (
    <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "BRANCH_MANAGER"]}>
      <SalesReturnCreatePage />
    </ProtectedRoute>
  ),
},
{
  path: "/sales/returns/:kind/:id",
  element: (
    <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER", "BRANCH_MANAGER", "WHSTAFF", "WHMANAGER", "ACCOUNT", "CHACC"]}>
      <SalesReturnDetailPage />
    </ProtectedRoute>
  ),
},
{
  path: "/sales/returns-accounting",
  element: (
    <ProtectedRoute allowedRoles={["ACCOUNT", "CHACC"]}>
      <SalesReturnAccountingPage />
    </ProtectedRoute>
  ),
},
{
  path: "/invoices",
  element: (
    <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER","ACCOUNT","CHACC"]}>
      <InvoiceListContainer/>
    </ProtectedRoute>
  ),
},
{
  path: "/invoices/:id",
  element: (
    <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER","ACCOUNT","CHACC"]}>
      <InvoiceDetailPage/>
    </ProtectedRoute>
  ),
},
{
  path: "/receipts",
  element: (
    <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER","ACCOUNT","CHACC"]}>
      <ReceiptListPage/>
    </ProtectedRoute>
  ),
},
{
  path: "/receipts/create",
  element: (
    <ProtectedRoute allowedRoles={["ACCOUNT","CHACC"]}>
      <ReceiptCreatePage/>
    </ProtectedRoute>
  ),
},
{
  path: "/receipts/:id",
  element: (
    <ProtectedRoute allowedRoles={["ACCOUNT","CHACC"]}>
      <ReceiptDetailPage/>
    </ProtectedRoute>
  ),
}

];

export default salesRoutes;
