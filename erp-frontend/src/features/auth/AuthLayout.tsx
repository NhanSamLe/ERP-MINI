import { useState, useEffect } from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const BANNERS = [
  "/assets/banner1.png",
  "/assets/banner2.png",
  "/assets/banner3.png",
  "/assets/banner4.png",
];

export default function AuthLayout({ children }: AuthLayoutProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((p) => (p + 1) % BANNERS.length), 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Full-screen sliding banner background */}
      {BANNERS.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className={[
            "absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out",
            i === index
              ? "opacity-100 scale-100"
              : "opacity-0 scale-105",
          ].join(" ")}
        />
      ))}

      {/* Subtle dark overlay so text stays readable */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Dot indicators bottom-center */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={[
              "h-2 rounded-full transition-all duration-300",
              i === index ? "bg-orange-500 w-6" : "bg-white/50 hover:bg-white w-2",
            ].join(" ")}
          />
        ))}
      </div>

      {/* Frosted glass form card — centered on top of banner */}
      <div className="relative z-10 w-full max-w-[420px] mx-4">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl px-8 py-8">
          {/* Logo */}
          <div className="mb-7">
            <img
              src="/assets/banner-lgoo.png"
              alt="ERP Mini"
              className="h-11 w-auto object-contain"
            />
          </div>

          {/* Form content — labels/inputs need white text override */}
          <div className="auth-glass-form">
            {children}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-white/60 mt-6">
            © 2025 ERP Mini. Đã đăng ký bản quyền.
          </p>
        </div>
      </div>
    </div>
  );
}
