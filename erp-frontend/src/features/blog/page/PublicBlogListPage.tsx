import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  FileText, 
  Calendar, 
  User, 
  ArrowRight, 
  Sparkles, 
  ShoppingBag,
  Menu,
  X,
  Loader2
} from "lucide-react";
import { getBlogPosts } from "../api/blog.api";
import { BlogPost } from "../dto/blog.dto";
import { Badge } from "../../../components/ui/badge";

export default function PublicBlogListPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Lấy tất cả bài viết, chỉ lọc hiển thị bài đã xuất bản (published)
        const allPosts = await getBlogPosts({ status: "published" });
        setPosts(allPosts);
      } catch (err: any) {
        console.error("Error loading public blogs:", err);
        setError("Unable to load news list at this time. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicPosts();
  }, []);

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

      {/* Hero Banner Section */}
      <section className="pt-28 pb-12 bg-gradient-to-br from-blue-900 to-indigo-950 text-white text-center px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-none py-1 px-3">
            News & Events
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Blog & Business Insights
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            Discover in-depth articles on business process optimization, 
            AI applications in enterprise management, and the latest updates from ERP System.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <span className="text-sm text-slate-500 font-medium">Loading articles...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center max-w-xl mx-auto space-y-4 shadow-sm">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">No public articles available yet</h3>
            <p className="text-xs text-gray-500">
              Knowledge-sharing articles are being prepared by our editorial team. Please check back later!
            </p>
            <Link 
              to="/" 
              className="inline-flex items-center gap-1 text-xs font-bold text-orange-500 hover:underline"
            >
              Back to Homepage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link 
                key={post.id}
                to={`/public/blog/${post.slug}`}
                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all flex flex-col shadow-sm"
              >
                {/* Feature Image */}
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
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {post.product && (
                      <span className="inline-flex items-center text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded border border-orange-100">
                        <ShoppingBag className="w-3 h-3 mr-1" /> PR: {post.product.name}
                      </span>
                    )}

                    <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-600 line-clamp-2 transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                      {post.summary || "Read the detailed article here."}
                    </p>
                  </div>

                  {/* Metadata Footer */}
                  <div className="border-t border-gray-100 pt-4 mt-5 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-gray-300" />
                      <span>{post.author?.full_name || "Editorial Team"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-300" />
                      <span>{new Date(post.created_at).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </main>

      {/* Landing Page Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8 mt-12">
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
