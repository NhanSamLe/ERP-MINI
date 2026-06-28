import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Calculator,
  Users,
  BarChart3,
  CheckCircle,
  Menu,
  X,
  ArrowRight,
  Zap,
  Building2,
  Clock,
  HeadphonesIcon,
} from 'lucide-react';

const HERO_BANNERS = [
  "/assets/banner1.png",
  "/assets/banner2.png",
  "/assets/banner3.png",
  "/assets/banner4.png",
];

const features = [
  {
    icon: ShoppingCart,
    title: 'Bán hàng & CRM',
    description: 'Quản lý đơn hàng, báo giá, công nợ khách hàng và toàn bộ pipeline bán hàng',
  },
  {
    icon: Package,
    title: 'Kho & Kiểm kê',
    description: 'Theo dõi tồn kho realtime, quản lý lô hàng, xuất nhập kho tự động',
  },
  {
    icon: TrendingUp,
    title: 'Mua hàng',
    description: 'Tự động hóa quy trình mua hàng từ RFQ đến thanh toán nhà cung cấp',
  },
  {
    icon: Calculator,
    title: 'Kế toán',
    description: 'Hạch toán tự động theo VAS, báo cáo tài chính chuẩn Bộ Tài Chính',
  },
  {
    icon: Users,
    title: 'Nhân sự & Lương',
    description: 'Chấm công, tính lương tự động, quản lý phép năm và BHXH',
  },
  {
    icon: BarChart3,
    title: 'Báo cáo & AI',
    description: 'Dashboard realtime, phân tích dự báo với AI, xuất báo cáo đa dạng',
  },
];

const steps = [
  { number: '01', title: 'Đăng ký', description: 'Điền thông tin công ty, nhận tài khoản trong 2 phút' },
  { number: '02', title: 'Cấu hình', description: 'Wizard hướng dẫn thiết lập hệ thống phù hợp doanh nghiệp' },
  { number: '03', title: 'Vận hành', description: 'Bắt đầu quản lý toàn bộ hoạt động từ một nơi' },
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '499K',
    period: '/tháng',
    popular: false,
    features: ['1 chi nhánh', '5 người dùng', 'Bán hàng + Kho', 'Kế toán cơ bản', 'Hỗ trợ email'],
  },
  {
    name: 'Professional',
    price: '1.299K',
    period: '/tháng',
    popular: true,
    features: ['3 chi nhánh', '20 người dùng', 'Đầy đủ tính năng', 'HRM + CRM', 'Hỗ trợ 24/7', 'API access'],
  },
  {
    name: 'Enterprise',
    price: 'Liên hệ',
    period: '',
    popular: false,
    features: ['Không giới hạn', 'Đầy đủ tính năng', 'AI Analytics', 'Tùy chỉnh hoàn toàn', 'SLA đảm bảo', 'Dedicated support'],
  },
];

