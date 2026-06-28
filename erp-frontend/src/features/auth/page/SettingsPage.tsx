import { useState } from "react";
import { Globe, Palette, Bell, Sun, Moon, Save, Volume2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { toast } from "react-toastify";
import { useTheme } from "../../../contexts/ThemeContext";

export default function SettingsPage() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"general" | "appearance" | "notifications">("general");

  // General settings state
  const [language, setLanguage] = useState(() => localStorage.getItem("erp_lang") || "vi");
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  // Appearance settings state
  const darkMode = resolvedTheme === "dark";

  // Notifications state
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifySound, setNotifySound] = useState(false);

  const handleSaveGeneral = () => {
    localStorage.setItem("erp_lang", language);
    toast.success("Đã lưu cấu hình chung thành công!");
  };

  const handleSaveAppearance = () => {
    toast.success("Đã áp dụng cấu hình giao diện!");
  };

  const handleSaveNotifications = () => {
    toast.success("Đã lưu thiết lập thông báo!");
  };

  return (
    <div className="page-container max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Palette className="w-5 h-5 text-orange-500" />
          Cấu hình hệ thống (Settings)
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Thiết lập ngôn ngữ, giao diện người dùng và tuỳ chọn thông báo cho tài khoản của bạn.
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Left Side Tab Navigation */}
        <div className="w-full md:w-64 bg-gray-50/50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("general")}
            className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-all text-left ${
              activeTab === "general"
                ? "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <Globe className="w-4 h-4" />
            Cấu hình chung
          </button>
          
          <button
            onClick={() => setActiveTab("appearance")}
            className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-all text-left ${
              activeTab === "appearance"
                ? "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <Palette className="w-4 h-4" />
            Giao diện (Appearance)
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-all text-left ${
              activeTab === "notifications"
                ? "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <Bell className="w-4 h-4" />
            Thông báo (Notifications)
          </button>
        </div>

        {/* Right Side Content Panel */}
        <div className="flex-1 p-6 md:p-8">
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Thiết lập chung</h3>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Ngôn ngữ hiển thị</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="vi">Tiếng Việt (Vietnamese)</option>
                      <option value="en">English (Mỹ/Anh)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Múi giờ</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Asia/Ho_Chi_Minh">GMT+7 (Asia/Ho_Chi_Minh)</option>
                      <option value="UTC">GMT+0 (UTC)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Định dạng ngày</label>
                    <select
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (28/06/2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (2026-06-28)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (06/28/2026)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <Button variant="primary" onClick={handleSaveGeneral} leftIcon={<Save className="w-4 h-4" />}>
                  Lưu thiết lập chung
                </Button>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Giao diện người dùng</h3>
                
                {/* Dark Mode toggle */}
                <div className="flex items-center justify-between py-3 border-b border-gray-150 dark:border-gray-700 max-w-lg">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Chế độ tối (Dark Mode)</h4>
                    <p className="text-xs text-gray-400">Giảm mỏi mắt trong môi trường thiếu sáng.</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      darkMode ? "bg-orange-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                        darkMode ? "translate-x-5" : "translate-x-0"
                      }`}
                    >
                      {darkMode ? <Moon className="w-3 h-3 text-orange-600" /> : <Sun className="w-3 h-3 text-gray-450" />}
                    </span>
                  </button>
                </div>

                {/* Accent Color selection */}
                <div className="flex items-center justify-between py-4 max-w-lg">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Màu chủ đạo (Brand Accent)</h4>
                    <p className="text-xs text-gray-400">Chọn tông màu điểm nhấn của hệ thống.</p>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className="h-7 w-7 rounded-full border-2 border-gray-900 bg-orange-500 shadow-sm dark:border-white"
                      title="Màu cam thương hiệu"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <Button variant="primary" onClick={handleSaveAppearance} leftIcon={<Save className="w-4 h-4" />}>
                  Lưu giao diện
                </Button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Nhận thông báo</h3>
                
                <div className="space-y-4 max-w-lg">
                  {/* Email notify */}
                  <div className="flex items-center justify-between py-2.5 border-b border-gray-150 dark:border-gray-700">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Thông báo qua Email</h4>
                      <p className="text-xs text-gray-400">Gửi mail báo cáo hàng ngày, tuần và tháng.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.checked)}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-400 accent-orange-500 cursor-pointer"
                    />
                  </div>

                  {/* Browser push notify */}
                  <div className="flex items-center justify-between py-2.5 border-b border-gray-150 dark:border-gray-700">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Thông báo đẩy (Push Notifications)</h4>
                      <p className="text-xs text-gray-400">Hiển thị thông báo nổi trên trình duyệt khi có hoạt động mới.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyPush}
                      onChange={(e) => setNotifyPush(e.target.checked)}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-400 accent-orange-500 cursor-pointer"
                    />
                  </div>

                  {/* Notification Sound */}
                  <div className="flex items-center justify-between py-2.5">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-250 flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-gray-400" />
                        Âm thanh cảnh báo
                      </h4>
                      <p className="text-xs text-gray-400">Phát âm thanh nhỏ khi có thông báo hệ thống mới.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifySound}
                      onChange={(e) => setNotifySound(e.target.checked)}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-400 accent-orange-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <Button variant="primary" onClick={handleSaveNotifications} leftIcon={<Save className="w-4 h-4" />}>
                  Lưu cấu hình thông báo
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
