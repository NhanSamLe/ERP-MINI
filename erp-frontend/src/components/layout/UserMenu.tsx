import { LogOut, Settings, User, FileText } from "lucide-react";
import { useDispatch } from "react-redux";
import { clearAuth } from "../../features/auth/store";
import { useNavigate } from "react-router-dom";
import {logout} from   "../../features/auth/auth.service"
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
interface UserMenuProps {
  onClose: () => void;
}

export default function UserMenu({ onClose }: UserMenuProps) {
  const { user } = useSelector((state: RootState) => state.auth);
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
  <div className="absolute right-0 mt-3 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
    {/* User Info Section with Gradient */}
    <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 text-white">
      <div className="flex items-center gap-2">
        <div className="relative shrink-0">
          <img
            src={user?.avatar_url}
            alt={user?.username}
            className="w-8 h-8 rounded-full border border-white shadow"
          />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border border-white rounded-full"></div>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-xs">{user?.full_name}</p>
          <p className="text-[11px] text-orange-100">{user?.role.name}</p>
          <p className="text-[10px] text-orange-100">{user?.email}</p>
        </div>
      </div>
    </div>

    {/* Menu Items */}
    <div className="p-1">
      <li className="list-none">
        <button  onClick={() => navigate("/profile")}className="w-full px-2 py-1.5 flex items-center gap-2 hover:bg-gray-50 rounded-md transition-colors group text-left">
          <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-md group-hover:bg-orange-100 transition-colors">
            <User className="w-3.5 h-3.5 text-gray-600 group-hover:text-orange-600 transition-colors" />
          </div>
          <span className="text-xs text-gray-700">My Profile</span>
        </button>
      </li>

      <li className="list-none">
        <button className="w-full px-2 py-1.5 flex items-center gap-2 hover:bg-gray-50 rounded-md transition-colors group text-left">
          <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-md group-hover:bg-orange-100 transition-colors">
            <FileText className="w-3.5 h-3.5 text-gray-600 group-hover:text-orange-600 transition-colors" />
          </div>
          <span className="text-xs text-gray-700">Reports</span>
        </button>
      </li>

      <li className="list-none">
        <button className="w-full px-2 py-1.5 flex items-center gap-2 hover:bg-gray-50 rounded-md transition-colors group text-left">
          <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-md group-hover:bg-orange-100 transition-colors">
            <Settings className="w-3.5 h-3.5 text-gray-600 group-hover:text-orange-600 transition-colors" />
          </div>
          <span className="text-xs text-gray-700">Settings</span>
        </button>
      </li>
    </div>

    {/* Divider */}
    <div className="border-t border-gray-200 my-1"></div>

    {/* Logout Button */}
    <div className="p-1 pb-2">
      <div
        onClick={handleLogout}
        className="w-full px-2 py-1.5 flex items-center gap-2 hover:bg-red-50 rounded-md transition-colors group cursor-pointer"
      >
        <div className="w-6 h-6 flex items-center justify-center bg-red-50 rounded-md group-hover:bg-red-100 transition-colors">
          <LogOut className="w-3.5 h-3.5 text-red-600" />
        </div>
        <span className="text-xs font-semibold text-red-600">Logout</span>
      </div>
    </div>
  </div>
);
}