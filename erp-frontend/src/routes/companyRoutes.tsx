import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import CompanyDashboard from "../features/company/CompanyDashboard";

const companyRoutes: RouteObject[] = [
  {
    path: "/company",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <CompanyDashboard />
      </ProtectedRoute>
    ),
  },
];

export default companyRoutes;
