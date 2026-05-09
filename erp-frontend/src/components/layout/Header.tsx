import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import UserMenu from "./UserMenu";
import NotificationBell from "../notifications/NotificationBell";

export default function Header() {
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
    <header className="h-[3.75rem] bg-white border-b border-gray-200 px-5 flex items-center justify-between shrink-0 z-30">
      {/* Left — Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h10" />
          </svg>
        </div>
        <div>
          <span className="text-base font-bold text-gray-900 leading-none">ERP</span>
          <span className="text-base font-bold text-orange-500 leading-none"> UTE</span>
        </div>
        <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-600 ml-1">
          Enterprise
        </span>
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
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
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
              <p className="text-xs font-semibold text-gray-800 leading-none">{user?.full_name || user?.username}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-none">{user?.role?.name}</p>
            </div>
          </button>

          {openMenu && <UserMenu onClose={() => setOpenMenu(false)} />}
        </div>
      </div>
    </header>
  );
}
