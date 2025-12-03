import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import CategoriesPage from "../features/categories/pages/CategoriesPage";
import { Roles } from "@/types/enum";
const productRoutes: RouteObject[] = [
  {
    path: "inventory/categories",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN", Roles.WHSTAFF, Roles.WHMANAGER]}>
        <CategoriesPage />
      </ProtectedRoute>
    ),
  },
];
export default productRoutes;
