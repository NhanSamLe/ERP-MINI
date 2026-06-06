import React, { useEffect, useState, useMemo } from "react";
import { Calendar, Search, RefreshCcw, Download, FileText, TrendingUp, DollarSign } from "lucide-react";
import { glEntryApi } from "../api/glEntry.api";
import { toast } from "react-toastify";
import { exportExcelReport } from "../../../utils/excel/exportExcelReport";

type TrialBalanceRow = {
  id: number;
  code: string;
  name: string;
  type: string;
  normal_side: "debit" | "credit";
  openingBalance: number;
  periodDebit: number;
  periodCredit: number;
  closingBalance: number;
};

type ProfitLossData = {
  revenueAccounts: TrialBalanceRow[];
  totalRevenue: number;
  cogsAccounts: TrialBalanceRow[];
  totalCogs: number;
  grossProfit: number;
  sellingAccounts?: TrialBalanceRow[];
  totalSelling?: number;
  adminAccounts?: TrialBalanceRow[];
  totalAdmin?: number;
  netOperatingProfit?: number;
};

export default function FinanceReportsPage() {
  const [activeTab, setActiveTab] = useState<"trial-balance" | "profit-loss">("trial-balance");
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    // Default to 1st of current month
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().substring(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().substring(0, 10);
  });

  const [trialBalance, setTrialBalance] = useState<TrialBalanceRow[]>([]);
  const [profitLoss, setProfitLoss] = useState<ProfitLossData | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = { from: startDate, to: endDate };
      
      const [tbRes, plRes] = await Promise.all([
        glEntryApi.getTrialBalance(params),
        glEntryApi.getProfitLoss(params)
      ]);

      setTrialBalance(tbRes.data.data || []);
      setProfitLoss(plRes.data.data || null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Lỗi khi tải báo cáo tài chính");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate Trial Balance Totals
  const tbTotals = useMemo(() => {
    let totalOpening = 0;
    let totalDebit = 0;
    let totalCredit = 0;
    let totalClosing = 0;

    trialBalance.forEach(row => {
      totalOpening += row.openingBalance;
      totalDebit += row.periodDebit;
      totalCredit += row.periodCredit;
      totalClosing += row.closingBalance;
    });

    return { totalOpening, totalDebit, totalCredit, totalClosing };
  }, [trialBalance]);

  // Export to Excel function
  const handleExport = () => {
    if (activeTab === "trial-balance") {
      exportExcelReport<any>({
        title: "BẢNG CÂN ĐỐI PHÁT SINH",
        subtitle: `Từ ngày ${startDate} đến ngày ${endDate}`,
        meta: {
          "Tổng số dư đầu kỳ": tbTotals.totalOpening.toLocaleString("vi-VN") + "đ",
          "Tổng phát sinh Nợ": tbTotals.totalDebit.toLocaleString("vi-VN") + "đ",
          "Tổng phát sinh Có": tbTotals.totalCredit.toLocaleString("vi-VN") + "đ",
          "Tổng số dư cuối kỳ": tbTotals.totalClosing.toLocaleString("vi-VN") + "đ",
        },
        columns: [
          { header: "Mã tài khoản", key: "code", width: 15 },
          { header: "Tên tài khoản", key: "name", width: 35 },
          { header: "Số dư đầu kỳ", key: "opening", width: 20, align: "right" },
          { header: "Phát sinh Nợ", key: "debit", width: 20, align: "right" },
          { header: "Phát sinh Có", key: "credit", width: 20, align: "right" },
          { header: "Số dư cuối kỳ", key: "closing", width: 20, align: "right" },
        ],
        data: trialBalance.map(row => ({
          code: row.code,
          name: row.name,
          opening: row.openingBalance,
          debit: row.periodDebit,
          credit: row.periodCredit,
          closing: row.closingBalance,
        })),
        fileName: `BangCanDoiPhatSinh_${startDate}_to_${endDate}.xlsx`,
      });
    } else if (activeTab === "profit-loss" && profitLoss) {
      exportExcelReport<any>({
        title: "BÁO CÁO KẾT QUẢ HOẠT ĐỘNG KINH DOANH",
        subtitle: `Từ ngày ${startDate} đến ngày ${endDate}`,
        meta: {
          "Doanh thu thuần": profitLoss.totalRevenue.toLocaleString("vi-VN") + "đ",
          "Giá vốn bán hàng": profitLoss.totalCogs.toLocaleString("vi-VN") + "đ",
          "Lợi nhuận gộp": profitLoss.grossProfit.toLocaleString("vi-VN") + "đ",
          "Chi phí bán hàng": (profitLoss.totalSelling || 0).toLocaleString("vi-VN") + "đ",
          "Chi phí quản lý doanh nghiệp": (profitLoss.totalAdmin || 0).toLocaleString("vi-VN") + "đ",
          "Lợi nhuận thuần từ HĐKD": (profitLoss.netOperatingProfit || 0).toLocaleString("vi-VN") + "đ",
        },
        columns: [
          { header: "Chỉ tiêu", key: "item", width: 45 },
          { header: "Mã số", key: "code", width: 10, align: "center" },
          { header: "Số tiền", key: "amount", width: 25, align: "right" },
        ],
        data: [
          { item: "1. Doanh thu bán hàng và cung cấp dịch vụ", code: "01", amount: profitLoss.totalRevenue },
          { item: "2. Các khoản giảm trừ doanh thu", code: "02", amount: 0 },
          { item: "3. Doanh thu thuần về bán hàng và cung cấp dịch vụ (10 = 01 - 02)", code: "10", amount: profitLoss.totalRevenue },
          { item: "4. Giá vốn bán hàng", code: "11", amount: profitLoss.totalCogs },
          { item: "5. Lợi nhuận gộp về bán hàng và cung cấp dịch vụ (20 = 10 - 11)", code: "20", amount: profitLoss.grossProfit },
          { item: "6. Chi phí bán hàng", code: "21", amount: profitLoss.totalSelling || 0 },
          { item: "7. Chi phí quản lý doanh nghiệp", code: "22", amount: profitLoss.totalAdmin || 0 },
          { item: "8. Lợi nhuận thuần từ hoạt động kinh doanh (30 = 20 - 21 - 22)", code: "30", amount: profitLoss.netOperatingProfit || 0 },
        ],
        fileName: `BaoCaoKetQuaKinhDoanh_${startDate}_to_${endDate}.xlsx`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Page Title Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Báo cáo tài chính</h1>
            <p className="text-sm text-slate-500">Xem Bảng cân đối phát sinh và Báo cáo kết quả hoạt động kinh doanh</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={loading || (activeTab === "profit-loss" && !profitLoss)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Excel</span>
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>Tải lại</span>
            </button>
          </div>
        </div>

        {/* Date Filters Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Từ ngày</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Đến ngày</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm h-[42px]"
            >
              <Search className="w-4 h-4" />
              <span>Xem Báo cáo</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab("trial-balance")}
            className={`pb-4 text-base font-bold transition-all relative ${
              activeTab === "trial-balance" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Bảng cân đối phát sinh
          </button>
          <button
            onClick={() => setActiveTab("profit-loss")}
            className={`pb-4 text-base font-bold transition-all relative ${
              activeTab === "profit-loss" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Báo cáo kết quả hoạt động kinh doanh (P&L)
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 py-24 text-center">
            <RefreshCcw className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Đang tải và tính toán báo cáo tài chính...</p>
          </div>
        )}

        {/* Tab Contents */}
        {!loading && activeTab === "trial-balance" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-250">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <th className="px-6 py-4 text-left font-semibold text-slate-700 uppercase tracking-wider w-24">Mã tài khoản</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700 uppercase tracking-wider">Tên tài khoản</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-700 uppercase tracking-wider w-36">Số dư đầu kỳ</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-700 uppercase tracking-wider w-36">Phát sinh Nợ</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-700 uppercase tracking-wider w-36">Phát sinh Có</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-700 uppercase tracking-wider w-36">Số dư cuối kỳ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trialBalance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                        Không tìm thấy bút toán kế toán nào trong kỳ này.
                      </td>
                    </tr>
                  ) : (
                    trialBalance.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 font-mono">{row.code}</td>
                        <td className="px-6 py-4 text-slate-700 font-medium">
                          {row.name}
                          <span className="ml-2 text-xs font-semibold text-slate-400 uppercase">({row.type})</span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-medium text-slate-800">
                          {row.openingBalance === 0 ? "—" : row.openingBalance.toLocaleString("vi-VN") + "đ"}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-medium text-emerald-700">
                          {row.periodDebit === 0 ? "—" : row.periodDebit.toLocaleString("vi-VN") + "đ"}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-medium text-blue-700">
                          {row.periodCredit === 0 ? "—" : row.periodCredit.toLocaleString("vi-VN") + "đ"}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                          {row.closingBalance === 0 ? "—" : row.closingBalance.toLocaleString("vi-VN") + "đ"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {trialBalance.length > 0 && (
                  <tfoot>
                    <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
                      <td colSpan={2} className="px-6 py-4 text-left">TỔNG CỘNG</td>
                      <td className="px-6 py-4 text-right font-mono">{tbTotals.totalOpening.toLocaleString("vi-VN")}đ</td>
                      <td className="px-6 py-4 text-right font-mono text-emerald-800">{tbTotals.totalDebit.toLocaleString("vi-VN")}đ</td>
                      <td className="px-6 py-4 text-right font-mono text-blue-800">{tbTotals.totalCredit.toLocaleString("vi-VN")}đ</td>
                      <td className="px-6 py-4 text-right font-mono">{tbTotals.totalClosing.toLocaleString("vi-VN")}đ</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {!loading && activeTab === "profit-loss" && (
          <div className="space-y-6 animate-in fade-in duration-250">
            {profitLoss ? (
              <>
                {/* Stats Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase mb-1">Doanh thu thuần</p>
                      <h3 className="text-2xl font-bold text-blue-600 font-mono">{profitLoss.totalRevenue.toLocaleString("vi-VN")}đ</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase mb-1">Giá vốn bán hàng</p>
                      <h3 className="text-2xl font-bold text-amber-600 font-mono">{profitLoss.totalCogs.toLocaleString("vi-VN")}đ</h3>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase mb-1">Lợi nhuận gộp</p>
                      <h3 className="text-2xl font-bold text-emerald-600 font-mono">{profitLoss.grossProfit.toLocaleString("vi-VN")}đ</h3>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase mb-1">Lợi nhuận từ HĐKD</p>
                      <h3 className="text-2xl font-bold text-purple-600 font-mono">{(profitLoss.netOperatingProfit || 0).toLocaleString("vi-VN")}đ</h3>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Main Statement Box */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-950 uppercase tracking-wide text-sm">Báo cáo kết quả hoạt động kinh doanh (VAS-P&L)</h3>
                  </div>
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-base">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                            <th className="py-3 text-left w-3/5">Chỉ tiêu</th>
                            <th className="py-3 text-center w-24">Mã số</th>
                            <th className="py-3 text-right">Số tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-900">
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-4">1. Doanh thu bán hàng và cung cấp dịch vụ (TK 511)</td>
                            <td className="py-4 text-center font-mono text-slate-500">01</td>
                            <td className="py-4 text-right font-mono">{profitLoss.totalRevenue.toLocaleString("vi-VN")}đ</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-4 font-normal text-slate-600 pl-4">Trong đó: Doanh thu bán hàng hóa</td>
                            <td className="py-4 text-center font-mono text-slate-400">01.1</td>
                            <td className="py-4 text-right font-mono font-normal text-slate-700">{profitLoss.totalRevenue.toLocaleString("vi-VN")}đ</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-4">2. Các khoản giảm trừ doanh thu</td>
                            <td className="py-4 text-center font-mono text-slate-500">02</td>
                            <td className="py-4 text-right font-mono">—</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50 bg-blue-50/20 text-blue-900">
                            <td className="py-4 font-bold">3. Doanh thu thuần về bán hàng và cung cấp dịch vụ (10 = 01 - 02)</td>
                            <td className="py-4 text-center font-mono font-bold text-blue-600">10</td>
                            <td className="py-4 text-right font-mono font-bold">{profitLoss.totalRevenue.toLocaleString("vi-VN")}đ</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-4">4. Giá vốn hàng bán (TK 632)</td>
                            <td className="py-4 text-center font-mono text-slate-500">11</td>
                            <td className="py-4 text-right font-mono text-amber-700">({profitLoss.totalCogs.toLocaleString("vi-VN")}đ)</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50 bg-slate-50 text-slate-900 border-y">
                            <td className="py-4 font-bold">5. Lợi nhuận gộp về bán hàng và cung cấp dịch vụ (20 = 10 - 11)</td>
                            <td className="py-4 text-center font-mono font-bold text-slate-700">20</td>
                            <td className="py-4 text-right font-mono font-bold">{profitLoss.grossProfit.toLocaleString("vi-VN")}đ</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-4">6. Chi phí bán hàng (TK 641)</td>
                            <td className="py-4 text-center font-mono text-slate-500">21</td>
                            <td className="py-4 text-right font-mono text-red-600">({(profitLoss.totalSelling || 0).toLocaleString("vi-VN")}đ)</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-4">7. Chi phí quản lý doanh nghiệp (TK 642)</td>
                            <td className="py-4 text-center font-mono text-slate-500">22</td>
                            <td className="py-4 text-right font-mono text-red-600">({(profitLoss.totalAdmin || 0).toLocaleString("vi-VN")}đ)</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50 bg-emerald-50/20 text-emerald-900 border-t-2">
                            <td className="py-4 font-bold">8. Lợi nhuận thuần từ hoạt động kinh doanh (30 = 20 - 21 - 22)</td>
                            <td className="py-4 text-center font-mono font-bold text-emerald-600">30</td>
                            <td className="py-4 text-right font-mono font-bold text-emerald-700">{(profitLoss.netOperatingProfit || 0).toLocaleString("vi-VN")}đ</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 py-16 text-center text-slate-500 font-medium">
                Không thể tải báo cáo kết quả hoạt động kinh doanh.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
