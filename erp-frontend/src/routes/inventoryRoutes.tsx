import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import InventoryDashboard from "../features/inventory/InventoryDashboard";
import StockBalancePages from "../features/inventory/pages/StockBalancePages";
import StockMovePages from "../features/inventory/pages/StockMovePages";
import ViewStockMovePage from "@/features/inventory/pages/ViewStockMovePage";
import WarehousePages from "@/features/inventory/pages/WarehousePages";
import WarehouseForm from "@/features/inventory/pages/WarehouseForm";

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
    path: "/inventory/warehouses",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <WarehousePages />
      </ProtectedRoute>
    ),
  },
  {
    path: "/inventory/warehouses/create",
    element: <WarehouseForm mode="create" />,
  },
  {
    path: "/inventory/warehouses/:id/edit",
    element: <WarehouseForm mode="edit" />,
  },

  {
    path: "/inventory/stock_move",
    element: (
      <ProtectedRoute allowedRoles={["WHMANAGER", "WHSTAFF"]}>
        <StockMovePages />
      </ProtectedRoute>
    ),
  },

  {
    path: "/inventory/stock_move/view/:id",
    element: (
      <ProtectedRoute allowedRoles={["WHMANAGER", "WHSTAFF"]}>
        <ViewStockMovePage />
      </ProtectedRoute>
    ),
  },
];

export default inventoryRoutes;
