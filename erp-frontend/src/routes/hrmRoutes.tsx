import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import DepartmentPage from "../features/hrm/page/DepartmentPage";
import PositionPage from "../features/hrm/page/PositionPage";
import OrganizationChartPage from "../features/hrm/page/OrganizationChartPage";
import EmployeePage from "../features/hrm/page/EmployeePage";
import MyAttendancePage from "../features/hrm/page/MyAttendancePage";
import AttendanceGuard from "../features/hrm/page/AttendanceGuard";
import UserFormPage from "../features/hrm/page/UserFormPage";
import PayrollPeriodPage from "../features/hrm/page/PayrollPeriodPage";
import PayrollItemPage from "../features/hrm/page/PayrollItemPage";
import PayrollRunPage from "../features/hrm/page/PayrollRunPage";
import LeaveRequestGuard from "../features/hrm/page/LeaveRequestGuard";
import PayrollMappingPage from "../features/hrm/page/PayrollMappingPage";
import CostCenterPage from "../features/hrm/page/CostCenterPage";
import PayrollConfigPage from "../features/hrm/page/PayrollConfigPage";
import HrmDashboard from "../features/hrm/page/HrmDashboard";

// Danh sách role khớp với components/layout/Sidebar.tsx (mục "Nhân sự & Lương")
const HRM_GROUP_ROLES = [
  "HRMANAGER",
  "HR_STAFF",
  "CEO",
  "BRANCH_MANAGER",
  "ACCOUNT",
  "CHACC",
  "SALES",
  "WHSTAFF",
  "PURCHASE",
];

const hrmRoutes: RouteObject[] = [
  {
    path: "/hrm",
    element: (
      <ProtectedRoute allowedRoles={HRM_GROUP_ROLES}>
        <HrmDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hrm/leave-requests",
    element: (
      <ProtectedRoute allowedRoles={HRM_GROUP_ROLES}>
        <LeaveRequestGuard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hrm/department",
    element: (
      <ProtectedRoute allowedRoles={["HRMANAGER", "HR_STAFF"]}>
        <DepartmentPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hrm/position",
    element: (
      <ProtectedRoute allowedRoles={["HRMANAGER", "HR_STAFF"]}>
        <PositionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hrm/organization/:branchId", // 👈 lấy branchId từ URL
    element: (
      <ProtectedRoute allowedRoles={["CEO", "BRANCH_MANAGER"]}>
        <OrganizationChartPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hrm/employees",
    element: (
      <ProtectedRoute allowedRoles={["HRMANAGER", "HR_STAFF"]}>
        <EmployeePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hrm/attendance",
    element: (
      <ProtectedRoute allowedRoles={HRM_GROUP_ROLES}>
        <AttendanceGuard />
      </ProtectedRoute>
    ),
  },
  // Optional: route riêng nếu muốn truy cập trực tiếp
  {
    path: "/hrm/my-attendance",
    element: (
      <ProtectedRoute allowedRoles={HRM_GROUP_ROLES}>
        <MyAttendancePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hrm/users/create",
    element: (
      <ProtectedRoute allowedRoles={["HRMANAGER", "HR_STAFF"]}>
        <UserFormPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hrm/payroll",
    element: (
      <ProtectedRoute allowedRoles={["HRMANAGER", "HR_STAFF"]}>
        <PayrollPeriodPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hrm/payroll-items",
    element: (
      <ProtectedRoute allowedRoles={["HRMANAGER", "HR_STAFF", "ACCOUNT", "CHACC"]}>
        <PayrollItemPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hrm/payroll-runs",
    element: (
      <ProtectedRoute allowedRoles={["HRMANAGER", "HR_STAFF", "ACCOUNT", "CHACC", "CEO", "ADMIN"]}>
        <PayrollRunPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hrm/payroll-mappings",
    element: (
      <ProtectedRoute allowedRoles={["HRMANAGER", "HR_STAFF", "ACCOUNT", "CHACC", "CEO", "ADMIN"]}>
        <PayrollMappingPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hrm/cost-centers",
    element: (
      <ProtectedRoute allowedRoles={["HRMANAGER", "HR_STAFF", "ACCOUNT", "CHACC", "CEO", "ADMIN"]}>
        <CostCenterPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/hrm/payroll-configs",
    element: (
      <ProtectedRoute allowedRoles={["HRMANAGER", "HR_STAFF", "CHACC", "ADMIN"]}>
        <PayrollConfigPage />
      </ProtectedRoute>
    ),
  },
];

export default hrmRoutes;
