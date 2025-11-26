import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

// Lazy load pages
const PartnerList = lazy(
  () => import("../features/partner/pages/PartnerList")
);
const PartnerForm = lazy(
  () => import("../features/partner/pages/PartnerForm")
);

const partnerRoutes: RouteObject[] = [
  // Nếu sau này bạn có PartnerDashboard riêng thì có thể thêm route ở đây
  // {
  //   path: "/partners",
  //   element: (
  //     <ProtectedRoute allowedRoles={["ADMIN"]}>
  //       <PartnerDashboard />
  //     </ProtectedRoute>
  //   ),
  // },

  {
    path: "/partners",
    children: [
      {
        index: true, // /partners
        element: (
          <ProtectedRoute allowedRoles={["ADMIN", "SALES", "PURCHASE"]}>
            <PartnerList />
          </ProtectedRoute>
        ),
      },
      {
        path: "create", // /partners/create
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <PartnerForm />
          </ProtectedRoute>
        ),
      },
      {
        path: ":id", // /partners/:id
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <PartnerForm />
          </ProtectedRoute>
        ),
      },
    ],
  },
];

export default partnerRoutes;
