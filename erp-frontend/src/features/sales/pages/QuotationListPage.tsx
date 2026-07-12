import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchQuotations } from "../store/quotation.slice";
import { QuotationDto } from "../dto/quotation.dto";
import { StatusBadge } from "@/components/common";
import {
  FileText, Plus, Search, ChevronLeft, ChevronRight,
  Eye, Calendar, User, Package, Loader2, Inbox,
} from "lucide-react";
import { formatCurrency } from "@/utils/currency.helper";

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const STATUS_TABS = [
  { label: "Tất cả",      value: "" },
  { label: "Nháp",        value: "draft" },
  { label: "Chờ duyệt",   value: "waiting_approval" },
  { label: "Đã duyệt",    value: "approved" },
  { label: "Đã chấp nhận", value: "accepted" },
  { label: "Từ chối",     value: "rejected" },
];

const ITEMS_PER_PAGE = 15;
const formatQuotationMoney = (q: QuotationDto) =>
  formatCurrency(q.total_after_tax, q.currency?.symbol || q.currency?.code || "VND");

export default function QuotationListPage() {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const { items: quotations, loading, error } = useAppSelector((s) => s.quotation);

  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]               = useState(1);

  useEffect(() => { dispatch(fetchQuotations()); }, [dispatch]);

  // ── derived ───────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = quotations;
    if (statusFilter) {
      list = list.filter((q) =>
        q.approval_status === statusFilter || q.status === statusFilter
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.quotation_no.toLowerCase().includes(q) ||
          r.customer?.name?.toLowerCase().includes(q) ||
          r.opportunity?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [quotations, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged      = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const counts = useMemo(() => ({
    draft:            quotations.filter((q) => q.approval_status === "draft").length,
    waiting_approval: quotations.filter((q) => q.approval_status === "waiting_approval").length,
    approved:         quotations.filter((q) => q.approval_status === "approved").length,
    accepted:         quotations.filter((q) => q.status === "accepted").length,
  }), [quotations]);

  return (
    <div className="page-container">
      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Nháp",         count: counts.draft,            color: "bg-gray-50 border-gray-200",    text: "text-gray-600" },
          { label: "Chờ phê duyệt", count: counts.waiting_approval, color: "bg-amber-50 border-amber-100", text: "text-amber-700" },
          { label: "Đã duyệt",     count: counts.approved,         color: "bg-emerald-50 border-emerald-100", text: "text-emerald-700" },
          { label: "Đã chấp nhận", count: counts.accepted,         color: "bg-orange-50 border-orange-100",  text: "text-orange-700" },
        ].map((c) => (
          <div key={c.label} className={`erp-card px-4 py-3 border ${c.color}`}>
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${c.text}`}>{c.count}</p>
          </div>
        ))}
      </div>

      {/* ── Main table card ── */}
      <div className="erp-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Báo giá</h1>
              <p className="text-xs text-gray-400 mt-0.5">Quản lý báo giá bán hàng</p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {quotations.length}
            </span>
          </div>
          <Link
            to="/sales/quotations/create"
            className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Tạo Báo giá
          </Link>
        </div>

        {/* Status tabs */}
        <div className="px-5 pt-3 border-b border-gray-100 flex gap-0.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={[
                "px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors border-b-2",
                statusFilter === tab.value
                  ? "border-orange-500 text-orange-600 bg-orange-50/60"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm số báo giá, khách hàng..."
              className="w-full h-8 pl-8 pr-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Table */}
        {error && !loading && (
          <div className="mx-5 my-3 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            <span className="text-sm">Đang tải báo giá...</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                {["Số báo giá", "Khách hàng", "Cơ hội", "Ngày tạo", "Hiệu lực đến", "Giá trị", "Duyệt", "Trạng thái", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider first:pl-5 last:pr-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Inbox className="w-8 h-8" />
                      <p className="text-sm">Không tìm thấy báo giá.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((q) => <QuotationRow key={q.id} q={q} navigate={navigate} />)
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && filtered.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Hiển thị {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} / {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-600 px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Row component ─────────────────────────────────────
function QuotationRow({ q, navigate }: { q: QuotationDto; navigate: ReturnType<typeof useNavigate> }) {
  const isExpired = q.status !== "accepted" && q.valid_until && new Date(q.valid_until) < new Date();

  return (
    <tr
      className="hover:bg-orange-50/30 transition-colors cursor-pointer"
      onClick={() => navigate(`/sales/quotations/${q.id}`)}
    >
      {/* Quote No */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-orange-600">{q.quotation_no}</span>
          {q.version > 1 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">
              v{q.version}
            </span>
          )}
        </div>
      </td>

      {/* Customer */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-800 truncate max-w-[160px]">
            {q.customer?.name ?? "—"}
          </span>
        </div>
      </td>

      {/* Opportunity */}
      <td className="px-4 py-3">
        {q.opportunity ? (
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-600 truncate max-w-[130px]">
              {q.opportunity.name}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>

      {/* Date */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Calendar className="w-3 h-3 text-gray-400" />
          {fmtDate(q.quotation_date)}
        </div>
      </td>

      {/* Valid Until */}
      <td className="px-4 py-3">
        <span className={`text-xs font-medium ${isExpired ? "text-red-500" : "text-gray-600"}`}>
          {fmtDate(q.valid_until)}
          {isExpired && " (hết hạn)"}
        </span>
      </td>

      {/* Value */}
      <td className="px-4 py-3">
        <span className="text-sm font-semibold text-gray-800">
          {formatQuotationMoney(q)}
        </span>
        {(q.discount_percent ?? 0) > 0 && (
          <p className="text-[10px] text-emerald-600">-{q.discount_percent}% CK</p>
        )}
      </td>

      {/* Approval status */}
      <td className="px-4 py-3">
        <StatusBadge status={q.approval_status} />
      </td>

      {/* Doc status */}
      <td className="px-4 py-3">
        <StatusBadge status={q.status} />
      </td>

      {/* Action */}
      <td className="pr-5 py-3 text-right">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/sales/quotations/${q.id}`); }}
          className="p-1.5 rounded text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}
