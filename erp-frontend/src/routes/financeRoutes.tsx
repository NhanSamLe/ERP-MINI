import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import FinanceDashboard from "../features/finance/FinanceDashboard";
import GlAccountPage from "../features/finance/page/GlAccountPage";
import GlJournalPage from "../features/finance/page/GlJournalPage";
import GlEntryListPage from "../features/finance/page/GlEntryListPage";
import GlEntryDetailPage from "../features/finance/page/GlEntryDetailPage";

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
  {
    path: "/finance/journals",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN", "CHACC", "ACCOUNT"]}>
        <GlJournalPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/finance/journals/:journalId/entries",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN", "CHACC", "ACCOUNT"]}>
        <GlEntryListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/finance/entries/:entryId",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN", "CHACC", "ACCOUNT"]}>
        <GlEntryDetailPage />
      </ProtectedRoute>
    ),
  },
];

export default financeRoutes;
