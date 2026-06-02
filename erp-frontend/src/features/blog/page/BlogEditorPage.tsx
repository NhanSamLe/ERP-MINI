import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { 
  ArrowLeft, 
  Sparkles, 
  Wand2, 
  CheckCircle, 
  Save, 
  FileText, 
  Image, 
  Tag, 
  Globe, 
  RefreshCw,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  Link as LinkIcon,
  Eye,
  Edit2,
  Loader2
} from "lucide-react";
import { 
  createBlogPost, 
  updateBlogPost, 
  getBlogPost, 
  generatePRBlog, 
  generatePRBlogStream 
} from "../api/blog.api";
import { productService } from "../../products/product.service";
import { Product } from "../../products/store/product.types";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/badge";

// Helper to convert Title to Slug automatically
function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Xóa dấu tiếng Việt
    .replace(/[đĐ]/g, "d")
    .replace(/([^a-z0-9\s-]|_)+/g, "") // Xóa ký tự đặc biệt
    .replace(/\s+/g, "-") // Thay khoảng trắng bằng -
    .replace(/-+/g, "-") // Thu gọn nhiều - liên tiếp
    .replace(/^-+|-+$/g, ""); // Xóa - ở đầu/cuối
}

export default function BlogEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  
  // Access Token for SSE stream
  const accessToken = useSelector(
    (state: RootState) => (state as any).auth?.accessToken || ""
  );

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [productId, setProductId] = useState<number | "">("");
  const [imageUrl, setImageUrl] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoMetaDesc, setSeoMetaDesc] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");

  // UI State
  const [products, setProducts] = useState<Product[]>([]);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AI Assistant Panel State
  const [aiProductId, setAiProductId] = useState<number | "">("");
  const [aiTone, setAiTone] = useState<"professional" | "persuasive" | "humorous" | "curious">("professional");
  const [aiGoal, setAiGoal] = useState<"feature" | "promotion" | "comparison">("feature");
  const [aiNotes, setAiNotes] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load products list and post details (if editing)
  useEffect(() => {
    const initData = async () => {
      try {
        // Fetch active products
        const productsList = await productService.getAllProducts();
        setProducts(productsList);

        // Fetch blog post details if in edit mode
        if (isEditMode && id) {
          const post = await getBlogPost(id);
          setTitle(post.title);
          setSlug(post.slug);
          setContent(post.content);
          setSummary(post.summary || "");
          setStatus(post.status);
          setProductId(post.product_id || "");
          setImageUrl(post.image_url || "");
          setSeoTitle(post.seo_title || "");
          setSeoMetaDesc(post.seo_meta_desc || "");
          setSeoKeywords(post.seo_keywords || "");

          // Set default product for AI assistant to be the linked one
          if (post.product_id) {
            setAiProductId(post.product_id);
          }
        }
      } catch (err: any) {
        console.error("Init editor page error:", err);
        setErrorMessage("Lỗi tải dữ liệu khởi tạo. Vui lòng kiểm tra lại hệ thống.");
      } finally {
        setPageLoading(false);
      }
    };

    initData();
  }, [isEditMode, id]);

  // Sync title to slug automatically when creating
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditMode) {
      setSlug(generateSlug(val));
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !slug.trim()) {
      setErrorMessage("Tiêu đề, nội dung và đường dẫn tĩnh (Slug) không được để trống.");
      return;
    }

    setSubmitLoading(true);
    setErrorMessage(null);

    const payload = {
      title,
      slug,
      content,
      summary: summary || undefined,
      status,
      product_id: productId ? Number(productId) : null,
      image_url: imageUrl || undefined,
      seo_title: seoTitle || undefined,
      seo_meta_desc: seoMetaDesc || undefined,
      seo_keywords: seoKeywords || undefined,
    };

    try {
      if (isEditMode && id) {
        await updateBlogPost(Number(id), payload);
      } else {
        await createBlogPost(payload);
      }
      navigate("/blog");
    } catch (err: any) {
      console.error("Submit blog post error:", err);
      setErrorMessage(err.response?.data?.error || "Lưu bài viết thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // AI Content Generator: Full JSON Fill-out
  const handleAIGenerateFull = async () => {
    if (!aiProductId) {
      alert("Vui lòng chọn sản phẩm cần viết bài PR.");
      return;
    }

    setAiLoading(true);
    setErrorMessage(null);
    try {
      const generated = await generatePRBlog({
        productId: Number(aiProductId),
        tone: aiTone,
        targetGoal: aiGoal,
        additionalNotes: aiNotes,
      });

      // Populate form fields
      setTitle(generated.title);
      setSlug(generateSlug(generated.title));
      setContent(generated.content);
      setSummary(generated.summary);
      setSeoTitle(generated.seo_title);
      setSeoMetaDesc(generated.seo_meta_desc);
      setSeoKeywords(generated.seo_keywords);
      
      // Auto link product dropdown
      setProductId(Number(aiProductId));
      
      // Select product image as featured image if available
      const currentProd = products.find(p => p.id === Number(aiProductId));
      if (currentProd?.image_url) {
        setImageUrl(currentProd.image_url);
      }
    } catch (err: any) {
      console.error("AI Generation error:", err);
      setErrorMessage(err.response?.data?.error || "Không thể sinh bài viết từ AI. Vui lòng kiểm tra lại API Key.");
    } finally {
      setAiLoading(false);
    }
  };

  // AI Content Generator: SSE Streaming directly into Content
  const handleAIGenerateStream = async () => {
    if (!aiProductId) {
      alert("Vui lòng chọn sản phẩm cần viết bài PR.");
      return;
    }

    setAiLoading(true);
    setErrorMessage(null);
    setContent(""); // Clear editor content before streaming
    
    // Auto link product
    setProductId(Number(aiProductId));
    const currentProd = products.find(p => p.id === Number(aiProductId));
    if (currentProd) {
      setTitle(`Đánh giá chi tiết sản phẩm ${currentProd.name}`);
      setSlug(generateSlug(`Đánh giá chi tiết sản phẩm ${currentProd.name}`));
      if (currentProd.image_url) {
        setImageUrl(currentProd.image_url);
      }
    }

    try {
      await generatePRBlogStream(
        {
          productId: Number(aiProductId),
          tone: aiTone,
          targetGoal: aiGoal,
          additionalNotes: aiNotes,
        },
        accessToken,
        (chunk) => {
          setContent((prev) => prev + chunk);
        },
        () => {
          // Done streaming
          setAiLoading(false);
        },
        (err) => {
          console.error("Stream error:", err);
          setErrorMessage(err.message || "Lỗi đường truyền stream AI.");
          setAiLoading(false);
        }
      );
    } catch (err: any) {
      console.error("Stream call error:", err);
      setErrorMessage(err.message || "Không thể kết nối stream AI.");
      setAiLoading(false);
    }
  };

  // Markdown Toolbar helper to insert text
  const insertMarkdown = (syntaxBefore: string, syntaxAfter = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = textarea.value.substring(start, end);
    const replacement = syntaxBefore + (selection || "văn bản") + syntaxAfter;
    
    const newContent = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    setContent(newContent);
    
    // Focus back on textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + syntaxBefore.length, start + syntaxBefore.length + (selection || "văn bản").length);
    }, 0);
  };

  // SEO Analyzer Checklist (Computed properties)
  const seoChecklist = {
    titleLength: title.length >= 10 && title.length <= 60,
    wordCount: content.split(/\s+/).filter(Boolean).length >= 300,
    headings: /##\s+|###\s+/.test(content),
    keywords: seoKeywords ? seoKeywords.split(",").some(kw => content.toLowerCase().includes(kw.trim().toLowerCase())) : false,
    metaDescLength: seoMetaDesc.length >= 50 && seoMetaDesc.length <= 160,
  };

  // Simple Markdown Parser for Live Preview tab
  const getParsedPreviewHtml = () => {
    if (!content) return "<p class='text-gray-400 italic text-sm'>Nội dung xem trước trống...</p>";
    
    let html = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 text-gray-100 rounded-xl p-4 my-4 overflow-x-auto text-xs font-mono"><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-orange-600 rounded px-1.5 py-0.5 font-mono text-xs font-semibold">$1</code>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1 class="text-3xl font-extrabold text-gray-900 mt-6 mb-3 border-b border-gray-100 pb-2">$1</h1>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-5 mb-2.5">$1</h2>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-xl font-bold text-gray-900 mt-4 mb-2">$1</h3>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/^\s*-\s+(.+)$/gm, '<li class="list-disc ml-6 my-1.5 text-gray-700">$1</li>');
    html = html.replace(/(<li class="list-disc ml-6 my-1.5 text-gray-700">[\s\S]*?<\/li>)/g, '<ul class="my-3">$1</ul>');
    html = html.replace(/<\/ul>\s*<ul class="my-3">/g, "");

    const blocks = html.split(/\n\n+/);
    return blocks.map(block => {
      block = block.trim();
      if (!block) return "";
      if (block.startsWith("<h") || block.startsWith("<pre") || block.startsWith("<ul")) return block;
      return `<p class="my-3 text-gray-700 leading-relaxed text-sm">${block.replace(/\n/g, "<br />")}</p>`;
    }).join("\n");
  };

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="text-sm text-gray-500 font-medium">Đang tải dữ liệu biên tập bài viết...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb / Action Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-150 shadow-sm">
        <Link 
          to="/blog" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-orange-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </Link>
        <span className="text-xs font-semibold text-gray-500 bg-gray-50 border px-3 py-1 rounded-full">
          {isEditMode ? "Chế độ: Chỉnh sửa bài viết" : "Chế độ: Tạo bài viết mới"}
        </span>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {errorMessage}
        </div>
      )}

      {/* Main Grid: Left editor, Right AI copilot */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        
        {/* LEFT COLUMN: Editorial Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Soạn thảo bài viết
            </h2>
            <p className="text-xs text-gray-500 mt-1">Viết nội dung bài viết quảng bá sản phẩm hoặc tin tức doanh nghiệp.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">
                Tiêu đề bài viết <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Nhập tiêu đề hấp dẫn cho bài viết..."
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Đường dẫn tĩnh (Slug) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="vi-du-duong-dan-tinh"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                className="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Product Link */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Liên kết Sản phẩm ERP</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : "")}
                className="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Không liên kết sản phẩm</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (SKU: {p.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Featured Image URL */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">Đường dẫn ảnh đại diện (Feature Image URL)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... hoặc link ảnh sản phẩm"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-md border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Image className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>

          {/* Markdown Content Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("write")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    activeTab === "write" 
                      ? "bg-slate-100 text-slate-800" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" /> Biên soạn
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    activeTab === "preview" 
                      ? "bg-slate-100 text-slate-800" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Xem trước Live
                </button>
              </div>

              {activeTab === "write" && (
                /* Markdown Editor Toolbar Helper */
                <div className="flex items-center gap-1 border-l pl-2 border-gray-200">
                  <button 
                    type="button" 
                    onClick={() => insertMarkdown("**", "**")}
                    className="p-1 hover:bg-slate-100 text-gray-500 rounded" 
                    title="Chữ đậm"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => insertMarkdown("*", "*")}
                    className="p-1 hover:bg-slate-100 text-gray-500 rounded" 
                    title="Chữ nghiêng"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => insertMarkdown("## ")}
                    className="p-1 hover:bg-slate-100 text-gray-500 rounded" 
                    title="Tiêu đề H2"
                  >
                    <Heading1 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => insertMarkdown("### ")}
                    className="p-1 hover:bg-slate-100 text-gray-500 rounded" 
                    title="Tiêu đề H3"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => insertMarkdown("- ")}
                    className="p-1 hover:bg-slate-100 text-gray-500 rounded" 
                    title="Danh sách"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => insertMarkdown("[", "](url)")}
                    className="p-1 hover:bg-slate-100 text-gray-500 rounded" 
                    title="Chèn Link"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {activeTab === "write" ? (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Hãy viết nội dung Markdown ở đây. Hoặc dùng AI Assistant bên phải để sinh nội dung tự động..."
                rows={15}
                className="w-full p-4 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 leading-relaxed"
              />
            ) : (
              <div 
                className="w-full min-h-[320px] p-4 rounded-xl border border-gray-200 bg-slate-50/50 overflow-y-auto prose prose-orange max-w-none"
                dangerouslySetInnerHTML={{ __html: getParsedPreviewHtml() }}
              />
            )}
          </div>

          {/* Post Summary (Snippet / SEO Meta Description) */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Mô tả tóm tắt ngắn (Summary / Snippet)</label>
            <textarea
              placeholder="Nhập 2-3 câu tóm tắt bài viết để hiển thị ngoài danh sách hoặc làm meta description..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              className="w-full p-2.5 rounded-md border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* SEO Metadata Sub-section */}
          <div className="border-t border-gray-100 pt-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-500" />
              Tùy chỉnh SEO (Meta Tags)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600">SEO Title (Khuyên dùng dưới 60 kí tự)</label>
                <input
                  type="text"
                  placeholder="Gợi ý: Trùng với tiêu đề bài viết"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600">SEO Meta Description (Khuyên dùng dưới 160 kí tự)</label>
                <textarea
                  placeholder="Mô tả nội dung bài viết khi hiển thị trên trang tìm kiếm Google..."
                  value={seoMetaDesc}
                  onChange={(e) => setSeoMetaDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-md border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600">Từ khóa SEO (Ngăn cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  placeholder="iPhone 15 pro, đánh giá iPhone 15, smartphone cao cấp"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t border-gray-150 pt-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-gray-700">Trạng thái bài viết:</label>
              <div className="flex gap-3">
                <label className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                  <input 
                    type="radio" 
                    name="status" 
                    value="draft"
                    checked={status === "draft"}
                    onChange={() => setStatus("draft")}
                    className="text-orange-500 focus:ring-orange-500"
                  />
                  Bản nháp
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                  <input 
                    type="radio" 
                    name="status" 
                    value="published"
                    checked={status === "published"}
                    onChange={() => setStatus("published")}
                    className="text-orange-500 focus:ring-orange-500"
                  />
                  Đã xuất bản
                </label>
              </div>
            </div>

            <Button 
              type="submit"
              disabled={submitLoading || aiLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1.5"
            >
              {submitLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Lưu bài viết
                </>
              )}
            </Button>
          </div>
        </form>

        {/* RIGHT COLUMN: AI Copilot Panel */}
        <div className="space-y-6">
          
          {/* AI Writer Box */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-30 pointer-events-none" />
            
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide">AI Marketing Assistant</h3>
                <span className="text-[9px] text-white/50 font-semibold uppercase tracking-widest">Powered by OpenAI</span>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Product selector for AI */}
              <div className="space-y-1">
                <label className="font-semibold text-white/80">1. Chọn sản phẩm PR</label>
                <select
                  value={aiProductId}
                  onChange={(e) => setAiProductId(e.target.value ? Number(e.target.value) : "")}
                  disabled={aiLoading}
                  className="w-full h-8 px-2 rounded bg-white/10 border border-white/10 text-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  <option value="" className="text-slate-800">-- Chọn sản phẩm --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} className="text-slate-800">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tone Selection */}
              <div className="space-y-1">
                <label className="font-semibold text-white/80">2. Giọng điệu (Tone)</label>
                <div className="grid grid-cols-2 gap-1.5 font-medium">
                  {[
                    { value: "professional", label: "Chuyên nghiệp" },
                    { value: "persuasive", label: "Thuyết phục" },
                    { value: "humorous", label: "Hài hước" },
                    { value: "curious", label: "Tò mò" },
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      disabled={aiLoading}
                      onClick={() => setAiTone(t.value as any)}
                      className={`py-1 rounded border text-[10px] transition-all ${
                        aiTone === t.value 
                          ? "bg-white text-indigo-950 border-white font-bold" 
                          : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Goal selection */}
              <div className="space-y-1">
                <label className="font-semibold text-white/80">3. Mục tiêu bài viết</label>
                <select
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value as any)}
                  disabled={aiLoading}
                  className="w-full h-8 px-2 rounded bg-white/10 border border-white/10 text-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  <option value="feature" className="text-slate-800">Giới thiệu tính năng/Giải pháp</option>
                  <option value="promotion" className="text-slate-800">Quảng bá chương trình khuyến mãi</option>
                  <option value="comparison" className="text-slate-800">So sánh đối thủ cùng tầm giá</option>
                </select>
              </div>

              {/* Additional notes */}
              <div className="space-y-1">
                <label className="font-semibold text-white/80">Ghi chú bổ sung (Từ khóa, yêu cầu...)</label>
                <textarea
                  placeholder="Ví dụ: Nhấn mạnh bảo hành 2 năm, tặng kèm tai nghe, phong cách trẻ trung..."
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  disabled={aiLoading}
                  rows={2}
                  className="w-full p-2 rounded bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              {/* AI action buttons */}
              <div className="grid grid-cols-1 gap-2 pt-2">
                <Button
                  type="button"
                  onClick={handleAIGenerateFull}
                  disabled={aiLoading || !aiProductId}
                  className="w-full h-9 bg-white text-indigo-950 hover:bg-indigo-50 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/40"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" /> Tạo trọn gói (JSON)
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={handleAIGenerateStream}
                  disabled={aiLoading || !aiProductId}
                  className="w-full h-9 bg-indigo-600 border border-indigo-500 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> AI đang gõ...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" /> Viết trực tiếp (Stream)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* SEO Checker checklist */}
          <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-1.5 border-b pb-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">AI SEO Analyst</h3>
            </div>
            
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2">
                <span className={`w-4 h-4 shrink-0 rounded-full flex items-center justify-center text-[10px] ${seoChecklist.titleLength ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                  ✓
                </span>
                <div>
                  <span className="font-semibold text-gray-700">Độ dài tiêu đề bài viết</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">Lý tưởng: 10 - 60 ký tự. Hiện tại: {title.length} ký tự.</p>
                </div>
              </li>

              <li className="flex items-start gap-2">
                <span className={`w-4 h-4 shrink-0 rounded-full flex items-center justify-center text-[10px] ${seoChecklist.wordCount ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                  ✓
                </span>
                <div>
                  <span className="font-semibold text-gray-700">Độ dài bài viết (Số từ)</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">Lý tưởng: trên 300 từ. Hiện tại: {content.split(/\s+/).filter(Boolean).length} từ.</p>
                </div>
              </li>

              <li className="flex items-start gap-2">
                <span className={`w-4 h-4 shrink-0 rounded-full flex items-center justify-center text-[10px] ${seoChecklist.headings ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                  ✓
                </span>
                <div>
                  <span className="font-semibold text-gray-700">Cấu trúc các Headings</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">Cần chứa các tiêu đề con (## H2 hoặc ### H3).</p>
                </div>
              </li>

              <li className="flex items-start gap-2">
                <span className={`w-4 h-4 shrink-0 rounded-full flex items-center justify-center text-[10px] ${seoChecklist.keywords ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                  ✓
                </span>
                <div>
                  <span className="font-semibold text-gray-700">Tối ưu hóa từ khóa SEO</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">Từ khóa đã thiết lập xuất hiện trong bài viết.</p>
                </div>
              </li>

              <li className="flex items-start gap-2">
                <span className={`w-4 h-4 shrink-0 rounded-full flex items-center justify-center text-[10px] ${seoChecklist.metaDescLength ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                  ✓
                </span>
                <div>
                  <span className="font-semibold text-gray-700">Độ dài Meta Description</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">Lý tưởng: 50 - 160 ký tự. Hiện tại: {seoMetaDesc.length} ký tự.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