const stats = [
  { icon: Building2, value: '500+', label: 'Doanh nghiệp' },
  { icon: Zap, value: '99.9%', label: 'Uptime' },
  { icon: HeadphonesIcon, value: '24/7', label: 'Hỗ trợ' },
  { icon: Clock, value: '30 ngày', label: 'Miễn phí' },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ctaEmail, setCtaEmail] = useState('');
  const [bannerIndex, setBannerIndex] = useState(0);
  const navigate = useNavigate();

  // Auto-slide banner
  useEffect(() => {
    const id = setInterval(() => setBannerIndex((p) => (p + 1) % HERO_BANNERS.length), 4000);
    return () => clearInterval(id);
  }, []);

  const prevBanner = () => setBannerIndex((p) => (p - 1 + HERO_BANNERS.length) % HERO_BANNERS.length);
  const nextBanner = () => setBannerIndex((p) => (p + 1) % HERO_BANNERS.length);

  const handleCtaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = ctaEmail ? `?email=${encodeURIComponent(ctaEmail)}` : '';
    navigate(`/register${params}`);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      
      {/* ─── Floating Glass Navbar ─── */}
      <nav className="fixed top-6 left-6 right-6 max-w-7xl mx-auto bg-white/75 dark:bg-slate-900/75 backdrop-blur-lg border border-slate-200/50 dark:border-slate-800/50 rounded-full z-50 shadow-[0_8px_30px_rgba(0,0,0,0.03)] px-8 py-3.5 flex justify-between items-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 select-none hover:opacity-90 transition-opacity">
          <img src="/assets/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
          <span className="text-xl font-bold tracking-tight">
            <span className="text-slate-900 dark:text-white">ERP</span>
            <span className="text-orange-500"> Mini</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-orange-500 transition-colors">
            Tính năng
          </a>
          <a href="#pricing" className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-orange-500 transition-colors">
            Giá cả
          </a>
          <a href="/public/blog" className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-orange-500 transition-colors">
            Blog
          </a>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>
          <Link to="/login" className="text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-orange-500 transition-colors dark:text-slate-300">
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-full text-white transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] shadow-md shadow-orange-500/10"
          >
            Dùng thử miễn phí
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 rounded-full text-slate-600 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 mt-2">
            <a href="#features" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-orange-500" onClick={() => setMobileMenuOpen(false)}>
              Tính năng
            </a>
            <a href="#pricing" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-orange-500" onClick={() => setMobileMenuOpen(false)}>
              Giá cả
            </a>
            <a href="/public/blog" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-orange-500">
              Blog
            </a>
            <hr className="border-slate-100 dark:border-slate-800" />
            <Link to="/login" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-orange-500">
              Đăng nhập
            </Link>
            <Link to="/register" className="block text-center bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-3 rounded-full shadow-md shadow-orange-500/10">
              Dùng thử miễn phí
            </Link>
          </div>
        )}
      </nav>

      {/* ─── Hero Section with Asymmetric Grid ─── */}
      <section className="pt-32 pb-20 px-6 lg:px-12 bg-gradient-to-b from-orange-50/20 via-white to-white dark:from-slate-900/20 dark:via-slate-950 dark:to-slate-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Block */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold bg-orange-500/10 text-orange-600 border border-orange-500/20">
              Hệ thống ERP Tinh Gọn
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-800 dark:text-white leading-[1.1]">
              Quản trị toàn diện <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">doanh nghiệp bạn</span>
            </h1>
            <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-[45ch]">
              Một nền tảng tích hợp bán hàng, kho vận, kế toán và nhân sự phục vụ chuyển đổi số doanh nghiệp Việt.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-6 py-3.5 rounded-full shadow-lg shadow-orange-500/10 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              >
                Dùng thử miễn phí 30 ngày
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-800 hover:border-orange-500 text-slate-600 dark:text-slate-300 hover:text-orange-600 text-sm font-semibold px-6 py-3.5 rounded-full hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] bg-white dark:bg-slate-900"
              >
                Tìm hiểu thêm
              </a>
            </div>
          </div>

          {/* Right Showcase Image Block (Double Bezel Slideshow) */}
          <div className="lg:col-span-7 bg-slate-900/[0.02] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06] p-2.5 rounded-[2.5rem] shadow-sm relative group">
            <div className="relative overflow-hidden rounded-[calc(2.5rem-0.625rem)] bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 shadow-2xl" style={{ aspectRatio: '16/10' }}>
              {HERO_BANNERS.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className={[
                    "absolute inset-0 w-full h-full object-fill transition-all duration-700 ease-in-out",
                    i === bannerIndex
                      ? "opacity-100 translate-x-0"
                      : i < bannerIndex
                        ? "opacity-0 -translate-x-full"
                        : "opacity-0 translate-x-full",
                  ].join(" ")}
                />
              ))}

              {/* Arrow controls */}
              <button
                onClick={prevBanner}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition-colors z-10 opacity-0 group-hover:opacity-100 duration-300"
              >
                <span className="text-gray-700 text-xs">◀</span>
              </button>
              <button
                onClick={nextBanner}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition-colors z-10 opacity-0 group-hover:opacity-100 duration-300"
              >
                <span className="text-gray-700 text-xs">▶</span>
              </button>

              {/* Dot indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {HERO_BANNERS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setBannerIndex(i)}
                    className={[
                      "h-1.5 rounded-full transition-all duration-300",
                      i === bannerIndex ? "bg-orange-500 w-4" : "bg-white/60 hover:bg-white w-1.5",
                    ].join(" ")}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="max-w-5xl mx-auto px-4 pt-20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-slate-900/[0.01] dark:bg-white/[0.01] ring-1 ring-slate-950/[0.03] dark:ring-white/[0.05] p-1.5 rounded-[2rem] shadow-sm hover:scale-[1.02] transition-transform duration-300"
                >
                  <div className="flex flex-col items-center gap-1 bg-white dark:bg-slate-900 rounded-[calc(2rem-0.375rem)] px-4 py-6 border border-slate-200/20 dark:border-slate-800/20 shadow-sm">
                    <Icon className="w-5 h-5 text-orange-500 mb-1" />
                    <span className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</span>
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{stat.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Trusted By Logo Wall ─── */}
      <section className="py-12 border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Được tin dùng bởi các doanh nghiệp</p>
          <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-6 opacity-60 dark:opacity-40 grayscale hover:opacity-85 dark:hover:opacity-70 transition-opacity duration-300">
            <span className="text-sm font-semibold tracking-[0.2em] text-slate-500 dark:text-slate-400">ACME CORP</span>
            <span className="text-sm font-semibold tracking-[0.2em] text-slate-500 dark:text-slate-400">GLOBEX</span>
            <span className="text-sm font-semibold tracking-[0.2em] text-slate-500 dark:text-slate-400">INITECH</span>
            <span className="text-sm font-semibold tracking-[0.2em] text-slate-500 dark:text-slate-400">UMBRELLA</span>
            <span className="text-sm font-semibold tracking-[0.2em] text-slate-500 dark:text-slate-400">Hooli</span>
          </div>
        </div>
      </section>

      {/* ─── Features (The Asymmetrical Bento Grid) ─── */}
      <section id="features" className="py-24 px-6 lg:px-12 bg-slate-50/30 dark:bg-slate-950/10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-800 dark:text-white">
              Tất cả những gì doanh nghiệp cần
            </h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm md:text-base">
              Một nền tảng tích hợp hoàn chỉnh — không cần chắp vá nhiều phần mềm rời rạc.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 1. Bán hàng & CRM (Col-span-2, vibrant orange gradient) */}
            <div className="md:col-span-2 bg-slate-900/[0.02] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06] p-2 rounded-[2.5rem] shadow-sm">
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-[calc(2.5rem-0.5rem)] p-8 border border-orange-500/10 shadow-lg flex flex-col justify-between min-h-[280px]">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-6">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div className="space-y-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-orange-100">Tính năng cốt lõi</span>
                  <h3 className="text-2xl font-bold">Bán hàng & CRM chuyên nghiệp</h3>
                  <p className="text-orange-50 text-sm max-w-[50ch] leading-relaxed">
                    Quản lý khách hàng tiềm năng, cơ hội kinh doanh, thiết lập báo giá tự động, theo dõi tiến độ công nợ và toàn bộ quy trình bán hàng khép kín.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Kho & Kiểm kê (Col-span-1, white bento tile) */}
            <div className="md:col-span-1 bg-slate-900/[0.02] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06] p-2 rounded-[2.5rem] shadow-sm">
              <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-[calc(2.5rem-0.5rem)] p-8 border border-slate-200/40 dark:border-slate-800/40 shadow-sm flex flex-col justify-between min-h-[280px] hover:border-orange-500/30 transition-colors duration-300">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6">
                  <Package className="w-6 h-6" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-bold">Quản lý Kho vận</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed">
                    Theo dõi lượng hàng tồn thực tế, quản lý quy trình nhập xuất kho tự động và chuyển kho liên chi nhánh nhanh chóng.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Mua hàng (Col-span-1, white bento tile) */}
            <div className="md:col-span-1 bg-slate-900/[0.02] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06] p-2 rounded-[2.5rem] shadow-sm">
              <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-[calc(2.5rem-0.5rem)] p-8 border border-slate-200/40 dark:border-slate-800/40 shadow-sm flex flex-col justify-between min-h-[280px] hover:border-orange-500/30 transition-colors duration-300">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-bold">Quy trình Mua hàng</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed">
                    Tự động hoá luồng mua hàng từ yêu cầu báo giá (RFQ), nhận hàng cho tới đối chiếu hóa đơn nhà cung cấp.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Kế toán & AI (Col-span-2, sleek dark bento tile) */}
            <div className="md:col-span-2 bg-slate-900/[0.02] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06] p-2 rounded-[2.5rem] shadow-sm">
              <div className="bg-slate-900 text-white rounded-[calc(2.5rem-0.5rem)] p-8 border border-slate-800 shadow-lg flex flex-col justify-between min-h-[280px]">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-orange-400 mb-6">
                  <Calculator className="w-6 h-6" />
                </div>
                <div className="space-y-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-400">Trí tuệ nhân tạo</span>
                  <h3 className="text-2xl font-bold">Kế toán tự động & AI Smart Report</h3>
                  <p className="text-slate-400 text-sm max-w-[50ch] leading-relaxed">
                    Hạch toán sổ cái tự động theo chuẩn mực VAS. Tích hợp AI thông minh phân tích sức khỏe tài chính và dự báo xu hướng doanh thu hàng tháng.
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Nhân sự & Lương (Col-span-1, white bento tile) */}
            <div className="md:col-span-1 bg-slate-900/[0.02] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06] p-2 rounded-[2.5rem] shadow-sm">
              <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-[calc(2.5rem-0.5rem)] p-8 border border-slate-200/40 dark:border-slate-800/40 shadow-sm flex flex-col justify-between min-h-[280px] hover:border-orange-500/30 transition-colors duration-300">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-bold">Nhân sự & Tính lương</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed">
                    Quản lý thông tin hồ sơ nhân sự, dữ liệu chấm công hàng ngày và lập bảng thanh toán lương tự động chuẩn xác.
                  </p>
                </div>
              </div>
            </div>

            {/* 6. Báo cáo quản trị (Col-span-1, white bento tile) */}
            <div className="md:col-span-1 bg-slate-900/[0.02] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06] p-2 rounded-[2.5rem] shadow-sm">
              <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-[calc(2.5rem-0.5rem)] p-8 border border-slate-200/40 dark:border-slate-800/40 shadow-sm flex flex-col justify-between min-h-[280px] hover:border-orange-500/30 transition-colors duration-300">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-bold">Báo cáo đa chiều</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed">
                    Tổng hợp trực quan hóa doanh thu, công nợ và lượng hàng tồn kho đa điểm giúp đưa ra quyết định kịp thời.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works (Staggered Steps) ─── */}
      <section className="py-24 px-6 lg:px-12 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center max-w-xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-800 dark:text-white">
              Bắt đầu chỉ trong 3 bước
            </h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm md:text-base">
              Đơn giản, nhanh chóng — hệ thống sẵn sàng chạy trong vài phút.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div key={step.number} className="relative text-center group">
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-slate-100 dark:bg-slate-800" />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 text-orange-500 text-xl font-bold mb-6 border border-orange-500/20 group-hover:scale-105 transition-transform duration-300">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{step.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed px-4">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing (Double Bezel Cards) ─── */}
      <section id="pricing" className="py-24 px-6 lg:px-12 bg-slate-50/30 dark:bg-slate-950/10 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-800 dark:text-white">Bảng giá linh hoạt</h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm md:text-base">
              Chọn gói phù hợp với quy mô doanh nghiệp — nâng cấp bất kỳ lúc nào.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={[
                  "bg-slate-900/[0.02] dark:bg-white/[0.01] ring-1 p-2 rounded-[2.5rem] shadow-sm",
                  plan.popular
                    ? "ring-orange-500/30 shadow-xl"
                    : "ring-slate-900/[0.04] dark:ring-white/[0.06]",
                ].join(" ")}
              >
                <div className={[
                  "rounded-[calc(2.5rem-0.5rem)] p-8 border shadow-sm relative flex flex-col justify-between min-h-[440px]",
                  plan.popular
                    ? "bg-slate-900 dark:bg-slate-900 text-white border-slate-800"
                    : "bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-200/40 dark:border-slate-800/40",
                ].join(" ")}>
                  {plan.popular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] uppercase tracking-[0.2em] font-semibold px-4 py-1.5 rounded-full shadow-md shadow-orange-500/20">
                      Phổ biến nhất
                    </span>
                  )}
                  
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <div>
                      <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                      {plan.period && <span className="text-slate-400 text-sm ml-1">{plan.period}</span>}
                    </div>
                    <ul className="space-y-3.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-500 dark:text-slate-300">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    to="/register"
                    className={[
                      "block text-center py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 text-center w-full mt-8",
                      plan.popular
                        ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/10 active:scale-[0.98]"
                        : "bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 dark:hover:text-orange-500 border border-slate-200/30 dark:border-slate-700/30 active:scale-[0.98]",
                    ].join(" ")}
                  >
                    {plan.price === "Liên hệ" ? "Liên hệ ngay" : "Bắt đầu ngay"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA with Radial Background ─── */}
      <section className="py-24 px-6 lg:px-8 bg-slate-900 text-white relative overflow-hidden border-t border-slate-850">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1)_0,transparent_100%)]"></div>
        <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Bắt đầu hành trình số hóa doanh nghiệp hôm nay
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-[50ch] mx-auto">
            Dùng thử miễn phí 30 ngày — không cần thẻ tín dụng, cài đặt trong 2 phút.
          </p>
          <form onSubmit={handleCtaSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2">
            <input
              type="email"
              value={ctaEmail}
              onChange={(e) => setCtaEmail(e.target.value)}
              placeholder="Email doanh nghiệp của bạn"
              className="flex-1 px-5 py-3 rounded-full text-sm text-slate-900 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-orange-500/50 placeholder-slate-400 shadow-lg"
            />
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold uppercase tracking-wider px-6 py-3 rounded-full transition-all duration-300 shadow-md shadow-orange-500/10 active:scale-[0.98]"
            >
              Đăng ký ngay
            </button>
          </form>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-6 lg:px-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <img src="/assets/logo.png" alt="Logo" className="h-7 w-7 object-contain" />
                <span className="text-lg font-bold tracking-tight text-white">
                  <span>ERP</span>
                  <span className="text-orange-500"> Mini</span>
                </span>
              </div>
              <p className="text-xs leading-relaxed max-w-[30ch]">
                Giải pháp quản lý doanh nghiệp toàn diện dành riêng cho doanh nghiệp Việt Nam.
              </p>
            </div>

            {/* Sản phẩm */}
            <div className="space-y-4">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Sản phẩm</h4>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#features" className="hover:text-orange-500 transition-colors">Tính năng</a></li>
                <li><a href="#pricing" className="hover:text-orange-500 transition-colors">Bảng giá</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Tích hợp</a></li>
              </ul>
            </div>

            {/* Công ty */}
            <div className="space-y-4">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Công ty</h4>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#" className="hover:text-orange-500 transition-colors">Về chúng tôi</a></li>
                <li><a href="/public/blog" className="hover:text-orange-500 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Tuyển dụng</a></li>
              </ul>
            </div>

            {/* Hỗ trợ */}
            <div className="space-y-4">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Hỗ trợ</h4>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#" className="hover:text-orange-500 transition-colors">Trợ giúp</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Liên hệ</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Điều khoản</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-8 text-[11px] text-center text-slate-600">
            © {new Date().getFullYear()} ERP Mini. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
