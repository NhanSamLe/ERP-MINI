import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import SalesDashboard from "../features/sales/SalesDashboard";
import SaleOrderListPage from "@/features/sales/pages/SaleOrderListPage";
import SaleOrderDetailPage from "@/features/sales/pages/SaleOrderDetailPage";
import SaleOrderEditPage from "@/features/sales/pages/SaleOrderEditPage";
import SaleOrderCreatePage from "@/features/sales/pages/SaleOrderCreatePage";
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
}


];

export default salesRoutes;
