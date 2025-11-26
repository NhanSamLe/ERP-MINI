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
import Layout from "../components/layout/Layout";
import MainPage from "../pages/MainPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";

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
];
const routes = [
  ...authRoutes,
  {
    path: "/",
    element: <MainPage />,
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
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
