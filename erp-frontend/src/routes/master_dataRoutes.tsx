import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import MasterDataDashboard from "../features/master-data/MasterDataDashboard";
import CurrencyPage from "../features/master-data/page/CurrencyPage";
import ExchangeRatePage from "../features/master-data/page/ExchangeRatePage";
import UomConversionPage from "../features/master-data/page/UomConversionPage";
import TaxPage from "../features/master-data/page/TaxPage";
import UomPage from "../features/master-data/page/UomPage";
const masterDataRoutes: RouteObject[] = [
  {
    path: "/master-data",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <MasterDataDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/master-data/currencies",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <CurrencyPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/master-data/exchange-rates",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <ExchangeRatePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/master-data/uom-conversions",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <UomConversionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/master-data/taxes",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <TaxPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/master-data/uoms",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <UomPage />
      </ProtectedRoute>
    ),
  },
];

export default masterDataRoutes;
