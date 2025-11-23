import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import CategoriesPage from "../features/categories/pages/CategoriesPage";
const productRoutes: RouteObject[] = [
  {
    path: "inventory/categories",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN", "SALESMANAGER"]}>
        <CategoriesPage />
      </ProtectedRoute>
    ),
  },
];
export default productRoutes;
