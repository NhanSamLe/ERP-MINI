import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, RefreshCcw, FileText, Filter, X, Calendar, CheckCircle2, Clock } from "lucide-react";
import { glEntryApi } from "../api/glEntry.api";

type GlEntryDTO = {
  id: number;
  journal_id: number;
  entry_no: string;
  entry_date: string;
  memo?: string;
  status: "draft" | "posted";
};

const GlEntryListPage: React.FC = () => {
  const { journalId } = useParams();
  const jid = Number(journalId);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<GlEntryDTO[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "draft" | "posted">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const load = async () => {
    if (!jid) return;
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (from) params.from = from;
      if (to) params.to = to;

      const res = await glEntryApi.listByJournal(jid, params);
      setRows(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jid]);

  const title = useMemo(() => `Danh sách bút toán - Journal #${jid}`, [jid]);

  const hasActiveFilters = search || status || from || to;

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setFrom("");
    setTo("");
  };

  const stats = useMemo(() => {
    const total = rows.length;
    const posted = rows.filter(r => r.status === "posted").length;
    const draft = rows.filter(r => r.status === "draft").length;
    return { total, posted, draft };
  }, [rows]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-600">Tổng: <span className="font-semibold text-slate-900">{stats.total}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-slate-600">Posted: <span className="font-semibold text-emerald-700">{stats.posted}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-slate-600">Draft: <span className="font-semibold text-amber-700">{stats.draft}</span></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  showFilters || hasActiveFilters
                    ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Bộ lọc</span>
                {hasActiveFilters && (
                  <span className="bg-white text-blue-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    !
                  </span>
                )}
              </button>
              <button
                onClick={load}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Tải lại</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Bộ lọc tìm kiếm</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Xóa bộ lọc
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Tìm kiếm</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    className="w-full border border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Entry No, Memo, Reference..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && load()}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Trạng thái</label>
                <select
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="">Tất cả</option>
                  <option value="draft">Draft</option>
                  <option value="posted">Posted</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Từ ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>
              </div>

              <div className="lg:col-start-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Đến ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={load}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
              >
                <Search className="w-4 h-4" />
                Áp dụng lọc
              </button>
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
                    Entry No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Ngày
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Memo
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-6 py-16 text-center" colSpan={4}>
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCcw className="w-8 h-8 text-blue-600 animate-spin" />
                        <p className="text-slate-600 font-medium">Đang tải dữ liệu...</p>
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-6 py-16 text-center" colSpan={4}>
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                          <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-slate-900 font-semibold mb-1">Chưa có bút toán</p>
                          <p className="text-sm text-slate-500">
                            {hasActiveFilters ? "Không tìm thấy kết quả phù hợp với bộ lọc" : "Chưa có bút toán nào được tạo"}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                      onClick={() => navigate(`/finance/entries/${r.id}`)}
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900">{r.entry_no}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{new Date(r.entry_date).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600 line-clamp-2">{r.memo || "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                            r.status === "posted"
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-amber-100 text-amber-700 border border-amber-200"
                          }`}>
                            {r.status === "posted" ? (
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer with count */}
          {rows.length > 0 && (
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3">
              <p className="text-sm text-slate-600">
                Hiển thị <span className="font-semibold text-slate-900">{rows.length}</span> bút toán
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlEntryListPage;