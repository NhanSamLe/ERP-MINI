import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { RootState } from "../store/store";
import { ReactElement } from "react";

interface ProtectedRouteProps {
  children: ReactElement;
  allowedRoles?: string[]; 
}
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user , loading} = useSelector((state: RootState) => state.auth);
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        ); 
    }
  // Nếu chưa login → redirect về /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  // Nếu có allowedRoles mà user không nằm trong đó → redirect /unauthorized
  if (allowedRoles && user && !allowedRoles.includes(user.role.code)) {
    return <Navigate to="/unauthorized" replace />;
  }
  // Nếu hợp lệ → render children
  return children;
}