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
import userRoutes from "./userRoutes";
import Layout from "../components/layout/Layout";
import MainPage from "../pages/MainPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import ProductsPage from "../features/products/pages/ProductsPage";
import CreateProductPage from "../features/products/pages/CreateProductPage";
import EditProductPage from "../features/products/pages/EditProductPage";
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
  ...companyRoutes,
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
    children: [
      ...productRoutes,
      {
        path: "inventory/products",
        element: <ProductsPage />,
      },
      {
        path: "inventory/products/create",
        element: <CreateProductPage />,
      },

      {
        path: "inventory/products/edit",
        element: <EditProductPage />,
      },
    ],
  },
];

export default routes;
