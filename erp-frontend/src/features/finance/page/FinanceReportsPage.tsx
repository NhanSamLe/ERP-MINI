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
      toast.error(err.response?.data?.message || err.message || "Failed to load financial reports");
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
        title: "TRIAL BALANCE",
        subtitle: `From ${startDate} to ${endDate}`,
        meta: {
          "Total Opening Balance": tbTotals.totalOpening.toLocaleString("vi-VN") + "đ",
          "Total Period Debit": tbTotals.totalDebit.toLocaleString("vi-VN") + "đ",
          "Total Period Credit": tbTotals.totalCredit.toLocaleString("vi-VN") + "đ",
          "Total Closing Balance": tbTotals.totalClosing.toLocaleString("vi-VN") + "đ",
        },
        columns: [
          { header: "Account Code", key: "code", width: 15 },
          { header: "Account Name", key: "name", width: 35 },
          { header: "Opening Balance", key: "opening", width: 20, align: "right" },
          { header: "Period Debit", key: "debit", width: 20, align: "right" },
          { header: "Period Credit", key: "credit", width: 20, align: "right" },
          { header: "Closing Balance", key: "closing", width: 20, align: "right" },
        ],
        data: trialBalance.map(row => ({
          code: row.code,
          name: row.name,
          opening: row.openingBalance,
          debit: row.periodDebit,
          credit: row.periodCredit,
          closing: row.closingBalance,
        })),
        fileName: `TrialBalance_${startDate}_to_${endDate}.xlsx`,
      });
    } else if (activeTab === "profit-loss" && profitLoss) {
      exportExcelReport<any>({
        title: "PROFIT AND LOSS STATEMENT",
        subtitle: `From ${startDate} to ${endDate}`,
        meta: {
          "Net Revenue": profitLoss.totalRevenue.toLocaleString("vi-VN") + "đ",
          "Cost of Goods Sold": profitLoss.totalCogs.toLocaleString("vi-VN") + "đ",
          "Gross Profit": profitLoss.grossProfit.toLocaleString("vi-VN") + "đ",
          "Selling Expenses": (profitLoss.totalSelling || 0).toLocaleString("vi-VN") + "đ",
          "G&A Expenses": (profitLoss.totalAdmin || 0).toLocaleString("vi-VN") + "đ",
          "Net Operating Profit": (profitLoss.netOperatingProfit || 0).toLocaleString("vi-VN") + "đ",
        },
        columns: [
          { header: "Line Item", key: "item", width: 45 },
          { header: "Code", key: "code", width: 10, align: "center" },
          { header: "Amount", key: "amount", width: 25, align: "right" },
        ],
        data: [
          { item: "1. Revenue from sales and services", code: "01", amount: profitLoss.totalRevenue },
          { item: "2. Revenue deductions", code: "02", amount: 0 },
          { item: "3. Net revenue from sales and services (10 = 01 - 02)", code: "10", amount: profitLoss.totalRevenue },
          { item: "4. Cost of goods sold", code: "11", amount: profitLoss.totalCogs },
          { item: "5. Gross profit from sales and services (20 = 10 - 11)", code: "20", amount: profitLoss.grossProfit },
          { item: "6. Selling expenses", code: "21", amount: profitLoss.totalSelling || 0 },
          { item: "7. General and administration expenses", code: "22", amount: profitLoss.totalAdmin || 0 },
          { item: "8. Net operating profit (30 = 20 - 21 - 22)", code: "30", amount: profitLoss.netOperatingProfit || 0 },
        ],
        fileName: `ProfitLoss_${startDate}_to_${endDate}.xlsx`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Page Title Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Financial Reports</h1>
            <p className="text-sm text-slate-500">View Trial Balance and Profit & Loss statement</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={loading || (activeTab === "profit-loss" && !profitLoss)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>Reload</span>
            </button>
          </div>
        </div>

        {/* Date Filters Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">From date</label>
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">To date</label>
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
              <span>View Report</span>
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
            Trial Balance
          </button>
          <button
            onClick={() => setActiveTab("profit-loss")}
            className={`pb-4 text-base font-bold transition-all relative ${
              activeTab === "profit-loss" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Profit & Loss Statement (P&L)
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 py-24 text-center">
            <RefreshCcw className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Loading and calculating financial reports...</p>
          </div>
        )}

        {/* Tab Contents */}
        {!loading && activeTab === "trial-balance" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-250">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <th className="px-6 py-4 text-left font-semibold text-slate-700 uppercase tracking-wider w-24">Account Code</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700 uppercase tracking-wider">Account Name</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-700 uppercase tracking-wider w-36">Opening Balance</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-700 uppercase tracking-wider w-36">Period Debit</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-700 uppercase tracking-wider w-36">Period Credit</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-700 uppercase tracking-wider w-36">Closing Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trialBalance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                        No accounting entries found for this period.
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
                      <td colSpan={2} className="px-6 py-4 text-left">TOTAL</td>
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
                      <p className="text-sm font-semibold text-slate-500 uppercase mb-1">Net Revenue</p>
                      <h3 className="text-2xl font-bold text-blue-600 font-mono">{profitLoss.totalRevenue.toLocaleString("vi-VN")}đ</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase mb-1">Cost of Goods Sold</p>
                      <h3 className="text-2xl font-bold text-amber-600 font-mono">{profitLoss.totalCogs.toLocaleString("vi-VN")}đ</h3>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase mb-1">Gross Profit</p>
                      <h3 className="text-2xl font-bold text-emerald-600 font-mono">{profitLoss.grossProfit.toLocaleString("vi-VN")}đ</h3>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase mb-1">Operating Profit</p>
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
                    <h3 className="font-bold text-slate-950 uppercase tracking-wide text-sm">Profit & Loss Statement (VAS-P&L)</h3>
                  </div>
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-base">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                            <th className="py-3 text-left w-3/5">Line Item</th>
                            <th className="py-3 text-center w-24">Code</th>
                            <th className="py-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-900">
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-4">1. Revenue from sales and services (A/C 511)</td>
                            <td className="py-4 text-center font-mono text-slate-500">01</td>
                            <td className="py-4 text-right font-mono">{profitLoss.totalRevenue.toLocaleString("vi-VN")}đ</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-4 font-normal text-slate-600 pl-4">In: Revenue from merchandise sales</td>
                            <td className="py-4 text-center font-mono text-slate-400">01.1</td>
                            <td className="py-4 text-right font-mono font-normal text-slate-700">{profitLoss.totalRevenue.toLocaleString("vi-VN")}đ</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-4">2. Revenue deductions</td>
                            <td className="py-4 text-center font-mono text-slate-500">02</td>
                            <td className="py-4 text-right font-mono">—</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50 bg-blue-50/20 text-blue-900">
                            <td className="py-4 font-bold">3. Net revenue from sales and services (10 = 01 - 02)</td>
                            <td className="py-4 text-center font-mono font-bold text-blue-600">10</td>
                            <td className="py-4 text-right font-mono font-bold">{profitLoss.totalRevenue.toLocaleString("vi-VN")}đ</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-4">4. Cost of goods sold (A/C 632)</td>
                            <td className="py-4 text-center font-mono text-slate-500">11</td>
                            <td className="py-4 text-right font-mono text-amber-700">({profitLoss.totalCogs.toLocaleString("vi-VN")}đ)</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50 bg-slate-50 text-slate-900 border-y">
                            <td className="py-4 font-bold">5. Gross profit from sales and services (20 = 10 - 11)</td>
                            <td className="py-4 text-center font-mono font-bold text-slate-700">20</td>
                            <td className="py-4 text-right font-mono font-bold">{profitLoss.grossProfit.toLocaleString("vi-VN")}đ</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-4">6. Selling expenses (A/C 641)</td>
                            <td className="py-4 text-center font-mono text-slate-500">21</td>
                            <td className="py-4 text-right font-mono text-red-600">({(profitLoss.totalSelling || 0).toLocaleString("vi-VN")}đ)</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-4">7. General and administration expenses (A/C 642)</td>
                            <td className="py-4 text-center font-mono text-slate-500">22</td>
                            <td className="py-4 text-right font-mono text-red-600">({(profitLoss.totalAdmin || 0).toLocaleString("vi-VN")}đ)</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50 bg-emerald-50/20 text-emerald-900 border-t-2">
                            <td className="py-4 font-bold">8. Net operating profit (30 = 20 - 21 - 22)</td>
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
                Failed to load Profit & Loss statement.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
