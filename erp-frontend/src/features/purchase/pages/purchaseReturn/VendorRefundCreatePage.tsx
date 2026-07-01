import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Banknote } from "lucide-react";
import { AppDispatch, RootState } from "../../../../store/store";
import { createVendorRefundThunk } from "../../store/purchaseReturn";
import { loadPartners } from "@/features/partner/store/partner.thunks";
import { StandardFormLayout } from "../../../../components/layout/StandardFormLayout";
import { FormSection } from "../../../../components/layout/FormSection";
import { getErrorMessage } from "@/utils/ErrorHelper";

const METHOD_OPTIONS = [
  { value: "bank", label: "Chuyển khoản ngân hàng" },
  { value: "cash", label: "Tiền mặt" },
  { value: "transfer", label: "Chuyển khoản" },
];

export default function VendorRefundCreatePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();

  const partners = useSelector((s: RootState) => s.partners);
  const user = useSelector((s: RootState) => s.auth.user);

  const [supplierId, setSupplierId] = useState<number | "">(
    searchParams.get("supplier_id")
      ? Number(searchParams.get("supplier_id"))
      : "",
  );
  const [debitNoteId, setDebitNoteId] = useState<number | "">(
    searchParams.get("debit_note_id")
      ? Number(searchParams.get("debit_note_id"))
      : "",
  );
  const [refundDate, setRefundDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState<"bank" | "cash" | "transfer">("bank");
  const [transactionReference, setTransactionReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [debitNotes, setDebitNotes] = useState<any[]>([]);
  const [loadingDebitNotes, setLoadingDebitNotes] = useState(false);

  useEffect(() => {
    dispatch(loadPartners({ type: "supplier" }));
  }, [dispatch]);

  // Load initial debit note from query param
  useEffect(() => {
    const queryDnId = searchParams.get("debit_note_id");
    if (queryDnId) {
      const loadInitialDebitNote = async () => {
        try {
          const { apDebitNoteApi } = await import("../../api/purchaseReturn.api");
          const dn = await apDebitNoteApi.getById(Number(queryDnId));
          if (dn) {
            setSupplierId(dn.supplier_id);
            setDebitNoteId(dn.id);
            setAmount(Number(dn.total_after_tax));
          }
        } catch (e) {
          toast.error("Không thể tải thông tin Thẻ nợ liên kết");
        }
      };
      loadInitialDebitNote();
    }
  }, [searchParams]);

  // Fetch eligible debit notes when supplier changes
  useEffect(() => {
    if (supplierId) {
      const fetchEligibleDebitNotes = async () => {
        try {
          setLoadingDebitNotes(true);
          const { apDebitNoteApi } = await import("../../api/purchaseReturn.api");
          const dns = await apDebitNoteApi.getAll({
            supplier_id: supplierId,
            status: "posted",
          });
          setDebitNotes(dns);
        } catch (e) {
          toast.error("Không thể tải danh sách Thẻ nợ");
        } finally {
          setLoadingDebitNotes(false);
        }
      };
      fetchEligibleDebitNotes();
    } else {
      setDebitNotes([]);
    }
  }, [supplierId]);

  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error("Vui lòng chọn nhà cung cấp");
      return;
    }
    if (!refundDate) {
      toast.error("Vui lòng chọn ngày hoàn tiền");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Số tiền phải lớn hơn 0");
      return;
    }

    setSubmitting(true);
    try {
      const refund = await dispatch(
        createVendorRefundThunk({
          supplier_id: supplierId as number,
          debit_note_id: debitNoteId || null,
          refund_date: refundDate,
          amount: Number(amount),
          method,
          transaction_reference: transactionReference.trim() || null,
          notes: notes.trim() || null,
        } as any),
      ).unwrap();
      toast.success(`Đã tạo Phiếu hoàn tiền từ NCC ${refund.refund_no}`);
      navigate(`/purchase/vendor-refunds/${refund.id}`);
    } catch (e: any) {
      toast.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StandardFormLayout
      title="Tạo Phiếu hoàn tiền từ NCC mới"
      actions={[
        {
          label: "Hủy bỏ",
          variant: "outline",
          onClick: () => navigate("/purchase/vendor-refunds"),
        },
        {
          label: "Tạo Phiếu hoàn tiền",
          variant: "primary",
          onClick: handleSubmit,
          isLoading: submitting,
        },
      ]}
    >
      <FormSection
        title="Chi tiết Hoàn tiền"
        icon={<Banknote className="w-4 h-4" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nhà cung cấp <span className="text-red-500">*</span>
            </label>
            <select
              value={supplierId}
              onChange={(e) => {
                setSupplierId(e.target.value ? Number(e.target.value) : "");
                setDebitNoteId("");
              }}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">— Chọn nhà cung cấp —</option>
              {partners.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Thẻ nợ liên kết (Giấy báo nợ)
            </label>
            <select
              value={debitNoteId}
              onChange={(e) => {
                const dnId = e.target.value ? Number(e.target.value) : "";
                setDebitNoteId(dnId);
                if (dnId) {
                  const selectedDn = debitNotes.find((d) => d.id === dnId);
                  if (selectedDn) {
                    setAmount(Number(selectedDn.total_after_tax));
                  }
                }
              }}
              disabled={loadingDebitNotes || !supplierId}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
            >
              <option value="">— Chọn Thẻ nợ (Chỉ hiển thị Thẻ nợ chưa hoàn tiền) —</option>
              {debitNotes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.debit_note_no} ({Number(d.total_after_tax).toLocaleString("vi-VN")} đ) - Ngày {new Date(d.debit_note_date).toLocaleDateString("vi-VN")}
                </option>
              ))}
            </select>
            {loadingDebitNotes && <p className="text-[10px] text-gray-400 mt-1">Đang tải danh sách thẻ nợ...</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Ngày hoàn tiền <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={refundDate}
              onChange={(e) => setRefundDate(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Số tiền <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value ? Number(e.target.value) : "")
              }
              placeholder="0"
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Phương thức thanh toán <span className="text-red-500">*</span>
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {METHOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Mã giao dịch
            </label>
            <input
              type="text"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              placeholder="Mã tham chiếu ngân hàng / số séc..."
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Chi nhánh
            </label>
            <div className="h-9 px-3 flex items-center text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-600">
              {user?.branch?.name ?? "—"}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Ghi chú
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chú thêm..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </FormSection>
    </StandardFormLayout>
  );
}
