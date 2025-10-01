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
import Layout from "../components/layout/Layout";
import MainPage from "../pages/MainPage";

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
];
const routes = [
  ...authRoutes,
  {
    path: "/",       
    element: <MainPage />
  },
  {
    path: "/",
    element: <Layout />,  
    children: appRoutes,
  },
];


export default routes;
