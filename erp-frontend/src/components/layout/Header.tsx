import { Bell, Mail, Settings, ChevronDown, Maximize2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import UserMenu from "./UserMenu";

export default function Header() {
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

      {/* Center - Search Bar */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative">
          <input
            type="text"
            placeholder="⌘ Search Bar"
            className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
          <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-3">
        {/* Store Selector */}
        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Freshmart
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Add New Button */}
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
          <span>+</span>
          Add New
        </button>


        {/* Language */}
        <button className="p-2 hover:bg-gray-50 rounded-lg">
          🇺🇸
        </button>

        {/* Fullscreen */}
        <button className="p-2 hover:bg-gray-50 rounded-lg">
          <Maximize2 className="w-5 h-5 text-gray-600" />
        </button>

        {/* Mail with Badge */}
        <button className="relative p-2 hover:bg-gray-50 rounded-lg">
          <Mail className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Notifications */}
        <button className="p-2 hover:bg-gray-50 rounded-lg">
          <Bell className="w-5 h-5 text-gray-600" />
        </button>

        {/* Settings */}
        <button className="p-2 hover:bg-gray-50 rounded-lg">
          <Settings className="w-5 h-5 text-gray-600" />
        </button>

        {/* User Avatar */}
        <div className="ml-2 relative" ref={menuRef}>
          <img
            src="https://ui-avatars.com/api/?name=Admin&background=f97316&color=fff"
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