// AttendanceGuard.tsx
import React from "react";
import { useAppSelector } from "../../../store/hooks";
import { RootState } from "../../../store/store";
import AttendancePage from "./AttendancePage";
import MyAttendancePage from "./MyAttendancePage";

const AttendanceGuard: React.FC = () => {
  const authState = useAppSelector((s: RootState) => s.auth);

  // tùy structure của bạn, chỉnh cho đúng
  const roleCode =
    (authState as any)?.user?.role?.code ||
    (authState as any)?.user?.role_code; // fallback nếu bạn lưu kiểu khác

  // chưa load xong user → có thể return null hoặc loader
  if (!roleCode) {
    return null;
  }

  if (roleCode === "HR_STAFF") {
    // ✅ chỉ HR_STAFF mới thấy màn quản lý chấm công
    return <AttendancePage />;
  }

  // ❗ các role khác (EMPLOYEE, BRANCH_MANAGER, CEO, ...) chỉ xem chấm công cá nhân
  return <MyAttendancePage />;
};

export default AttendanceGuard;
