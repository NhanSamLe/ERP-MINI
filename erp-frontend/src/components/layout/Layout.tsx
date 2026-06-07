import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import FloatingChatButton from "../../features/ai-chatbot/components/FloatingChatButton";
import LocalFloatingChatButton from "../../features/ai-local-rag/components/LocalFloatingChatButton";

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50/80 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      {/* Floating chat buttons — bottom-left to avoid overlapping pagination */}
      <div className="fixed bottom-6 left-[272px] flex gap-3 z-40">
        <LocalFloatingChatButton />
        <FloatingChatButton />
      </div>
    </div>
  );
}
