import { RouteObject } from "react-router-dom";
import DepartmentPage from "../features/hrm/page/DepartmentPage";
import PositionPage from "../features/hrm/page/PositionPage";
import OrganizationChartPage from "../features/hrm/page/OrganizationChartPage";
import EmployeePage from "../features/hrm/page/EmployeePage";
import AttendancePage from "../features/hrm/page/AttendancePage";
import MyAttendancePage from "../features/hrm/page/MyAttendancePage";
import AttendanceGuard from "../features/hrm/page/AttendanceGuard";

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
  {
  path: "/hrm/employees",
  element: <EmployeePage />,
},
{
    path: "/hrm/attendance",
    element: <AttendanceGuard />,
  },
  // Optional: route riêng nếu muốn truy cập trực tiếp
  {
    path: "/hrm/my-attendance",
    element: <MyAttendancePage />,
  },
  // ví dụ sau này:
  // { path: "/hrm/position", element: <PositionPage /> },
  // { path: "/hrm/employees", element: <EmployeePage /> },
];

export default hrmRoutes;
