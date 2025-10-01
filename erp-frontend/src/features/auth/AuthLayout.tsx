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
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-orange-400 rounded-full"></div>
              </div>
              <div>
                <span className="text-sm text-orange-400 font-medium">ERP</span>
                <div className="text-xl font-bold text-blue-900">System</div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          {children}

          {/* Copyright */}
          <p className="text-center text-sm text-gray-500 mt-8">
            Copyright © 2025 ERP-System
          </p>
        </div>
      </div>

      {/* Right side - Image Banner */}
      <div className="hidden lg:block lg:w-1/2 h-screen relative overflow-hidden rounded-l-3xl">
        <img
          src={banners[index]}
          alt="ERP SYSTEM"
          key={index}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-transparent"></div>
        <div className="absolute bottom-10 left-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-2xl max-w-md">
          <h2 className="text-white text-3xl font-bold drop-shadow-lg">
            ERP UTE System
          </h2>
          <p className="text-gray-200 text-sm mt-2">
            Giải pháp quản lý doanh nghiệp hiện đại – tinh gọn và thông minh
          </p>
        </div>
      </div>
    </div>
  );
}