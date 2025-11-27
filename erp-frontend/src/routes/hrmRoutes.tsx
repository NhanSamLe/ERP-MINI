import { RouteObject } from "react-router-dom";
import DepartmentPage from "../features/hrm/page/DepartmentPage";
import PositionPage from "../features/hrm/page/PositionPage";

const hrmRoutes: RouteObject[] = [
  {
    path: "/hrm/department",
    element: <DepartmentPage />,
  },
  {
    path: "/hrm/position",
    element: <PositionPage />,
  },
  // ví dụ sau này:
  // { path: "/hrm/position", element: <PositionPage /> },
  // { path: "/hrm/employees", element: <EmployeePage /> },
];

export default hrmRoutes;
