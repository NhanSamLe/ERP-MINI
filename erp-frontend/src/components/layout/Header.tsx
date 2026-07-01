import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import UserMenu from "./UserMenu";
import NotificationBell from "../notifications/NotificationBell";
import { Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const avatar_url = useSelector((state: RootState) => state.auth.user?.avatar_url);
  const user       = useSelector((state: RootState) => state.auth.user);
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="h-[3.75rem] bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-3 sm:px-5 flex items-center justify-between shrink-0 z-30">
      {/* Left — Logo */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 -ml-1 flex items-center justify-center rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <img
          src="/assets/logo.png"
          alt="ERP Mini"
          className="h-7 w-7 object-contain"
        />
        <div className="shrink-0">
          <span className="text-base font-bold text-gray-900 dark:text-white leading-none">ERP</span>
          <span className="text-base font-bold text-orange-500 leading-none"> Mini</span>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        <NotificationBell />

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200" />

        {/* User */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpenMenu((v) => !v)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            {avatar_url ? (
              <img
                src={avatar_url}
                alt="User"
                className="w-7 h-7 rounded-full ring-2 ring-orange-200 object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-orange-200">
                {user?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-gray-800 dark:text-slate-100 leading-none">{user?.full_name || user?.username}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-none">{user?.role?.name}</p>
            </div>
          </button>

          {openMenu && <UserMenu onClose={() => setOpenMenu(false)} />}
        </div>
      </div>
    </header>
  );
}
