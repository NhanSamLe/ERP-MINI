import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import ProductDashboard from "../features/products/ProductDashboard";
import ProductsPage from "../features/products/pages/ProductsPage";
import CreateProductPage from "../features/products/pages/CreateProductPage";
import EditProductPage from "../features/products/pages/EditProductPage";
const productRoutes: RouteObject[] = [
  {
    path: "/products",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN", "PURCHASE"]}>
        <ProductDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "inventory/products",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN", "PURCHASE"]}>
        <ProductsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "inventory/products/create",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN", "SALESMANAGER"]}>
        <CreateProductPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "inventory/products/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN", "SALESMANAGER"]}>
        <EditProductPage />
      </ProtectedRoute>
    ),
  },
];

export default productRoutes;
