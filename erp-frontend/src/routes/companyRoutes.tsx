// src/routes/companyRoutes.tsx
import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import CompanyDashboard from "../features/company/CompanyDashboard";

const BranchList = lazy(() => import("../features/company/pages/BranchList"));
const BranchForm = lazy(() => import("../features/company/pages/BranchForm"));

const companyRoutes: RouteObject[] = [
  {
    path: "/company",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <CompanyDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/company/branches",
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute allowedRoles={["ADMIN", "CEO"]}>
            <BranchList />
          </ProtectedRoute>
        ),
      }, // /company/branches
      {
        path: "create",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN", "CEO"]}>
            <BranchForm mode="create" />
          </ProtectedRoute>
        ),
      }, // /company/branches/create
      {
        path: ":id",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN", "CEO"]}>
            <BranchForm mode="edit" />
          </ProtectedRoute>
        ),
      }, // /company/branches/:id
    ],
  },
];

export default companyRoutes;
