import { LogOut, Settings } from "lucide-react";
import { useDispatch } from "react-redux";
import { clearAuth } from "../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import {logout} from   "../../features/auth/auth.service"
interface UserMenuProps {
  onClose: () => void;
}

export default function UserMenu({ onClose }: UserMenuProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout  = async () => {
    try {
      await logout(); 
    } catch (err) {
      console.error("Logout failed", err);
    }
    dispatch(clearAuth());
    navigate("/login", { state: { message: "Bạn đã đăng xuất thành công" } });
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      <div className="p-4 border-b">
        <p className="font-semibold">John Smilga</p>
        <p className="text-sm text-gray-500">Admin</p>
      </div>
      <ul className="p-2">
        <li className="px-3 py-2 hover:bg-gray-50 cursor-pointer">My Profile</li>
        <li className="px-3 py-2 hover:bg-gray-50 cursor-pointer">Reports</li>
        <li className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2">
          <Settings className="w-4 h-4" /> Settings
        </li>
      </ul>
      <div
        onClick={handleLogout}
        className="px-3 py-2 text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </div>
    </div>
  );
}
