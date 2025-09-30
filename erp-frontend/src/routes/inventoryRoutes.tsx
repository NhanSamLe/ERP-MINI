import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import InventoryDashboard from "../features/inventory/InventoryDashboard";

const inventoryRoutes: RouteObject[] = [
  {
    path: "/inventory",
    element: (
      <ProtectedRoute allowedRoles={["WHMANAGER", "WHSTAFF"]}>
        <InventoryDashboard />
      </ProtectedRoute>
    ),
  },
];

export default inventoryRoutes;
