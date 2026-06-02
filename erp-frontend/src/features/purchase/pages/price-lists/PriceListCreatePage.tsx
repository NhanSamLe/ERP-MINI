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
    if (!name.trim()) return toast.error("Price list name is required");
    
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

      toast.success("Purchase price list created successfully");
      navigate(`/purchase/price-lists/${data.id}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create price list");
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
            <h1 className="text-lg font-semibold text-gray-900">Create New Price List</h1>
            <p className="text-xs text-gray-400">Establish basic information for the new price policy</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-orange-500" />
          <h2 className="text-sm font-semibold text-gray-700">Price List Information</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tên bảng giá */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Price List Name <span className="text-red-400 font-normal">*</span>
              </label>
              <Input
                placeholder="e.g. Master Parts Price List 2026"
                value={name}
                onChange={(val) => setName(val)}
                className="h-10 text-sm rounded-lg"
                disabled={isSubmitting}
              />
            </div>

            {/* Mã bảng giá */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Price List Code (Optional)
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
                Supplier
              </label>
              <Select
                value={supplierId}
                onValueChange={supplierId => setSupplierId(supplierId)}
              >
                <SelectTrigger className="h-10 text-sm rounded-lg">
                  <SelectValue placeholder="Generic (Applies to all suppliers)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Generic (Applies to all suppliers)</SelectItem>
                  {(partners as any)?.items?.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="block text-[10px] text-gray-400">
                Leave empty if this price list applies generically to all suppliers
              </span>
            </div>

            {/* Thời gian hiệu lực */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Start Date
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
                  End Date
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
              Notes
            </label>
            <Textarea
              placeholder="Enter detailed description, payment terms, or special conditions..."
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 h-10 rounded-lg text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save & Continue
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
