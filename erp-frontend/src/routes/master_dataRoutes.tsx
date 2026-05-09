import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import MasterDataDashboard from "../features/master-data/MasterDataDashboard";
import CurrencyPage from "../features/master-data/page/CurrencyPage";
import CurrencyPageV2 from "../features/master-data/page/CurrencyPage.v2";
import ExchangeRatePage from "../features/master-data/page/ExchangeRatePage";
import UomConversionPage from "../features/master-data/page/UomConversionPage";
import TaxPage from "../features/master-data/page/TaxPage";
import TaxPageV2 from "../features/master-data/page/TaxPage.v2";
import UomPage from "../features/master-data/page/UomPage";
import UomPageV2 from "../features/master-data/page/UomPage.v2";
import { appConfig } from "../config/app-config";
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
        {appConfig.features.useV2Components.currency ? <CurrencyPageV2 /> : <CurrencyPage />}
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
        {appConfig.features.useV2Components.taxRate ? <TaxPageV2 /> : <TaxPage />}
      </ProtectedRoute>
    ),
  },
  {
    path: "/master-data/uoms",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        {appConfig.features.useV2Components.uom ? <UomPageV2 /> : <UomPage />}
      </ProtectedRoute>
    ),
  },
];

export default masterDataRoutes;
