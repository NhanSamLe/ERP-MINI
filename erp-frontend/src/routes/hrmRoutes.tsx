import { RouteObject } from "react-router-dom";
import DepartmentPage from "../features/hrm/page/DepartmentPage";
import PositionPage from "../features/hrm/page/PositionPage";
import OrganizationChartPage from "../features/hrm/page/OrganizationChartPage";

const hrmRoutes: RouteObject[] = [
  {
    path: "/hrm/department",
    element: <DepartmentPage />,
  },
  {
    path: "/hrm/position",
    element: <PositionPage />,
  },
  {
    path: "/hrm/organization/:branchId", // 👈 lấy branchId từ URL
    element: <OrganizationChartPage />,
  },
  // ví dụ sau này:
  // { path: "/hrm/position", element: <PositionPage /> },
  // { path: "/hrm/employees", element: <EmployeePage /> },
];

export default hrmRoutes;
