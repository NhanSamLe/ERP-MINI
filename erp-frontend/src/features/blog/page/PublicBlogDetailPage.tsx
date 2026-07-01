import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  Sparkles,
  ShoppingBag,
  Menu,
  X,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { getBlogPost } from "../api/blog.api";
import { BlogPost } from "../dto/blog.dto";

function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";
  let html = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-900 text-slate-100 rounded-2xl p-5 my-6 overflow-x-auto text-xs font-mono border border-slate-800"><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-orange-500/10 text-orange-600 rounded px-1.5 py-0.5 font-mono text-xs font-semibold">$1</code>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="text-3xl font-bold text-slate-800 dark:text-white mt-10 mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-3">$1</h1>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-2">$1</h2>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-xl font-bold text-slate-850 dark:text-white mt-6 mb-3">$1</h3>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/^\s*-\s+(.+)$/gm, '<li class="list-disc ml-6 my-2 text-slate-655 dark:text-slate-300">$1</li>');
  html = html.replace(/(<li class="list-disc[\s\S]*?<\/li>)/g, '<ul class="my-4">$1</ul>');
  html = html.replace(/<\/ul>\s*<ul class="my-4">/g, "");
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li class="list-decimal ml-6 my-2 text-slate-655 dark:text-slate-300">$1</li>');
  html = html.replace(/(<li class="list-decimal[\s\S]*?<\/li>)/g, '<ol class="my-4">$1</ol>');
  html = html.replace(/<\/ol>\s*<ol class="my-4">/g, "");

  html = html.split(/\n\n+/).map(block => {
    block = block.trim();
    if (!block) return "";
    if (block.startsWith("<h") || block.startsWith("<pre") || block.startsWith("<ul") || block.startsWith("<ol")) return block;
    return `<p class="my-4 text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base">${block.replace(/\n/g, "<br />")}</p>`;
  }).join("\n");

  return html;
}

export default function PublicBlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getBlogPost(slug);
        if (data.status !== "published") throw new Error("Bài viết chưa được xuất bản.");
        setPost(data);
      } catch {
        setError("Bài viết không tồn tại hoặc chưa được xuất bản.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-white dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="text-sm text-slate-450 font-medium">Đang tải bài viết...</span>
      </div>
    );
  }

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

      {/* ─── Main ─── */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 pt-12 pb-24">

        {error || !post ? (
          <div className="bg-slate-900/[0.02] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06] p-2 rounded-[2.5rem] shadow-sm max-w-md mx-auto">
            <div className="bg-white dark:bg-slate-900 rounded-[calc(2.5rem-0.5rem)] p-8 border border-slate-200/40 dark:border-slate-800/40 shadow-sm text-center space-y-4">
              <p className="font-semibold text-slate-800 dark:text-white">{error || "Bài viết không tồn tại."}</p>
              <Link
                to="/public/blog"
                className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] shadow-md shadow-orange-500/10"
              >
                <ArrowLeft className="w-4 h-4" /> Xem các bài viết khác
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/[0.02] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06] p-2 rounded-[2.5rem] shadow-sm">
            <article className="bg-white dark:bg-slate-900 rounded-[calc(2.5rem-0.5rem)] border border-slate-200/40 dark:border-slate-800/40 shadow-sm p-6 md:p-12 space-y-8 text-left">

              {/* Nút quay lại */}
              <Link
                to="/public/blog"
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-450 hover:text-orange-500 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại Blog
              </Link>

              {/* Tiêu đề & meta */}
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-850 dark:text-white leading-tight">
                  {post.title}
                </h1>
                <div className="flex flex-wrap items-center gap-5 text-xs text-slate-400 border-b border-slate-100 dark:border-slate-800/60 pb-5">
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-350" />
                    <span>Tác giả: <strong className="text-slate-650 dark:text-slate-300">{post.author?.full_name || "Ban biên tập"}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-350" />
                    <span>Ngày đăng: {new Date(post.created_at).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
              </div>

              {/* Ảnh bìa */}
              {post.image_url && (
                <div className="rounded-2xl overflow-hidden aspect-video w-full border border-slate-105 dark:border-slate-800 bg-orange-500/5 dark:bg-orange-500/10">
                  <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Nội dung */}
              <div
                className="prose prose-orange dark:prose-invert max-w-none leading-relaxed text-slate-650 dark:text-slate-305 space-y-4"
                dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(post.content) }}
              />

              {/* Sản phẩm liên quan */}
              {post.product && (
                <div className="bg-slate-900/[0.02] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06] p-1.5 rounded-[2rem] mt-10">
                  <div className="bg-orange-500/5 dark:bg-slate-850 rounded-[calc(2rem-0.375rem)] border border-orange-500/10 dark:border-slate-800/60 p-6 md:p-8 space-y-6 text-left shadow-sm">
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Sản phẩm liên quan
                    </span>
                    <div className="flex flex-col sm:flex-row gap-6 items-center">
                      {post.product.image_url ? (
                        <div className="w-full sm:w-32 aspect-video sm:aspect-square rounded-xl overflow-hidden border border-slate-200/50 bg-white flex-shrink-0">
                          <img src={post.product.image_url} alt={post.product.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full sm:w-32 aspect-video sm:aspect-square rounded-xl bg-white dark:bg-slate-900 border border-orange-500/10 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-8 h-8 text-orange-300 dark:text-orange-950/60" />
                        </div>
                      )}
                      <div className="space-y-3.5 text-center sm:text-left flex-1">
                        <h4 className="text-base font-bold text-slate-800 dark:text-white">{post.product.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {post.product.description || "Liên hệ ngay để nhận tư vấn và ưu đãi đặc biệt."}
                        </p>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                          <span className="text-base font-bold text-orange-550 dark:text-orange-400">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(post.product.sale_price)}
                          </span>
                          <Link
                            to="/register"
                            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs uppercase tracking-wider px-4 py-2 rounded-full transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] shadow-md shadow-orange-500/10"
                          >
                            Mua ngay
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </article>
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
                <li><Link to="/public/blog" className="hover:text-orange-500 transition-colors">Blog</Link></li>
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
