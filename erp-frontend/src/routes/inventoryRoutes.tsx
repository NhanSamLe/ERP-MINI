import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import InventoryDashboard from "../features/inventory/InventoryDashboard";
import StockBalancePages from "../features/inventory/pages/StockBalancePages";
import StockMovePages from "../features/inventory/pages/StockMovePages";

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
        <StockBalancePages />
      </ProtectedRoute>
    ),
  },
  {
    path: "/inventory/stock_move",
    element: (
      <ProtectedRoute allowedRoles={["WHMANAGER", "WHSTAFF"]}>
        <StockMovePages />
      </ProtectedRoute>
    ),
  },
];

export default inventoryRoutes;
