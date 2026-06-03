import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Sparkles, 
  ShoppingBag,
  Menu,
  X,
  Loader2
} from "lucide-react";
import { getBlogPost } from "../api/blog.api";
import { BlogPost } from "../dto/blog.dto";
import { Badge } from "../../../components/ui/badge";

// Safe markdown-to-html parser utility
function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";
  
  let html = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 text-gray-100 rounded-xl p-4 my-4 overflow-x-auto text-xs font-mono"><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-orange-600 rounded px-1.5 py-0.5 font-mono text-xs font-semibold">$1</code>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="text-3xl font-extrabold text-gray-900 mt-8 mb-4 border-b border-gray-100 pb-2">$1</h1>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-6 mb-3">$2</h2>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-xl font-bold text-gray-900 mt-4 mb-2">$1</h3>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/^\s*-\s+(.+)$/gm, '<li class="list-disc ml-6 my-1.5 text-gray-700">$1</li>');
  html = html.replace(/(<li class="list-disc ml-6 my-1.5 text-gray-700">[\s\S]*?<\/li>)/g, '<ul class="my-4">$1</ul>');
  html = html.replace(/<\/ul>\s*<ul class="my-4">/g, "");
  
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li class="list-decimal ml-6 my-1.5 text-gray-700">$1</li>');
  html = html.replace(/(<li class="list-decimal ml-6 my-1.5 text-gray-700">[\s\S]*?<\/li>)/g, '<ol class="my-4">$1</ol>');
  html = html.replace(/<\/ol>\s*<ol class="my-4">/g, "");

  const blocks = html.split(/\n\n+/);
  html = blocks.map(block => {
    block = block.trim();
    if (!block) return "";
    if (block.startsWith("<h") || block.startsWith("<pre") || block.startsWith("<ul") || block.startsWith("<ol")) {
      return block;
    }
    return `<p class="my-4 text-gray-700 leading-relaxed text-sm md:text-base">${block.replace(/\n/g, "<br />")}</p>`;
  }).join("\n");

  return html;
}

export default function PublicBlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getBlogPost(slug);
        
        // Chỉ cho phép xem nếu bài viết đã được xuất bản
        if (data.status !== "published") {
          throw new Error("Article is not published yet.");
        }
        setPost(data);
      } catch (err: any) {
        console.error("Error loading public blog details:", err);
        setError("Article does not exist or is not published.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3 bg-slate-50 min-h-screen">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="text-sm text-slate-500 font-medium">Loading article...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Landing Page Header/Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-orange-400 rounded-full"></div>
              </div>
              <div>
                <span className="text-sm text-orange-400 font-medium">ERP</span>
                <div className="text-xl font-bold text-blue-900">System</div>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/#features" className="text-gray-700 hover:text-orange-500 transition">Features</Link>
              <Link to="/#pricing" className="text-gray-700 hover:text-orange-500 transition">Pricing</Link>
              <Link to="/public/blog" className="text-orange-500 font-semibold">Blog</Link>
              <Link to="/login" className="text-gray-700 hover:text-orange-500 transition">Sign In</Link>
              <Link 
                to="/login" 
                className="bg-orange-400 hover:bg-orange-500 text-white px-6 py-2 rounded-lg transition"
              >
                Free Trial
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-3 border-t border-gray-150">
              <Link to="/#features" className="block text-gray-700 hover:text-orange-500">Features</Link>
              <Link to="/#pricing" className="block text-gray-700 hover:text-orange-500">Pricing</Link>
              <Link to="/public/blog" className="block text-orange-500 font-semibold">Blog</Link>
              <Link to="/login" className="block text-gray-700 hover:text-orange-500">Sign In</Link>
              <Link 
                to="/login" 
                className="block bg-orange-400 text-white px-6 py-2 rounded-lg text-center"
              >
                Free Trial
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Main Reader Wrapper */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        
        {error || !post ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center space-y-4 max-w-md mx-auto shadow-sm">
            <p className="font-semibold">{error || "Article is not available."}</p>
            <Link 
              to="/public/blog"
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> View other articles
            </Link>
          </div>
        ) : (
          /* Reader Layout */
          <article className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-10 space-y-8">
            
            {/* Back Button */}
            <Link 
              to="/public/blog"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Blog
            </Link>

            {/* Title & Metadata */}
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-gray-300" />
                  <span>Author: <strong>{post.author?.full_name || "Editorial Team"}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-300" />
                  <span>Published Date: {new Date(post.created_at).toLocaleDateString("en-US")}</span>
                </div>
              </div>
            </div>

            {/* Feature Image */}
            {post.image_url && (
              <div className="rounded-xl overflow-hidden aspect-video w-full border border-gray-100 bg-slate-50">
                <img 
                  src={post.image_url} 
                  alt={post.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Article Body */}
            <div 
              className="prose prose-orange max-w-none text-gray-850 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(post.content) }}
            />

            {/* Linked Product Promotion Card (Call to Action) */}
            {post.product && (
              <div className="bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl border border-orange-100 p-5 md:p-6 mt-12 space-y-4">
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Featured Product
                </span>

                <div className="flex flex-col sm:flex-row gap-5 items-center">
                  {post.product.image_url ? (
                    <div className="w-full sm:w-40 aspect-video sm:aspect-square rounded-xl overflow-hidden border border-gray-100 bg-white flex-shrink-0">
                      <img 
                        src={post.product.image_url} 
                        alt={post.product.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full sm:w-40 aspect-video sm:aspect-square rounded-xl bg-white border border-orange-100 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-8 h-8 text-orange-300" />
                    </div>
                  )}

                  <div className="space-y-3 text-center sm:text-left flex-1">
                    <h4 className="text-base font-bold text-gray-900 leading-snug">
                      {post.product.name}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {post.product.description || "Please contact us now for advice and exclusive offers."}
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                      <span className="text-base font-extrabold text-orange-600">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(post.product.sale_price)}
                      </span>
                      <Link 
                        to="/login" // Redirect to order/buy or standard CTA
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
                      >
                        Buy Now <Sparkles className="w-3 h-3 text-amber-300" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </article>
        )}

      </div>

      {/* Landing Page Footer */}
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
                Comprehensive and modern business management solution
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/#features" className="hover:text-orange-400">Features</Link></li>
                <li><Link to="/#pricing" className="hover:text-orange-400">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/#about" className="hover:text-orange-400">About Us</Link></li>
                <li><Link to="/public/blog" className="hover:text-orange-400">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-orange-400">Help</a></li>
                <li><a href="#" className="hover:text-orange-400">Contact</a></li>
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
