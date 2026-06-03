import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCcw, AlertTriangle, Download, Calendar, FileText, CheckCircle2, Clock, Check, RefreshCw } from "lucide-react";
import { glEntryApi } from "../api/glEntry.api";
import { exportExcelReport } from "../../../utils/excel/exportExcelReport";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { toast } from "react-toastify";

type GlEntryLineDTO = {
  id: number;
  account_id: number;
  partner_id?: number;
  debit: number | string;
  credit: number | string;
  account?: { id: number; code: string; name: string };
  partner?: { id: number; code?: string; name: string };
};

type GlEntryDetailDTO = {
  id: number;
  journal_id: number;
  entry_no: string;
  entry_date: string;
  memo?: string;
  status: "draft" | "posted";
  journal?: { id: number; code: string; name: string };
  lines: GlEntryLineDTO[];
  reference_type?: string;
  reference_id?: number;
};

const GlEntryDetailPage: React.FC = () => {
  const { entryId } = useParams();
  const id = Number(entryId);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState<GlEntryDetailDTO | null>(null);

  const { user } = useSelector((state: RootState) => state.auth);
  const roleCode = typeof user?.role === "object" ? user.role.code : user?.role;
  const isChiefOrAdmin = roleCode === "CHACC" || roleCode === "ADMIN";

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await glEntryApi.getDetail(id);
      setRow(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      setLoading(true);
      await glEntryApi.updateStatus(id, "posted");
      toast.success("Entry approved and posted successfully!");
      load();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to approve entry");
    } finally {
      setLoading(false);
    }
  };

  const handleUnpost = async () => {
    if (!id) return;
    try {
      setLoading(true);
      await glEntryApi.updateStatus(id, "draft");
      toast.success("Entry unposted successfully!");
      load();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to unpost entry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const totals = useMemo(() => {
    const lines = row?.lines || [];
    const totalDebit = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
    const diff = Math.abs(totalDebit - totalCredit);
    return { totalDebit, totalCredit, diff };
  }, [row]);

  const exportExcel = () => {
    if (!row) return;
    exportExcelReport<any>({
      title: "ENTRY DETAILS",
      subtitle: `${row.entry_no} - ${row.journal?.code ?? ""} ${row.journal?.name ?? ""}`,
      meta: {
        "Entry Date": row.entry_date?.slice(0, 10),
        "Status": row.status,
        "Total Debit": totals.totalDebit.toLocaleString("vi-VN"),
        "Total Credit": totals.totalCredit.toLocaleString("vi-VN"),
      },
      columns: [
        { header: "Account Code", key: "account", width: 22 },
        { header: "Account Name", key: "account_name", width: 35 },
        { header: "Partner", key: "partner", width: 28 },
        { header: "Debit", key: "debit", width: 18, align: "right" },
        { header: "Credit", key: "credit", width: 18, align: "right" },
      ],
      data: (row.lines || []).map((l) => ({
        account: l.account?.code ?? `#${l.account_id}`,
        account_name: l.account?.name ?? "—",
        partner: l.partner?.name ?? "—",
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
      })),
      fileName: `GlEntry_${row.entry_no}.xlsx`,
    });
  };

  if (!row && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCcw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Loading data...</p>
        </div>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Entry Not Found</h2>
          <p className="text-slate-600 mb-6">This entry may have been deleted or does not exist</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-slate-900">{row.entry_no}</h1>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    row.status === "posted" 
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                      : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {row.status === "posted" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Posted
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        Draft
                      </>
                    )}
                  </span>
                </div>
                
                 <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                  <div className="inline-flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{row.journal?.code}</span>
                    <span>-</span>
                    <span>{row.journal?.name}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{new Date(row.entry_date).toLocaleDateString('vi-VN')}</span>
                  </div>
                  {row.reference_type && (
                    <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-semibold text-xs">
                      <span>Reference: {row.reference_type === "ar_invoice" || row.reference_type === "AR_INVOICE" ? "AR Invoice" : "AP Invoice"} (ID: #{row.reference_id})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {row.status === "draft" && isChiefOrAdmin && (
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Post</span>
                </button>
              )}
              {row.status === "posted" && isChiefOrAdmin && (
                <button
                  onClick={handleUnpost}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-500 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Unpost</span>
                </button>
              )}
              <button
                onClick={exportExcel}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-400 transition-all"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Excel</span>
              </button>
              <button
                onClick={load}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Reload</span>
              </button>
            </div>
          </div>
        </div>

        {/* Memo Section */}
        {row.memo && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Memo</p>
                <p className="text-sm text-blue-800">{row.memo}</p>
              </div>
            </div>
          </div>
        )}

        {/* Balance Warning */}
        {totals.diff > 0.0001 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900 mb-2">Unbalanced Entry</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="bg-white rounded-lg px-3 py-2 border border-amber-200">
                    <p className="text-amber-700 font-medium">Total Debit</p>
                    <p className="text-amber-900 font-semibold">{totals.totalDebit.toLocaleString("vi-VN")}</p>
                  </div>
                  <div className="bg-white rounded-lg px-3 py-2 border border-amber-200">
                    <p className="text-amber-700 font-medium">Total Credit</p>
                    <p className="text-amber-900 font-semibold">{totals.totalCredit.toLocaleString("vi-VN")}</p>
                  </div>
                  <div className="bg-white rounded-lg px-3 py-2 border border-amber-200">
                    <p className="text-amber-700 font-medium">Difference</p>
                    <p className="text-red-600 font-semibold">{totals.diff.toLocaleString("vi-VN")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Partner
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Debit
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Credit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(row.lines || []).map((l, idx) => (
                  <tr key={l.id} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">
                          {l.account?.code ?? `#${l.account_id}`}
                        </span>
                        <span className="text-sm text-slate-600 mt-0.5">
                          {l.account?.name ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {l.partner?.name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {Number(l.debit || 0) > 0 
                        ? Number(l.debit).toLocaleString("vi-VN")
                        : "—"
                      }
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {Number(l.credit || 0) > 0 
                        ? Number(l.credit).toLocaleString("vi-VN")
                        : "—"
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-t-2 border-slate-300">
                  <td className="px-6 py-4 font-bold text-slate-900" colSpan={2}>
                    TOTAL
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    {totals.totalDebit.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    {totals.totalCredit.toLocaleString("vi-VN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlEntryDetailPage;