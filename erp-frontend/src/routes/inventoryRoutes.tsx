import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import InventoryDashboard from "../features/inventory/InventoryDashboard";
import StockBalancePages from "../features/inventory/pages/StockBalancePages";
import StockMovePages from "../features/inventory/pages/StockMovePages";
import ViewStockMovePage from "@/features/inventory/pages/ViewStockMovePage";
import WarehousePages from "@/features/inventory/pages/WarehousePages";
import WarehouseForm from "@/features/inventory/pages/WarehouseForm";
import StockLocationPage from "@/features/inventory/pages/StockLocationPage";
import StockLotPage from "@/features/inventory/pages/StockLotPage";
import PhysicalInventoryListPage from "@/features/inventory/pages/PhysicalInventoryListPage";
import PhysicalInventoryDetailPage from "@/features/inventory/pages/PhysicalInventoryDetailPage";
import StockReportPage from "@/features/reports/pages/StockReportPage";

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
    path: "/inventory/locations",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN", "WHMANAGER", "WHSTAFF"]}>
        <StockLocationPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/inventory/lots",
    element: (
      <ProtectedRoute
        allowedRoles={["ADMIN", "WHMANAGER", "WHSTAFF", "PURCHASE"]}
      >
        <StockLotPage />
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

  {
    path: "/inventory/stock_move/view/:id",
    element: (
      <ProtectedRoute allowedRoles={["WHMANAGER", "WHSTAFF"]}>
        <ViewStockMovePage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/inventory/physical-inventories",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN", "WHMANAGER", "WHSTAFF"]}>
        <PhysicalInventoryListPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/inventory/physical-inventories/:id",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN", "WHMANAGER", "WHSTAFF"]}>
        <PhysicalInventoryDetailPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/inventory/reports",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN", "WHMANAGER", "WHSTAFF"]}>
        <StockReportPage />
      </ProtectedRoute>
    ),
  },
];

export default inventoryRoutes;
