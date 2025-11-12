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
      { index: true, element: <BranchList /> }, // /company/branches
      { path: "create", element: <BranchForm mode="create" /> }, // /company/branches/create
      { path: ":id", element: <BranchForm mode="edit" /> }, // /company/branches/:id
    ],
  },
];

export default companyRoutes;
