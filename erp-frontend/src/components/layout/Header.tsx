import { useState, useEffect, useRef } from "react";
import UserMenu from "./UserMenu";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import NotificationBell from "../notifications/NotificationBell";

export default function Header() {
  const avatar_url = useSelector((state: RootState) => state.auth.user?.avatar_url);
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      {/* Left - Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white rounded-full"></div>
          </div>
          <span className="text-xl font-bold text-gray-800">ERP UTE</span>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-3">

        {/* Notifications */}
        <NotificationBell />

        {/* User Avatar */}
        <div className="ml-2 relative" ref={menuRef}>
          <img
            src={avatar_url}
            alt="User"
            className="w-9 h-9 rounded-full cursor-pointer ring-2 ring-gray-200"
            onClick={() => setOpenMenu(!openMenu)}
          />
          {openMenu && <UserMenu onClose={() => setOpenMenu(false)} />}
        </div>
      </div>
    </header>
  );
}
