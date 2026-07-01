import { LogOut, Settings, User, FileText } from "lucide-react";
import { useDispatch } from "react-redux";
import { clearAuth } from "../../features/auth/store";
import { useNavigate } from "react-router-dom";
import { logout } from "../../features/auth/auth.service";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { toast } from "react-toastify";

interface UserMenuProps {
  onClose: () => void;
}

export default function UserMenu({ onClose }: UserMenuProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout(); 
    } catch (err) {
      console.error("Logout failed", err);
    }
    dispatch(clearAuth());
    toast.success("Bạn đã đăng xuất thành công");
    navigate("/login");
    onClose();
  };

  return (
    <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
      {/* User Info Section with Gradient */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 text-white">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <img
              src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name}&background=fff&color=f97316&size=100`}
              alt={user?.username}
              className="w-9 h-9 rounded-full border-2 border-white/50 shadow-sm"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-xs truncate">{user?.full_name}</p>
            <p className="text-[10px] text-orange-100 truncate">{user?.role?.name}</p>
            <p className="text-[9px] text-orange-150 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-1.5 space-y-0.5">
        <button
          onClick={() => { navigate("/profile"); onClose(); }}
          className="w-full px-2 py-1.5 flex items-center gap-2 hover:bg-gray-50 rounded-lg transition-colors group text-left"
        >
          <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-md group-hover:bg-orange-50 transition-colors shrink-0">
            <User className="w-3.5 h-3.5 text-gray-500 group-hover:text-orange-500 transition-colors" />
          </div>
          <span className="text-xs font-medium text-gray-700">Hồ sơ cá nhân</span>
        </button>

        <button
          onClick={() => { navigate("/reports"); onClose(); }}
          className="w-full px-2 py-1.5 flex items-center gap-2 hover:bg-gray-50 rounded-lg transition-colors group text-left"
        >
          <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-md group-hover:bg-orange-50 transition-colors shrink-0">
            <FileText className="w-3.5 h-3.5 text-gray-500 group-hover:text-orange-500 transition-colors" />
          </div>
          <span className="text-xs font-medium text-gray-700">Trung tâm báo cáo</span>
        </button>

        <button
          onClick={() => { navigate("/settings"); onClose(); }}
          className="w-full px-2 py-1.5 flex items-center gap-2 hover:bg-gray-50 rounded-lg transition-colors group text-left"
        >
          <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-md group-hover:bg-orange-50 transition-colors shrink-0">
            <Settings className="w-3.5 h-3.5 text-gray-500 group-hover:text-orange-500 transition-colors" />
          </div>
          <span className="text-xs font-medium text-gray-700">Cài đặt hệ thống</span>
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 my-1"></div>

      {/* Logout Button */}
      <div className="p-1.5">
        <button
          onClick={handleLogout}
          className="w-full px-2 py-1.5 flex items-center gap-2 hover:bg-red-50 rounded-lg transition-colors group text-left"
        >
          <div className="w-6 h-6 flex items-center justify-center bg-red-50 rounded-md group-hover:bg-red-100 transition-colors shrink-0">
            <LogOut className="w-3.5 h-3.5 text-red-500" />
          </div>
          <span className="text-xs font-semibold text-red-650">Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
