import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import FinanceDashboard from "../features/finance/FinanceDashboard";
import GlAccountPage from "../features/finance/page/GlAccountPage";

const financeRoutes: RouteObject[] = [
  {
    path: "/finance",
    element: (
      <ProtectedRoute allowedRoles={["CHACC", "ACCOUNT"]}>
        <FinanceDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/finance/accounts",
    element: (
      <ProtectedRoute allowedRoles={["CHACC", "ACCOUNT"]}>
        <GlAccountPage />
      </ProtectedRoute>
    ),
  },
  // sau này bạn thêm:
  // {
  //   path: "/finance/journals",
  //   element: (
  //     <ProtectedRoute allowedRoles={["CHACC", "ACCOUNT"]}>
  //       <GlJournalPage />
  //     </ProtectedRoute>
  //   ),
  // },
];

export default financeRoutes;
