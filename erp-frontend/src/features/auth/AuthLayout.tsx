import { useState, useEffect } from "react";
import banner1 from "../../assets/images/banner4.jpg";
import banner2 from "../../assets/images/banner2.jpg";
import banner3 from "../../assets/images/banner3.jpg";
import banner4 from "../../assets/images/banner5.jpg";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const banners = [banner1, banner2, banner3, banner4];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Left — form panel */}
      <div className="w-full lg:w-[420px] xl:w-[480px] flex flex-col justify-center p-8 bg-white border-r border-gray-100">
        <div className="w-full max-w-sm mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h10" />
              </svg>
            </div>
            <div>
              <div className="text-base font-bold text-gray-900 leading-none">
                ERP <span className="text-orange-500">UTE</span>
              </div>
              <div className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">Enterprise Resource Planning</div>
            </div>
          </div>

          {/* Form content */}
          {children}

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8">
            © 2025 ERP UTE System. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right — image banner */}
      <div className="hidden lg:block flex-1 h-screen relative overflow-hidden">
        {banners.map((b, i) => (
          <img
            key={i}
            src={b}
            alt=""
            className={[
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000",
              i === index ? "opacity-100" : "opacity-0",
            ].join(" ")}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/30 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 max-w-md shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-white" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h10" />
                </svg>
              </div>
              <span className="text-white font-bold text-sm">ERP UTE System</span>
            </div>
            <p className="text-gray-200 text-sm leading-relaxed">
              Giải pháp quản lý doanh nghiệp toàn diện — tinh gọn, hiệu quả và thông minh.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
