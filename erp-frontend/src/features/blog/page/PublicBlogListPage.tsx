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
    <div className="min-h-screen bg-slate-50/50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col pt-28">

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
          <Link to="/#features" className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-orange-500 transition-colors">
            Tính năng
          </Link>
          <Link to="/#pricing" className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-orange-500 transition-colors">
            Giá cả
          </Link>
          <Link to="/public/blog" className="text-xs font-semibold uppercase tracking-wider text-orange-500 transition-colors">
            Blog
          </Link>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>
          <Link to="/login" className="text-xs font-semibold uppercase tracking-wider text-slate-650 hover:text-orange-500 transition-colors dark:text-slate-350">
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
            <Link to="/#features" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-orange-500" onClick={() => setMobileMenuOpen(false)}>
              Tính năng
            </Link>
            <Link to="/#pricing" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-orange-500" onClick={() => setMobileMenuOpen(false)}>
              Giá cả
            </Link>
            <Link to="/public/blog" className="text-sm font-semibold text-slate-650 dark:text-slate-350 hover:text-orange-500" onClick={() => setMobileMenuOpen(false)}>
              Blog
            </Link>
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

      {/* ─── Hero ─── */}
      <section className="py-16 px-6 lg:px-12 bg-gradient-to-b from-orange-50/20 to-transparent dark:from-slate-900/20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-600 text-[10px] uppercase tracking-[0.2em] font-semibold px-3 py-1.5 rounded-full border border-orange-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Tin tức & Sự kiện
          </span>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-850 dark:text-white leading-tight">
            Blog & Kiến thức doanh nghiệp
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
            Khám phá các bài viết chuyên sâu về tối ưu quy trình kinh doanh, ứng dụng AI trong quản lý doanh nghiệp và cập nhật mới nhất từ ERP Mini.
          </p>
        </div>
      </section>

      {/* ─── Content ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-12 pb-24">

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-650 dark:text-red-400 p-4 rounded-2xl text-center mb-8 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <span className="text-sm text-slate-450 font-medium">Đang tải bài viết...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-slate-900/[0.02] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06] p-2 rounded-[2.5rem] shadow-sm max-w-md mx-auto">
            <div className="bg-white dark:bg-slate-900 rounded-[calc(2.5rem-0.5rem)] p-12 border border-slate-200/40 dark:border-slate-800/40 shadow-sm text-center space-y-5">
              <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Chưa có bài viết nào</h3>
              <p className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed">
                Đội ngũ biên tập đang chuẩn bị các bài viết chia sẻ kiến thức. Hãy quay lại sau nhé!
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-orange-500 hover:text-orange-600 transition-colors"
              >
                Về trang chủ <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-slate-900/[0.02] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06] p-2 rounded-[2rem] shadow-sm group hover:scale-[1.01] transition-all duration-300"
              >
                <Link
                  to={`/public/blog/${post.slug}`}
                  className="bg-white dark:bg-slate-900 rounded-[calc(2rem-0.5rem)] border border-slate-200/40 dark:border-slate-800/40 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full min-h-[380px]"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full bg-orange-500/5 dark:bg-orange-500/10 overflow-hidden">
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-orange-200 dark:text-orange-900/40" />
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-3.5 text-left">
                      {post.product && (
                        <span className="inline-flex items-center text-[10px] font-bold bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded border border-orange-500/20">
                          <ShoppingBag className="w-3 h-3 mr-1" /> {post.product.name}
                        </span>
                      )}
                      <h3 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-orange-500 line-clamp-2 transition-colors leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {post.summary || "Nhấn để đọc bài viết chi tiết."}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-6 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-350" />
                        <span>{post.author?.full_name || "Ban biên tập"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-350" />
                        <span>{new Date(post.created_at).toLocaleDateString("vi-VN")}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-6 lg:px-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
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
            <div className="space-y-4">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Sản phẩm</h4>
              <ul className="space-y-2.5 text-xs">
                <li><Link to="/#features" className="hover:text-orange-500 transition-colors">Tính năng</Link></li>
                <li><Link to="/#pricing" className="hover:text-orange-500 transition-colors">Bảng giá</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Công ty</h4>
              <ul className="space-y-2.5 text-xs">
                <li><Link to="/" className="hover:text-orange-500 transition-colors">Về chúng tôi</Link></li>
                <li><Link to="/public/blog" className="hover:text-orange-555 transition-colors text-orange-500">Blog</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Hỗ trợ</h4>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#" className="hover:text-orange-500 transition-colors">Trợ giúp</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Liên hệ</a></li>
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
