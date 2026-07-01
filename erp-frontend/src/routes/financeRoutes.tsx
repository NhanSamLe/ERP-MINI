import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import FinanceDashboard from "../features/finance/FinanceDashboard";
import GlAccountPage from "../features/finance/page/GlAccountPage";
import GlJournalPage from "../features/finance/page/GlJournalPage";
import GlEntryListPage from "../features/finance/page/GlEntryListPage";
import GlEntryDetailPage from "../features/finance/page/GlEntryDetailPage";
import FinanceReportsPage from "../features/finance/page/FinanceReportsPage";
import AccountMappingPage from "../features/finance/page/AccountMappingPage";

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
  {
    path: "/finance/reports",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN", "CHACC", "ACCOUNT", "CEO"]}>
        <FinanceReportsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/finance/mappings",
    element: (
      <ProtectedRoute allowedRoles={["CHACC", "ACCOUNT", "ADMIN"]}>
        <AccountMappingPage />
      </ProtectedRoute>
    ),
  },
];

export default financeRoutes;
