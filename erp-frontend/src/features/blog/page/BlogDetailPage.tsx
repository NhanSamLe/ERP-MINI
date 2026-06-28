import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Globe, 
  ShoppingBag,
  ExternalLink,
  Loader2
} from "lucide-react";
import { getBlogPost, deleteBlogPost } from "../api/blog.api";
import { BlogPost } from "../dto/blog.dto";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/badge";

// Helper function to parse markdown safely to HTML
function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";
  
  let html = markdown
    // Escape HTML special chars to prevent XSS
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code Blocks (Fenced code)
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 text-gray-100 rounded-xl p-4 my-4 overflow-x-auto text-xs font-mono"><code>$1</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-orange-600 rounded px-1.5 py-0.5 font-mono text-xs font-semibold">$1</code>');

  // Headings
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="text-3xl font-extrabold text-gray-900 mt-8 mb-4 border-b border-gray-100 pb-2">$1</h1>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-6 mb-3">$1</h2>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-xl font-bold text-gray-900 mt-4 mb-2">$1</h3>');

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
  
  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

  // Unordered Lists
  // Simple list processing: replace "- item" with "<li>item</li>"
  html = html.replace(/^\s*-\s+(.+)$/gm, '<li class="list-disc ml-6 my-1.5 text-gray-700">$1</li>');

  // Group adjacent <li> tags inside a <ul>
  html = html.replace(/(<li class="list-disc ml-6 my-1.5 text-gray-700">[\s\S]*?<\/li>)/g, '<ul class="my-4">$1</ul>');
  // Clean up double nested <ul>
  html = html.replace(/<\/ul>\s*<ul class="my-4">/g, "");

  // Ordered lists
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li class="list-decimal ml-6 my-1.5 text-gray-700">$1</li>');
  html = html.replace(/(<li class="list-decimal ml-6 my-1.5 text-gray-700">[\s\S]*?<\/li>)/g, '<ol class="my-4">$1</ol>');
  html = html.replace(/<\/ol>\s*<ol class="my-4">/g, "");

  // Line breaks & Paragraphs
  // Split by double line breaks and wrap in <p> if not inside other blocks
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

export default function BlogDetailPage() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!idOrSlug) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getBlogPost(idOrSlug);
        setPost(data);
      } catch (err: any) {
        console.error("Error loading blog details:", err);
        setError("Không tìm thấy bài viết hoặc bài viết đã bị xóa.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [idOrSlug]);

  const handleDelete = async () => {
    if (!post) return;
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này?")) return;

    try {
      await deleteBlogPost(post.id);
      navigate("/blog");
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Xóa bài viết thất bại.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="text-sm text-gray-500 font-medium">Đang tải nội dung bài viết...</span>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center space-y-4">
          <p className="font-semibold">{error || "Không tìm thấy bài viết."}</p>
          <Button 
            onClick={() => navigate("/blog")}
            className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1.5 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const renderedHtml = parseMarkdownToHtml(post.content);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Navigation Actions */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-150 shadow-sm">
        <Link 
          to="/blog" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-orange-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </Link>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(`/blog/edit/${post.id}`)}
            variant="outline"
            className="h-8 text-xs border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" /> Sửa
          </Button>
          <Button
            onClick={handleDelete}
            variant="outline"
            className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Xóa
          </Button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
        {/* Left Column: Article Content */}
        <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden p-6 md:p-8 space-y-6">
          {/* Metadata Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={
                post.status === "published"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-gray-100 text-gray-700 border border-gray-200"
              }>
                {post.status === "published" ? "Đã xuất bản" : "Bản nháp"}
              </Badge>
              {post.product && (
                <Badge className="bg-orange-50 text-orange-600 border border-orange-200 font-medium">
                  Sản phẩm: {post.product.name}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-gray-400" />
                <span>Đăng bởi: <strong>{post.author ? (post.author.full_name || post.author.username) : "Người dùng"}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Ngày tạo: {new Date(post.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          </div>

          {/* Feature Image */}
          {post.image_url && (
            <div className="rounded-xl overflow-hidden aspect-video w-full bg-slate-50 border border-gray-100">
              <img 
                src={post.image_url} 
                alt={post.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Rendered HTML */}
          <div 
            className="prose prose-orange max-w-none"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>

        {/* Right Column: Sidebar (Product Card & SEO Card) */}
        <div className="space-y-6">
          {/* Linked Product Card */}
          {post.product && (
            <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-4 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-orange-500" />
                Sản phẩm liên kết
              </h3>

              {post.product.image_url ? (
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-50 border border-gray-100">
                  <img 
                    src={post.product.image_url} 
                    alt={post.product.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video w-full rounded-lg bg-orange-50/50 flex items-center justify-center border border-orange-100">
                  <ShoppingBag className="w-8 h-8 text-orange-300" />
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-gray-800 line-clamp-2">
                  {post.product.name}
                </h4>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>SKU: {post.product.sku}</span>
                  <span className="font-bold text-orange-600">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "VND" }).format(post.product.sale_price)}
                  </span>
                </div>
              </div>

              <Link 
                to={`/inventory/products`} // or deep link if product detail page exists
                className="w-full h-8 rounded-lg border border-gray-200 text-gray-700 font-semibold text-xs flex items-center justify-center gap-1 hover:bg-slate-50 transition-colors"
              >
                View Inventory Details <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* SEO Preview Card */}
          <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-4 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              SEO Google Preview
            </h3>

            <div className="border border-gray-200 rounded-xl p-3 bg-slate-50 space-y-1 hover:bg-slate-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">G</span>
                <span className="truncate max-w-[200px]">yoursite.com/blog/{post.slug}</span>
              </div>
              <h4 className="text-sm text-blue-800 font-medium hover:underline truncate line-clamp-1 leading-snug">
                {post.seo_title || post.title}
              </h4>
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {post.seo_meta_desc || post.summary || "Bài viết chưa có mô tả SEO để hiển thị trên công cụ tìm kiếm."}
              </p>
            </div>

            {post.seo_keywords && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400">Từ khóa chính:</span>
                <div className="flex flex-wrap gap-1">
                  {post.seo_keywords.split(",").map((kw, i) => (
                    <span 
                      key={i} 
                      className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium"
                    >
                      {kw.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
