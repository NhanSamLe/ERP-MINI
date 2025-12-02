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
      <ProtectedRoute allowedRoles={["SALES", "SALESMANAGER",  "ACCOUNT"]}>
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
