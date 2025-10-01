import { useState } from "react";
import { 
  BarChart3, 
  Users, 
  Package, 
  TrendingUp, 
  Shield, 
  Zap,
  ArrowRight,
  CheckCircle,
  Menu,
  X
} from "lucide-react";

export default function MainPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Báo cáo thông minh",
      description: "Phân tích dữ liệu kinh doanh real-time với dashboard trực quan"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Quản lý nhân sự",
      description: "Tối ưu hóa quy trình HR từ tuyển dụng đến đánh giá hiệu suất"
    },
    {
      icon: <Package className="w-8 h-8" />,
      title: "Quản lý kho",
      description: "Theo dõi tồn kho, xuất nhập hàng tự động và chính xác"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Tăng trưởng doanh thu",
      description: "Tối ưu hóa chiến lược kinh doanh dựa trên dữ liệu phân tích"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Bảo mật cao",
      description: "Mã hóa dữ liệu và phân quyền người dùng đa cấp"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Hiệu suất vượt trội",
      description: "Xử lý nhanh chóng với công nghệ cloud hiện đại"
    }
  ];

  const stats = [
    { value: "500+", label: "Doanh nghiệp" },
    { value: "99.9%", label: "Uptime" },
    { value: "50K+", label: "Người dùng" },
    { value: "24/7", label: "Hỗ trợ" }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "499K",
      period: "/tháng",
      features: [
        "Tối đa 10 người dùng",
        "5GB lưu trữ",
        "Báo cáo cơ bản",
        "Hỗ trợ email"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "1.499K",
      period: "/tháng",
      features: [
        "Tối đa 50 người dùng",
        "50GB lưu trữ",
        "Báo cáo nâng cao",
        "Hỗ trợ 24/7",
        "API access",
        "Custom branding"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Liên hệ",
      period: "",
      features: [
        "Không giới hạn người dùng",
        "Lưu trữ không giới hạn",
        "Tùy chỉnh hoàn toàn",
        "Dedicated support",
        "On-premise option",
        "SLA 99.99%"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-orange-400 rounded-full"></div>
              </div>
              <div>
                <span className="text-sm text-orange-400 font-medium">ERP</span>
                <div className="text-xl font-bold text-blue-900">System</div>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-orange-500 transition">Tính năng</a>
              <a href="#pricing" className="text-gray-700 hover:text-orange-500 transition">Bảng giá</a>
              <a href="#about" className="text-gray-700 hover:text-orange-500 transition">Về chúng tôi</a>
              <a href="/login" className="text-gray-700 hover:text-orange-500 transition">Đăng nhập</a>
              <a 
                href="/login" 
                className="bg-orange-400 hover:bg-orange-500 text-white px-6 py-2 rounded-lg transition"
              >
                Dùng thử miễn phí
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-3">
              <a href="#features" className="block text-gray-700 hover:text-orange-500">Tính năng</a>
              <a href="#pricing" className="block text-gray-700 hover:text-orange-500">Bảng giá</a>
              <a href="#about" className="block text-gray-700 hover:text-orange-500">Về chúng tôi</a>
              <a href="/login" className="block text-gray-700 hover:text-orange-500">Đăng nhập</a>
              <a 
                href="/login" 
                className="block bg-orange-400 text-white px-6 py-2 rounded-lg text-center"
              >
                Dùng thử miễn phí
              </a>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Giải pháp ERP hàng đầu Việt Nam
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Quản lý doanh nghiệp
                <span className="text-orange-500"> thông minh</span> và
                <span className="text-blue-900"> hiệu quả</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Tối ưu hóa mọi quy trình kinh doanh từ kế toán, nhân sự đến quản lý kho hàng. 
                Tăng năng suất lên đến 300% với ERP System.
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="/login"
                  className="bg-orange-400 hover:bg-orange-500 text-white px-8 py-4 rounded-lg font-semibold inline-flex items-center gap-2 transition"
                >
                  Bắt đầu ngay
                  <ArrowRight className="w-5 h-5" />
                </a>
                <button className="border-2 border-gray-300 hover:border-orange-400 text-gray-700 px-8 py-4 rounded-lg font-semibold transition">
                  Xem demo
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl p-8 shadow-2xl">
                <div className="bg-white rounded-lg p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Doanh thu tháng này</h3>
                    <span className="text-green-600 text-sm font-semibold">+23.5%</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">2,450,000,000đ</div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 w-3/4"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <p className="text-white/70 text-sm mb-1">Đơn hàng</p>
                    <p className="text-white text-2xl font-bold">1,234</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <p className="text-white/70 text-sm mb-1">Khách hàng</p>
                    <p className="text-white text-2xl font-bold">856</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-orange-400 rounded-full blur-3xl opacity-50"></div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-blue-400 rounded-full blur-3xl opacity-50"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tính năng nổi bật
            </h2>
            <p className="text-xl text-gray-600">
              Tất cả những gì doanh nghiệp bạn cần trong một nền tảng
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-orange-400 transition group"
              >
                <div className="w-14 h-14 bg-orange-100 text-orange-500 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-400 group-hover:text-white transition">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Bảng giá linh hoạt
            </h2>
            <p className="text-xl text-gray-600">
              Chọn gói phù hợp với quy mô doanh nghiệp của bạn
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index}
                className={`bg-white rounded-2xl p-8 ${
                  plan.popular 
                    ? 'border-2 border-orange-400 shadow-xl scale-105' 
                    : 'border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="bg-orange-400 text-white text-sm font-semibold px-4 py-1 rounded-full inline-block mb-4">
                    Phổ biến nhất
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    plan.popular
                      ? 'bg-orange-400 hover:bg-orange-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  Chọn gói này
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Sẵn sàng chuyển đổi số doanh nghiệp?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Tham gia cùng hàng nghìn doanh nghiệp đã tin tưởng ERP System
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="/login"
              className="bg-orange-400 hover:bg-orange-500 text-white px-8 py-4 rounded-lg font-semibold inline-flex items-center gap-2 transition"
            >
              Dùng thử 30 ngày miễn phí
              <ArrowRight className="w-5 h-5" />
            </a>
            <button className="bg-white/10 backdrop-blur hover:bg-white/20 text-white px-8 py-4 rounded-lg font-semibold transition border border-white/20">
              Liên hệ tư vấn
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-orange-400 rounded-full"></div>
                </div>
                <div className="text-white font-bold">ERP System</div>
              </div>
              <p className="text-sm">
                Giải pháp quản lý doanh nghiệp toàn diện và hiện đại
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Sản phẩm</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-orange-400">Tính năng</a></li>
                <li><a href="#" className="hover:text-orange-400">Bảng giá</a></li>
                <li><a href="#" className="hover:text-orange-400">Tích hợp</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Công ty</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-orange-400">Về chúng tôi</a></li>
                <li><a href="#" className="hover:text-orange-400">Blog</a></li>
                <li><a href="#" className="hover:text-orange-400">Tuyển dụng</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-orange-400">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-orange-400">Liên hệ</a></li>
                <li><a href="#" className="hover:text-orange-400">Điều khoản</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2025 ERP System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}