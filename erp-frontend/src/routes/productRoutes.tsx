import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import ProductDashboard from "../features/products/ProductDashboard";

const productRoutes: RouteObject[] = [
  {
    path: "/products",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN", "SALESMANAGER"]}>
        <ProductDashboard />
      </ProtectedRoute>
    ),
  },
];

export default productRoutes;
