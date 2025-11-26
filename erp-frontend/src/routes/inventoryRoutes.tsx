import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import InventoryDashboard from "../features/inventory/InventoryDashboard";
import StockBalancePage from "../features/inventory/pages/StockBalancePage";

const inventoryRoutes: RouteObject[] = [
  {
    path: "/inventory",
    element: (
      <ProtectedRoute allowedRoles={["WHMANAGER", "WHSTAFF"]}>
        <InventoryDashboard />
      </ProtectedRoute>
    ),
  },

  {
    path: "/inventory/stock",
    element: (
      <ProtectedRoute allowedRoles={["WHMANAGER", "WHSTAFF"]}>
        <StockBalancePage />
      </ProtectedRoute>
    ),
  },
];

export default inventoryRoutes;
