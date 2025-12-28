import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import WarehousePages from "../features/inventory/pages/WarehousePages";

const warehouseRoutes: RouteObject[] = [
  {
    path: "/inventory/warehouses",
    element: (
      <ProtectedRoute>
        <WarehousePages />
      </ProtectedRoute>
    ),
  },
];

export default warehouseRoutes;
