import React, { useEffect, useState } from "react";
import { X, Plus, Trash2, Save, Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { fetchGlAccounts } from "../service/glAccount.service";
import { GlAccountDTO } from "../dto/glAccount.dto";
import { glEntryApi } from "../api/glEntry.api";

interface GlEntryLineInput {
  account_id: number;
  debit: number;
  credit: number;
}

interface GlEntryFormModalProps {
  open: boolean;
  journalId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GlEntryFormModal({
  open,
  journalId,
  onClose,
  onSuccess,
}: GlEntryFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<GlAccountDTO[]>([]);
  const [entryDate, setEntryDate] = useState(() => {
    return new Date().toISOString().substring(0, 10);
  });
  const [memo, setMemo] = useState("");
  const [referenceType, setReferenceType] = useState<"" | "ar_invoice" | "ap_invoice">("");
  const [referenceId, setReferenceId] = useState<number | "">("");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [lines, setLines] = useState<GlEntryLineInput[]>([
    { account_id: 0, debit: 0, credit: 0 },
    { account_id: 0, debit: 0, credit: 0 },
  ]);

  // Tải danh sách tài khoản kế toán khi mở modal
  useEffect(() => {
    if (!open) return;
    const loadAccounts = async () => {
      try {
        const rows = await fetchGlAccounts();
        setAccounts(rows);
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to load chart of accounts");
      }
    };
    loadAccounts();
  }, [open]);

  // Tải danh sách hóa đơn theo loại tham chiếu
  useEffect(() => {
    if (!open || !referenceType) {
      setInvoices([]);
      setReferenceId("");
      return;
    }
    const loadInvoices = async () => {
      try {
        setInvoicesLoading(true);
        setReferenceId("");
        if (referenceType === "ar_invoice") {
          const res = await glEntryApi.getArInvoices();
          setInvoices(res.data.data || []);
        } else if (referenceType === "ap_invoice") {
          const res = await glEntryApi.getApInvoices();
          setInvoices(res.data || []);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load invoices");
      } finally {
        setInvoicesLoading(false);
      }
    };
    loadInvoices();
  }, [open, referenceType]);

  // Reset form khi mở/đóng modal
  useEffect(() => {
    if (open) {
      setEntryDate(new Date().toISOString().substring(0, 10));
      setMemo("");
      setReferenceType("");
      setReferenceId("");
      setLines([
        { account_id: 0, debit: 0, credit: 0 },
        { account_id: 0, debit: 0, credit: 0 },
      ]);
    }
  }, [open]);

  if (!open) return null;

  // Thêm dòng định khoản mới
  const handleAddLine = () => {
    setLines([...lines, { account_id: 0, debit: 0, credit: 0 }]);
  };

  // Xóa dòng định khoản
  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) {
      toast.warn("A journal entry requires at least 2 entry lines.");
      return;
    }
    const newLines = lines.filter((_, idx) => idx !== index);
    setLines(newLines);
  };

  // Cập nhật thông tin dòng
  const handleUpdateLine = (
    index: number,
    field: keyof GlEntryLineInput,
    value: number
  ) => {
    const newLines = [...lines];
    newLines[index] = {
      ...newLines[index],
      [field]: value,
    };

    // Nếu người dùng nhập Nợ lớn hơn 0, tự động đặt Có về 0 và ngược lại
    if (field === "debit" && value > 0) {
      newLines[index].credit = 0;
    } else if (field === "credit" && value > 0) {
      newLines[index].debit = 0;
    }

    setLines(newLines);
  };

  // Tính toán tổng số tiền
  const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  const difference = totalDebit - totalCredit;
  const isBalanced = Math.abs(difference) < 0.01;

  // Xử lý gửi Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isBalanced) {
      toast.error("Unbalanced entry! Total Debit must equal total Credit.");
      return;
    }

    // Kiểm tra đã điền tài khoản kế toán chưa
    const hasEmptyAccount = lines.some((l) => l.account_id === 0);
    if (hasEmptyAccount) {
      toast.error("Please select an account for all entry lines.");
      return;
    }

    // Kiểm tra số tiền hợp lệ
    const hasZeroAmount = lines.some((l) => (l.debit || 0) === 0 && (l.credit || 0) === 0);
    if (hasZeroAmount) {
      toast.error("Each line must have a Debit or Credit amount greater than 0.");
      return;
    }

    try {
      setLoading(true);
      await glEntryApi.create({
        journal_id: journalId,
        entry_date: entryDate,
        memo: memo.trim(),
        reference_type: referenceType || undefined,
        reference_id: referenceId || undefined,
        lines: lines.map((l) => ({
          account_id: l.account_id,
          debit: l.debit,
          credit: l.credit,
        })),
      });

      toast.success("Manual journal entry created successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to create journal entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-bold text-slate-950">Create Manual Journal Entry</h3>
            <p className="text-xs text-slate-500 mt-1">Post directly into General Ledger</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
          
          {/* Header Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Posting Date *</label>
              <input
                type="date"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reference Type</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-slate-800"
                value={referenceType}
                onChange={(e) => setReferenceType(e.target.value as any)}
              >
                <option value="">-- None --</option>
                <option value="ar_invoice">AR Invoice (Sales)</option>
                <option value="ap_invoice">AP Invoice (Purchase)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Linked Document</label>
              <select
                disabled={!referenceType || invoicesLoading}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">{invoicesLoading ? "Loading..." : "-- Select Document --"}</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_no} ({Number(inv.total_after_tax).toLocaleString("vi-VN")}đ - {inv.customer?.name || inv.supplier?.name || "N/A"})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Memo / Description</label>
              <input
                type="text"
                placeholder="Enter memo/description..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>
          </div>

          {/* Details Table */}
          <div className="flex-1 flex flex-col min-h-[250px]">
            <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col flex-1">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 font-semibold text-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left w-12">#</th>
                      <th className="px-4 py-3 text-left">Account Code *</th>
                      <th className="px-4 py-3 text-right w-44">Debit</th>
                      <th className="px-4 py-3 text-right w-44">Credit</th>
                      <th className="px-4 py-3 text-center w-16">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-500 font-medium">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <select
                            required
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800"
                            value={line.account_id}
                            onChange={(e) =>
                              handleUpdateLine(idx, "account_id", Number(e.target.value))
                            }
                          >
                            <option value={0}>-- Select Account --</option>
                            {accounts.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.code} - {acc.name} ({acc.type})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            placeholder="0"
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-right font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            value={line.debit || ""}
                            onChange={(e) =>
                              handleUpdateLine(idx, "debit", parseFloat(e.target.value) || 0)
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            placeholder="0"
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-right font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            value={line.credit || ""}
                            onChange={(e) =>
                              handleUpdateLine(idx, "credit", parseFloat(e.target.value) || 0)
                            }
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="p-1 rounded text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add row bar */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-start">
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Entry Line
                </button>
              </div>
            </div>
          </div>

          {/* Balance Auditor summary */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center p-4 border border-slate-200 rounded-xl bg-slate-50 gap-4 mt-auto">
            <div className="flex items-center gap-2">
              {isBalanced ? (
                <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-sm px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span>✓ Balanced Entry</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-600 font-semibold text-sm px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100 animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  <span>Difference: {difference.toLocaleString("vi-VN")}đ</span>
                </div>
              )}
            </div>

            <div className="flex gap-6 text-sm text-slate-700 font-medium">
              <div>
                Total Debit: <span className="font-bold text-slate-900 font-mono text-base">{totalDebit.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="border-l border-slate-300 pl-6">
                Total Credit: <span className="font-bold text-slate-900 font-mono text-base">{totalCredit.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isBalanced || lines.length < 2}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/10 hover:shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4.5 h-4.5" />
                  Save Entry
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
