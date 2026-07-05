import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ShieldCheck, ShieldAlert, Search, Loader2, ArrowLeft, Calendar, User, FileText, DollarSign, Building, Mail } from "lucide-react";

export default function PublicVerifySignaturePage() {
  const { hash } = useParams<{ hash: string }>();
  const navigate = useNavigate();

  const [inputHash, setInputHash] = useState(hash || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [searched, setSearched] = useState(false);
  const [confirmingPO, setConfirmingPO] = useState(false);

  const getApiUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:8888/api";
    }
    return `${window.location.origin}/api`;
  };

  const handleConfirmPO = async () => {
    if (!hash) return;
    setConfirmingPO(true);
    try {
      const response = await axios.post(`${getApiUrl()}/public/verify-signature/${hash}/confirm-po`);
      if (response.data?.success) {
        setResult((prev: any) => ({
          ...prev,
          document: {
            ...prev.document,
            status: "supplier_accepted",
          },
        }));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể xác nhận đơn đặt hàng.");
    } finally {
      setConfirmingPO(false);
    }
  };

  const fetchVerify = async (hashValue: string) => {
    if (!hashValue.trim()) return;
    setLoading(true);
    setErrorMsg("");
    setResult(null);
    setSearched(true);

    try {
      // Gọi API công cộng từ Backend
      const response = await axios.get(`${getApiUrl()}/public/verify-signature/${hashValue}`);
      if (response.data?.success && response.data?.data) {
        setResult(response.data.data);
      } else {
        setErrorMsg("Mã băm không tồn tại hoặc tài liệu đã bị sửa đổi.");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Mã xác thực chữ ký không hợp lệ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hash) {
      setInputHash(hash);
      fetchVerify(hash);
    }
  }, [hash]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputHash.trim()) {
      navigate(`/public/verify/${inputHash.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-orange-500 selection:text-white">
      {/* Background Decorative Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-900 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/30">
              E
            </div>
            <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-orange-400 to-amber-200 bg-clip-text text-transparent">
              ERP-MINI VERIFICATION
            </span>
          </div>
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Vào hệ thống
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-6 py-12 flex flex-col justify-center gap-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Tra cứu & Xác thực Chữ ký số
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Hệ thống kiểm tra tính toàn vẹn của tài liệu thương mại điện tử bằng thuật toán băm bảo mật SHA-256.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="w-full">
          <div className="relative flex items-center bg-slate-900/60 border border-slate-800 focus-within:border-orange-500/50 rounded-2xl p-1.5 transition shadow-2xl backdrop-blur-md">
            <Search className="w-5 h-5 text-slate-500 ml-4 shrink-0" />
            <input
              type="text"
              placeholder="Nhập mã băm SHA-256 của chữ ký..."
              value={inputHash}
              onChange={(e) => setInputHash(e.target.value)}
              className="w-full bg-transparent border-0 outline-none text-slate-200 placeholder-slate-500 text-sm px-3 py-2.5"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition shadow-md shadow-orange-500/10 flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Tra cứu"
              )}
            </button>
          </div>
        </form>

        {/* Results display */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 bg-slate-900/20 rounded-3xl border border-slate-900/50 backdrop-blur-md">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            <p className="text-slate-400 text-sm font-medium">Đang truy vấn chuỗi khối xác thực...</p>
          </div>
        )}

        {!loading && searched && errorMsg && (
          <div className="p-8 rounded-3xl bg-red-950/20 border border-red-900/30 backdrop-blur-md flex flex-col items-center text-center gap-4 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 shadow-lg shadow-red-500/5">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-red-500">Xác thực thất bại!</h3>
              <p className="text-slate-400 text-sm max-w-md">
                {errorMsg} Đơn hàng hoặc hóa đơn này có dấu hiệu bị giả mạo hoặc chưa từng được ký số hợp lệ trên hệ thống.
              </p>
            </div>
          </div>
        )}

        {!loading && searched && result && (
          <div className="space-y-6 animate-scale-up">
            {/* Success Banner */}
            <div className="p-6 rounded-3xl bg-emerald-950/20 border border-emerald-900/30 backdrop-blur-md flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base text-emerald-500">Chữ ký hợp lệ và toàn vẹn!</h3>
                <p className="text-slate-400 text-xs mt-0.5 truncate">
                  Tài liệu gốc trùng khớp 100% với dữ liệu chứng thực hệ thống.
                </p>
              </div>
            </div>

            {result.document_type === "purchase_order" && result.document?.status === "sent" && (
              <div className="p-6 rounded-3xl bg-orange-950/20 border border-orange-900/30 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-orange-400">Xác nhận đơn đặt hàng</h4>
                  <p className="text-xs text-slate-400">
                    Vui lòng bấm nút bên phải để xác nhận bạn đồng ý cung cấp hàng theo các điều khoản trong đơn hàng này.
                  </p>
                </div>
                <button
                  onClick={handleConfirmPO}
                  disabled={confirmingPO}
                  className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-orange-500/10 shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {confirmingPO ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Xác nhận Đồng ý"
                  )}
                </button>
              </div>
            )}

            {/* Verification Detail Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Document info */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/50 pb-2">
                  Thông tin tài liệu
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-400" /> Mã số:</span>
                    <span className="font-bold text-slate-200">{result.document?.document_no}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-400" /> Loại:</span>
                    <span className="font-semibold text-orange-400">{result.document?.document_type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5"><Building className="w-4 h-4 text-slate-400" /> Đối tác:</span>
                    <span className="font-semibold text-slate-200 text-right truncate max-w-[150px]">{result.document?.supplier_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-slate-400" /> Tổng tiền:</span>
                    <span className="font-bold text-emerald-400">{Number(result.document?.total_amount).toLocaleString("vi-VN")} VND</span>
                  </div>
                  {result.document?.status && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-slate-400" /> Trạng thái:</span>
                      <span className={`font-bold ${result.document.status === "supplier_accepted" ? "text-indigo-400" : "text-orange-400"}`}>
                        {result.document.status === "sent" ? "Đã gửi NCC" : result.document.status === "supplier_accepted" ? "NCC đã xác nhận" : result.document.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Signer info */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/50 pb-2">
                  Thông tin chứng thư ký số
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" /> Người ký:</span>
                    <span className="font-bold text-slate-200">{result.signer_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" /> Email:</span>
                    <span className="text-slate-300 text-xs truncate max-w-[160px]">{result.signer_email}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" /> Thời gian ký:</span>
                    <span className="text-slate-300 text-xs">{new Date(result.signed_at).toLocaleString("vi-VN")}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-slate-400" /> IP Ký:</span>
                    <span className="font-mono text-slate-400 text-xs">{result.signer_ip || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hand signature image */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 justify-center">
              <div className="text-center md:text-left space-y-1">
                <h4 className="text-sm font-bold text-slate-200">Bản nét chữ ký tay chứng thực</h4>
                <p className="text-xs text-slate-500">Chữ ký tay gốc được vẽ trực tiếp bởi người ký trong phiên làm việc.</p>
              </div>
              <div className="bg-white border border-slate-800 p-4 rounded-2xl flex items-center justify-center max-w-[240px] shadow-inner">
                <img
                  src={result.signature_image}
                  alt="Drawn Signature"
                  className="h-20 object-contain"
                />
              </div>
            </div>

            {/* Hash breakdown */}
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 text-[10px] space-y-1">
              <p className="font-semibold text-slate-400">Mã băm SHA-256 chống giả mạo:</p>
              <p className="font-mono text-orange-500 break-all select-all">{result.hash_value}</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/40 py-6 text-center text-xs text-slate-600">
        <p>© 2026 ERP-MINI. Hệ thống ký duyệt và xác thực hóa đơn đầu vào.</p>
      </footer>
    </div>
  );
}
