import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { ArrowLeft, Save, FileSpreadsheet, Calendar, User, FileText } from "lucide-react";
import { RootState, AppDispatch } from "../../../../store/store";
import { purchasePriceListApi } from "../../api/purchasePriceList.api";
import { loadPartners } from "@/features/partner/store/partner.thunks";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../../components/ui/Select";

export default function PriceListCreatePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const partners = useSelector((s: RootState) => s.partners);

  useEffect(() => {
    dispatch(loadPartners({ type: "supplier" }));
    const randomNumber = Math.floor(Math.random() * 9000 + 1000);
    setCode(`PL-${new Date().getFullYear()}-${randomNumber}`);
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Tên bảng giá là bắt buộc");
    
    setIsSubmitting(true);
    try {
      const data = await purchasePriceListApi.create({
        name: name.trim(),
        code: code.trim() || undefined,
        supplier_id: supplierId ? Number(supplierId) : null,
        start_date: startDate || null,
        end_date: endDate || null,
        notes: notes.trim() || null,
        is_active: true,
      } as any);

      toast.success("Tạo bảng giá mua hàng thành công");
      navigate(`/purchase/price-lists/${data.id}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Tạo bảng giá thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      {/* Sticky Header */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/purchase/price-lists")}
            className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 shadow-sm transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Tạo bảng giá mới</h1>
            <p className="text-xs text-gray-400">Thiết lập thông tin cơ bản cho chính sách giá mới</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-orange-500" />
          <h2 className="text-sm font-semibold text-gray-700">Thông tin bảng giá</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tên bảng giá */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tên bảng giá <span className="text-red-400 font-normal">*</span>
              </label>
              <Input
                placeholder="Ví dụ: Bảng giá phụ tùng chính 2026"
                value={name}
                onChange={(val) => setName(val)}
                className="h-10 text-sm rounded-lg"
                disabled={isSubmitting}
              />
            </div>

            {/* Mã bảng giá */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Mã bảng giá (Tùy chọn)
              </label>
              <Input
                placeholder="PL-2026-XXXX"
                value={code}
                onChange={(val) => setCode(val)}
                className="h-10 text-sm font-mono rounded-lg"
                disabled={isSubmitting}
              />
            </div>

            {/* Nhà cung cấp */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Nhà cung cấp
              </label>
              <Select
                value={supplierId}
                onValueChange={supplierId => setSupplierId(supplierId)}
              >
                <SelectTrigger className="h-10 text-sm rounded-lg">
                  <SelectValue placeholder="Chung (Áp dụng cho tất cả nhà cung cấp)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Chung (Áp dụng cho tất cả nhà cung cấp)</SelectItem>
                  {(partners as any)?.items?.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="block text-[10px] text-gray-400">
                Để trống nếu bảng giá này áp dụng chung cho tất cả nhà cung cấp
              </span>
            </div>

            {/* Thời gian hiệu lực */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ngày bắt đầu
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(val) => setStartDate(val)}
                  className="h-10 text-sm rounded-lg"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ngày kết thúc
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(val) => setEndDate(val)}
                  className="h-10 text-sm rounded-lg"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Ghi chú
            </label>
            <Textarea
              placeholder="Nhập mô tả chi tiết, điều khoản thanh toán hoặc điều kiện đặc biệt..."
              value={notes}
              onChange={(val) => setNotes(val)}
              rows={4}
              className="text-sm rounded-lg resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/purchase/price-lists")}
              disabled={isSubmitting}
              className="px-5 h-10 rounded-lg text-sm font-medium"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 h-10 rounded-lg text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Lưu & Tiếp tục
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
