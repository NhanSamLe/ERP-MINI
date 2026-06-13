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
  ChevronLeft,
  ChevronRight,
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

  // Auto-slide banner to the right
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
    <div className="min-h-screen bg-white">

      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 select-none">
              <img src="/assets/logo.png" alt="" className="h-9 w-9 object-contain" />
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-gray-900">ERP</span>
                <span className="text-orange-500"> Mini</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">
                Tính năng
              </a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">
                Giá cả
              </a>
              <a href="/public/blog" className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">
                Blog
              </a>
              <Link to="/login" className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors">
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                Dùng thử miễn phí
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100 space-y-3">
              <a href="#features" className="block px-2 py-1.5 text-sm text-gray-600 hover:text-orange-500" onClick={() => setMobileMenuOpen(false)}>
                Tính năng
              </a>
              <a href="#pricing" className="block px-2 py-1.5 text-sm text-gray-600 hover:text-orange-500" onClick={() => setMobileMenuOpen(false)}>
                Giá cả
              </a>
              <a href="/public/blog" className="block px-2 py-1.5 text-sm text-gray-600 hover:text-orange-500">
                Blog
              </a>
              <Link to="/login" className="block px-2 py-1.5 text-sm text-orange-600 font-medium">
                Đăng nhập
              </Link>
              <Link to="/register" className="block text-center bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
                Dùng thử miễn phí
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ─── Hero Banner Slideshow ─── */}
      <section className="pt-16 relative overflow-hidden bg-[#FFF5EE]">
        {/* Banner slides — slide from right */}
        <div className="relative w-full" style={{ aspectRatio: '16/6' }}>
          {HERO_BANNERS.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className={[
                "absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out",
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
            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition-colors z-10"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={nextBanner}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition-colors z-10"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {HERO_BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => setBannerIndex(i)}
                className={[
                  "h-2 rounded-full transition-all duration-300",
                  i === bannerIndex ? "bg-orange-500 w-6" : "bg-white/70 hover:bg-white w-2",
                ].join(" ")}
              />
            ))}
          </div>
        </div>

        {/* Stats bar below banner */}
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex flex-col items-center gap-1 bg-white border border-gray-100 rounded-xl px-4 py-4 shadow-sm">
                  <Icon className="w-5 h-5 text-orange-500 mb-1" />
                  <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                  <span className="text-xs text-gray-500">{stat.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA strip ─── */}
      <section className="py-10 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 border border-orange-200 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
            <Zap className="w-3.5 h-3.5" />
            Nền tảng ERP cho doanh nghiệp Việt
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
            Quản lý toàn bộ doanh nghiệp{' '}
            <span className="text-orange-500">trong một nền tảng</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Từ bán hàng, kho bãi đến kế toán và nhân sự — ERP Mini giúp bạn
            vận hành chuyên nghiệp, tiết kiệm thời gian và tăng trưởng bền vững.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold px-7 py-3.5 rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              Dùng thử miễn phí 30 ngày
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="inline-flex items-center gap-2 border-2 border-gray-300 hover:border-orange-400 text-gray-700 hover:text-orange-600 text-base font-semibold px-7 py-3.5 rounded-lg transition-colors">
              Xem demo
            </button>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tất cả những gì doanh nghiệp cần
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Một nền tảng tích hợp hoàn chỉnh — không cần ghép nhiều phần mềm rời rạc
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-orange-200 transition-all duration-200"
                >
                  <div className="w-12 h-12 bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white rounded-lg flex items-center justify-center mb-4 transition-colors duration-200">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feat.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Bắt đầu chỉ trong 3 bước
            </h2>
            <p className="text-lg text-gray-500">
              Đơn giản, nhanh chóng — hệ thống sẵn sàng chạy trong vài phút
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div key={step.number} className="relative text-center">
                {idx < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-2rem)] h-0.5 bg-orange-200" />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500 text-white text-2xl font-bold mb-4 shadow-md">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Bảng giá linh hoạt</h2>
            <p className="text-lg text-gray-500">
              Chọn gói phù hợp với quy mô doanh nghiệp — nâng cấp bất kỳ lúc nào
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 items-start">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={[
                  'relative bg-white rounded-2xl p-7 border transition-shadow',
                  plan.popular
                    ? 'border-orange-400 shadow-xl ring-1 ring-orange-400'
                    : 'border-gray-200 hover:shadow-md',
                ].join(' ')}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Phổ biến nhất
                  </span>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-500 text-sm ml-1">{plan.period}</span>}
                </div>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={[
                    'block text-center py-2.5 rounded-lg text-sm font-semibold transition-colors',
                    plan.popular
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-700 border border-gray-200',
                  ].join(' ')}
                >
                  {plan.price === 'Liên hệ' ? 'Liên hệ ngay' : 'Bắt đầu ngay'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA bottom ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Bắt đầu hành trình số hóa doanh nghiệp hôm nay
          </h2>
          <p className="text-orange-100 text-lg mb-8">Dùng thử miễn phí 30 ngày — không cần thẻ tín dụng</p>
          <form onSubmit={handleCtaSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={ctaEmail}
              onChange={(e) => setCtaEmail(e.target.value)}
              placeholder="Email doanh nghiệp của bạn"
              className="flex-1 px-4 py-3 rounded-lg text-sm text-gray-900 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-gray-400"
            />
            <button
              type="submit"
              className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
            >
              Đăng ký ngay
            </button>
          </form>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-gray-900 text-gray-400 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <img src="/assets/logo.png" alt="" className="h-8 w-8 object-contain opacity-90" />
                <span className="text-xl font-bold tracking-tight">
                  <span className="text-white">ERP</span>
                  <span className="text-orange-400"> Mini</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                Giải pháp quản lý doanh nghiệp toàn diện cho doanh nghiệp Việt Nam.
              </p>
            </div>

            {/* Sản phẩm */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Sản phẩm</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-orange-400 transition-colors">Tính năng</a></li>
                <li><a href="#pricing" className="hover:text-orange-400 transition-colors">Bảng giá</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Tích hợp</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Lộ trình</a></li>
              </ul>
            </div>

            {/* Công ty */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Công ty</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-orange-400 transition-colors">Về chúng tôi</a></li>
                <li><a href="/public/blog" className="hover:text-orange-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Tuyển dụng</a></li>
              </ul>
            </div>

            {/* Hỗ trợ */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-orange-400 transition-colors">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Liên hệ</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Điều khoản sử dụng</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Chính sách bảo mật</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            © 2025 ERP Mini. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
