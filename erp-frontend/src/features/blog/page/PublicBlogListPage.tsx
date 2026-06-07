import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Calendar,
  User,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import { getBlogPosts } from "../api/blog.api";
import { BlogPost } from "../dto/blog.dto";

export default function PublicBlogListPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getBlogPosts({ status: "published" });
        setPosts(data);
      } catch {
        setError("Không thể tải danh sách bài viết. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 select-none">
              <img src="/assets/logo.png" alt="" className="h-9 w-9 object-contain" />
              <span className="text-xl font-bold tracking-tight">
                <span className="text-gray-900">ERP</span>
                <span className="text-orange-500"> Mini</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/#features" className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">Tính năng</Link>
              <Link to="/#pricing" className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">Giá cả</Link>
              <Link to="/public/blog" className="text-sm font-semibold text-orange-500">Blog</Link>
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors">Đăng nhập</Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                Dùng thử miễn phí <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-orange-50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100 space-y-3">
              <Link to="/#features" className="block px-2 py-1.5 text-sm text-gray-600 hover:text-orange-500" onClick={() => setMobileMenuOpen(false)}>Tính năng</Link>
              <Link to="/#pricing" className="block px-2 py-1.5 text-sm text-gray-600 hover:text-orange-500" onClick={() => setMobileMenuOpen(false)}>Giá cả</Link>
              <Link to="/public/blog" className="block px-2 py-1.5 text-sm font-semibold text-orange-500">Blog</Link>
              <Link to="/login" className="block px-2 py-1.5 text-sm text-gray-600 hover:text-orange-500">Đăng nhập</Link>
              <Link to="/register" className="block text-center bg-orange-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg">Dùng thử miễn phí</Link>
            </div>
          )}
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-28 pb-14 px-4 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-600 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            Tin tức & Sự kiện
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            Blog & Kiến thức doanh nghiệp
          </h1>
          <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
            Khám phá các bài viết chuyên sâu về tối ưu quy trình kinh doanh,
            ứng dụng AI trong quản lý doanh nghiệp và cập nhật mới nhất từ ERP Mini.
          </p>
        </div>
      </section>

      {/* ─── Content ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center mb-8 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <span className="text-sm text-gray-400 font-medium">Đang tải bài viết...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center max-w-md mx-auto shadow-sm space-y-4">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7 text-orange-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Chưa có bài viết nào</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Đội ngũ biên tập đang chuẩn bị các bài viết chia sẻ kiến thức. Hãy quay lại sau nhé!
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs font-bold text-orange-500 hover:underline"
            >
              Về trang chủ <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/public/blog/${post.slug}`}
                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all flex flex-col shadow-sm"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full bg-orange-50 overflow-hidden">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-orange-200" />
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    {post.product && (
                      <span className="inline-flex items-center text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded border border-orange-100">
                        <ShoppingBag className="w-3 h-3 mr-1" /> {post.product.name}
                      </span>
                    )}
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-600 line-clamp-2 transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                      {post.summary || "Nhấn để đọc bài viết chi tiết."}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-3.5 mt-4 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>{post.author?.full_name || "Ban biên tập"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(post.created_at).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <img src="/assets/logo.png" alt="" className="h-8 w-8 object-contain opacity-90" />
                <span className="text-xl font-bold">
                  <span className="text-white">ERP</span>
                  <span className="text-orange-400"> Mini</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                Giải pháp quản lý doanh nghiệp toàn diện cho doanh nghiệp Việt Nam.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Sản phẩm</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/#features" className="hover:text-orange-400 transition-colors">Tính năng</Link></li>
                <li><Link to="/#pricing" className="hover:text-orange-400 transition-colors">Bảng giá</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Công ty</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="hover:text-orange-400 transition-colors">Về chúng tôi</Link></li>
                <li><Link to="/public/blog" className="hover:text-orange-400 transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-orange-400 transition-colors">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Liên hệ</a></li>
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
