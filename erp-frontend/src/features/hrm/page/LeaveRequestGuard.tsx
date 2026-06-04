import React from "react";
import { useAppSelector } from "../../../store/hooks";
import { RootState } from "../../../store/store";
import LeaveRequestPage from "./LeaveRequestPage";
import MyLeaveRequestPage from "./MyLeaveRequestPage";

const LeaveRequestGuard: React.FC = () => {
  const authState = useAppSelector((s: RootState) => s.auth);

  const roleCode =
    (authState as any)?.user?.role?.code ||
    (authState as any)?.user?.role_code;

  if (!roleCode) {
    return null;
  }

  const isManagerOrHR = ["HR_STAFF", "HRMANAGER", "ADMIN", "CEO"].includes(roleCode);

  if (isManagerOrHR) {
    return <LeaveRequestPage />;
  }

  return <MyLeaveRequestPage />;
};

export default LeaveRequestGuard;
