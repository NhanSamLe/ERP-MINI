import authRoutes from "./authRoutes";
import salesRoutes from "./salesRoutes";
import hrmRoutes from "./hrmRoutes";
import financeRoutes from "./financeRoutes";
import inventoryRoutes from "./inventoryRoutes";
import purchaseRoutes from "./purchaseRoutes";
import companyRoutes from "./companyRoutes";
import crmRoutes from "./crmRoutes";
import masterDataRoutes from "./master_dataRoutes";
import productRoutes from "./productRoutes";
import categoryRoutes from "./categoryRoutes";
import userRoutes from "./userRoutes";
import partnerRoutes from "./partnerRoutes";
import aiNarrativeRoutes from "./aiNarrativeRoutes";
import blogRoutes from "./blogRoutes";
import Layout from "../components/layout/Layout";
import MainPage from "../pages/MainPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import KioskPage from "../features/hrm/page/KioskPage";
import PublicBlogListPage from "../features/blog/page/PublicBlogListPage";
import PublicBlogDetailPage from "../features/blog/page/PublicBlogDetailPage";
import LandingPage from "../features/landing/pages/LandingPage";
import RegisterPage from "../features/landing/pages/RegisterPage";
import OnboardingPage from "../features/onboarding/pages/OnboardingPage";
import ProtectedRoute from "../components/ProtectedRoute";
import PublicVerifySignaturePage from "../pages/PublicVerifySignaturePage";

// const routes = [
//   ...authRoutes,
//   ...salesRoutes,
//   ...hrmRoutes,
//   ...financeRoutes,
//   ...inventoryRoutes,
//   ...purchaseRoutes,
//   ...companyRoutes,
//   ...crmRoutes,
//   ...masterDataRoutes,
//   ...productRoutes,
// ];
const appRoutes = [
  ...salesRoutes,
  ...hrmRoutes,
  ...financeRoutes,
  ...inventoryRoutes,
  ...purchaseRoutes,
  ...companyRoutes,
  ...crmRoutes,
  ...masterDataRoutes,
  ...productRoutes,
  ...userRoutes,
  ...partnerRoutes,
  ...aiNarrativeRoutes,
  ...blogRoutes,
];
const routes = [
  ...authRoutes,
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/home",
    element: <MainPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/onboarding",
    element: (
      <ProtectedRoute>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/public/blog",
    element: <PublicBlogListPage />,
  },
  {
    path: "/public/blog/:slug",
    element: <PublicBlogDetailPage />,
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
  },
  {
    path: "/kiosk",
    element: <KioskPage />,
  },
  {
    path: "/public/verify/:hash",
    element: <PublicVerifySignaturePage />,
  },
  {
    path: "/public/verify",
    element: <PublicVerifySignaturePage />,
  },
  {
    path: "/",
    element: <Layout />,
    children: appRoutes,
  },

  {
    path: "/",
    element: <Layout />,
    children: [...productRoutes],
  },

  {
    path: "/",
    element: <Layout />,
    children: [...categoryRoutes],
  },
];

export default routes;
