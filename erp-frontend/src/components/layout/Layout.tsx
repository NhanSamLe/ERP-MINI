import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import FloatingChatButton from "../../features/ai-chatbot/components/FloatingChatButton";
import LocalFloatingChatButton from "../../features/ai-local-rag/components/LocalFloatingChatButton";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-gray-50/80 dark:bg-slate-950 text-gray-900 dark:text-slate-100 overflow-hidden">
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-gray-900/45"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative h-full w-[18rem] max-w-[calc(100vw-3rem)] bg-white dark:bg-slate-900 shadow-xl">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <FloatingChatButton />
    </div>
  );
}
