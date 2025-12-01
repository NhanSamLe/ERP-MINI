import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import ProductDashboard from "../features/products/ProductDashboard";
import ProductsPage from "../features/products/pages/ProductsPage";
import CreateProductPage from "../features/products/pages/CreateProductPage";
import EditProductPage from "../features/products/pages/EditProductPage";
import { Roles } from "@/types/enum";
const productRoutes: RouteObject[] = [
  {
    path: "/products",
    element: (
      <ProtectedRoute allowedRoles={[Roles.ADMIN, Roles.PURCHASE]}>
        <ProductDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "inventory/products",
    element: (
      <ProtectedRoute allowedRoles={[Roles.ADMIN, Roles.PURCHASE]}>
        <ProductsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "inventory/products/create",
    element: (
      <ProtectedRoute allowedRoles={[Roles.ADMIN, Roles.SALESMANAGER]}>
        <CreateProductPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "inventory/products/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[Roles.ADMIN, Roles.SALESMANAGER]}>
        <EditProductPage />
      </ProtectedRoute>
    ),
  },
];

export default productRoutes;
