import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  FileText, 
  Calendar, 
  User, 
  Edit3, 
  Eye, 
  Trash2, 
  Sparkles, 
  ArrowRight,
  Loader2
} from "lucide-react";
import { getBlogPosts, deleteBlogPost } from "../api/blog.api";
import { BlogPost } from "../dto/blog.dto";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/badge";

export default function BlogListPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: any = {};
      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }
      if (searchTerm.trim()) {
        filters.search = searchTerm;
      }
      const data = await getBlogPosts(filters);
      setPosts(data);
    } catch (err: any) {
      console.error("Error fetching blog posts:", err);
      setError("Không thể tải danh sách bài viết. Vui lòng kiểm tra kết nối API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.")) {
      return;
    }

    try {
      await deleteBlogPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error("Error deleting post:", err);
      alert(err.response?.data?.error || "Không thể xóa bài viết.");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-orange-500" />
            AI Marketing & PR Blog
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý và soạn thảo các bài viết giới thiệu sản phẩm bằng trí tuệ nhân tạo (AI).
          </p>
        </div>
        <Button 
          onClick={() => navigate("/blog/create")}
          className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Viết bài mới
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-md border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          <button 
            type="submit"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Bản nháp</option>
            <option value="published">Đã xuất bản</option>
          </select>
          <Button 
            onClick={fetchPosts}
            variant="outline"
            className="h-9 text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            Lọc
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <span className="text-sm text-gray-500 font-medium">Đang tải danh sách bài viết...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center">
            <FileText className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Chưa có bài viết nào</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md">
              Hãy bắt đầu viết bài PR sản phẩm đầu tiên của bạn bằng cách nhấn nút "Viết bài mới" phía trên.
            </p>
          </div>
          <Button 
            onClick={() => navigate("/blog/create")}
            className="bg-orange-500 hover:bg-orange-600 text-white mt-2"
          >
            Bắt đầu soạn thảo
          </Button>
        </div>
      ) : (
        /* Blog Post Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link 
              key={post.id} 
              to={`/blog/${post.slug}`}
              className="group bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm hover:shadow-md hover:border-orange-200 transition-all flex flex-col"
            >
              {/* Feature Image / Placeholder */}
              <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                {post.image_url ? (
                  <img 
                    src={post.image_url} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-orange-300" />
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className={
                    post.status === "published"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-gray-100 text-gray-700 border border-gray-200"
                  }>
                    {post.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                  </Badge>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  {/* Linked Product Name */}
                  {post.product && (
                    <div className="mb-2.5">
                      <span className="inline-flex items-center text-[11px] font-semibold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md border border-orange-100">
                        Sản phẩm: {post.product.name}
                      </span>
                    </div>
                  )}

                  <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-600 line-clamp-2 transition-colors mb-2">
                    {post.title}
                  </h3>

                  <p className="text-xs text-gray-500 line-clamp-3 mb-4 leading-relaxed">
                    {post.summary || "Chưa có đoạn mô tả ngắn."}
                  </p>
                </div>

                {/* Footer Info */}
                <div className="border-t border-gray-100 pt-4 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate max-w-[80px]">
                      {post.author ? (post.author.full_name || post.author.username) : "Người dùng"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{new Date(post.created_at).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="bg-slate-50 border-t border-gray-100 px-5 py-3 flex justify-between items-center text-xs">
                <span className="text-orange-500 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Đọc tiếp <ArrowRight className="w-3 h-3" />
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/blog/edit/${post.id}`);
                    }}
                    className="p-1 text-gray-400 hover:text-orange-500 transition-colors"
                    title="Chỉnh sửa bài viết"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(post.id, e)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Xóa bài viết"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
