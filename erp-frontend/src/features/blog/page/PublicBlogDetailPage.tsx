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

  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-100 rounded-xl p-4 my-4 overflow-x-auto text-xs font-mono"><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-orange-50 text-orange-600 rounded px-1.5 py-0.5 font-mono text-xs font-semibold">$1</code>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="text-3xl font-extrabold text-gray-900 mt-8 mb-4 border-b border-gray-100 pb-2">$1</h1>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-6 mb-3">$1</h2>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-xl font-bold text-gray-900 mt-4 mb-2">$1</h3>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/^\s*-\s+(.+)$/gm, '<li class="list-disc ml-6 my-1.5 text-gray-700">$1</li>');
  html = html.replace(/(<li class="list-disc[\s\S]*?<\/li>)/g, '<ul class="my-4">$1</ul>');
  html = html.replace(/<\/ul>\s*<ul class="my-4">/g, "");
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li class="list-decimal ml-6 my-1.5 text-gray-700">$1</li>');
  html = html.replace(/(<li class="list-decimal[\s\S]*?<\/li>)/g, '<ol class="my-4">$1</ol>');
  html = html.replace(/<\/ol>\s*<ol class="my-4">/g, "");

  html = html.split(/\n\n+/).map(block => {
    block = block.trim();
    if (!block) return "";
    if (block.startsWith("<h") || block.startsWith("<pre") || block.startsWith("<ul") || block.startsWith("<ol")) return block;
    return `<p class="my-4 text-gray-700 leading-relaxed text-sm md:text-base">${block.replace(/\n/g, "<br />")}</p>`;
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
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-white">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="text-sm text-gray-400 font-medium">Đang tải bài viết...</span>
      </div>
    );
  }

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
              <Link to="/#features" className="block px-2 py-1.5 text-sm text-gray-600" onClick={() => setMobileMenuOpen(false)}>Tính năng</Link>
              <Link to="/#pricing" className="block px-2 py-1.5 text-sm text-gray-600" onClick={() => setMobileMenuOpen(false)}>Giá cả</Link>
              <Link to="/public/blog" className="block px-2 py-1.5 text-sm font-semibold text-orange-500">Blog</Link>
              <Link to="/login" className="block px-2 py-1.5 text-sm text-gray-600">Đăng nhập</Link>
              <Link to="/register" className="block text-center bg-orange-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg">Dùng thử miễn phí</Link>
            </div>
          )}
        </div>
      </nav>

      {/* ─── Main ─── */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">

        {error || !post ? (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 p-8 rounded-2xl text-center space-y-4 max-w-md mx-auto shadow-sm">
            <p className="font-semibold">{error || "Bài viết không tồn tại."}</p>
            <Link
              to="/public/blog"
              className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Xem các bài viết khác
            </Link>
          </div>
        ) : (
          <article className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-10 space-y-8">

            {/* Nút quay lại */}
            <Link
              to="/public/blog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại Blog
            </Link>

            {/* Tiêu đề & meta */}
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-5 text-xs text-gray-400 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-gray-300" />
                  <span>Tác giả: <strong className="text-gray-600">{post.author?.full_name || "Ban biên tập"}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-300" />
                  <span>Ngày đăng: {new Date(post.created_at).toLocaleDateString("vi-VN")}</span>
                </div>
              </div>
            </div>

            {/* Ảnh bìa */}
            {post.image_url && (
              <div className="rounded-xl overflow-hidden aspect-video w-full border border-gray-100 bg-orange-50">
                <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Nội dung */}
            <div
              className="prose prose-orange max-w-none leading-relaxed"
              dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(post.content) }}
            />

            {/* Sản phẩm liên quan */}
            {post.product && (
              <div className="bg-orange-50 rounded-2xl border border-orange-100 p-5 md:p-6 mt-10 space-y-4">
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Sản phẩm liên quan
                </span>
                <div className="flex flex-col sm:flex-row gap-5 items-center">
                  {post.product.image_url ? (
                    <div className="w-full sm:w-40 aspect-video sm:aspect-square rounded-xl overflow-hidden border border-gray-100 bg-white flex-shrink-0">
                      <img src={post.product.image_url} alt={post.product.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full sm:w-40 aspect-video sm:aspect-square rounded-xl bg-white border border-orange-100 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-8 h-8 text-orange-300" />
                    </div>
                  )}
                  <div className="space-y-3 text-center sm:text-left flex-1">
                    <h4 className="text-base font-bold text-gray-900">{post.product.name}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {post.product.description || "Liên hệ ngay để nhận tư vấn và ưu đãi đặc biệt."}
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                      <span className="text-base font-extrabold text-orange-600">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(post.product.sale_price)}
                      </span>
                      <Link
                        to="/register"
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
                      >
                        Mua ngay <Sparkles className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </article>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
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
