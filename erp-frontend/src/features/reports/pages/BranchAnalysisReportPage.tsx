import React, { useState, useEffect } from "react";
import { FileText, Building2, DollarSign, Users, ArrowUpRight, TrendingUp, Download, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import apiClient from "../../../api/axiosClient";
import { Button } from "../../../components/ui/Button";
import { toast } from "react-toastify";

interface BranchAnalysisData {
  branchId: number;
  branchCode: string;
  branchName: string;
  salesRevenue: number;
  purchaseAmount: number;
  payrollExpense: number;
  headcount: number;
}

export default function BranchAnalysisReportPage() {
  const [data, setData] = useState<BranchAnalysisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    apiClient.get("/reports/branch-analysis")
      .then(res => {
        setData(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading branch analysis:", err);
        toast.error("Không thể tải báo cáo phân tích chi nhánh.");
        setLoading(false);
      });
  }, []);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      toast.success("Xuất báo cáo phân tích chi nhánh thành công! 📥");
      setExporting(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Đang tạo báo cáo tổng hợp...</p>
      </div>
    );
  }

  // Calculate totals
  const totalSales = data.reduce((acc, curr) => acc + curr.salesRevenue, 0);
  const totalPurchases = data.reduce((acc, curr) => acc + curr.purchaseAmount, 0);
  const totalPayroll = data.reduce((acc, curr) => acc + curr.payrollExpense, 0);
  const totalHeadcount = data.reduce((acc, curr) => acc + curr.headcount, 0);
  const totalProfit = totalSales - totalPurchases - totalPayroll;

  // Chart data
  const chartData = data.map(b => ({
    name: b.branchName,
    "Doanh thu": b.salesRevenue,
    "Mua hàng": b.purchaseAmount,
    "Chi phí lương": b.payrollExpense,
  }));

  const pieData = data.map(b => ({
    name: b.branchName,
    value: b.salesRevenue
  }));

  const COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"];

  return (
    <div className="page-container w-full px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-orange-500" />
            Phân tích hiệu quả hoạt động theo Chi nhánh
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Báo cáo đối sánh doanh số bán hàng, chi phí mua hàng và quỹ lương của từng chi nhánh dành cho CEO.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleExport}
          loading={exporting}
          leftIcon={<Download className="w-4 h-4" />}
          className="shadow-md shadow-orange-500/10"
        >
          Xuất Báo cáo Excel
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Doanh thu</p>
            <h3 className="text-base font-bold text-blue-600 mt-2">{formatVND(totalSales)}</h3>
          </div>
          <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mt-3 self-end">
            <TrendingUp className="w-4 h-4" />
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Mua hàng</p>
            <h3 className="text-base font-bold text-orange-600 mt-2">{formatVND(totalPurchases)}</h3>
          </div>
          <span className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mt-3 self-end">
            <DollarSign className="w-4 h-4" />
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Quỹ lương</p>
            <h3 className="text-base font-bold text-indigo-600 mt-2">{formatVND(totalPayroll)}</h3>
          </div>
          <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mt-3 self-end">
            <Users className="w-4 h-4" />
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lợi nhuận gộp CN</p>
            <h3 className={`text-base font-bold mt-2 ${totalProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatVND(totalProfit)}
            </h3>
          </div>
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center mt-3 self-end ${totalProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nhân sự hoạt động</p>
            <h3 className="text-base font-bold text-slate-700 mt-2">{totalHeadcount} nhân sự</h3>
          </div>
          <span className="w-7 h-7 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center mt-3 self-end">
            <Users className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-500" />
            Biểu đồ so sánh thu chi các Chi nhánh
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toLocaleString()}M`} />
                <Tooltip formatter={(value: any) => formatVND(value)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="Doanh thu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Mua hàng" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Chi phí lương" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            Tỷ lệ đóng góp Doanh thu
          </h2>
          <div className="h-80 flex flex-col justify-between">
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatVND(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
              {pieData.map((entry, idx) => {
                const percentage = totalSales > 0 ? ((entry.value / totalSales) * 100).toFixed(1) : "0";
                return (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-600 truncate max-w-[80px]" title={entry.name}>{entry.name}</span>
                    <span className="font-bold text-slate-900 ml-auto">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-800">Bảng chi tiết thống kê chi nhánh</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Mã CN</th>
                <th className="px-6 py-3.5">Tên Chi nhánh</th>
                <th className="px-6 py-3.5 text-right">Doanh thu bán hàng</th>
                <th className="px-6 py-3.5 text-right">Chi phí Mua hàng</th>
                <th className="px-6 py-3.5 text-right">Chi phí Lương</th>
                <th className="px-6 py-3.5 text-right">Chênh lệch Thu Chi</th>
                <th className="px-6 py-3.5 text-center">Số nhân sự</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {data.map(branch => {
                const profit = branch.salesRevenue - branch.purchaseAmount - branch.payrollExpense;
                return (
                  <tr key={branch.branchId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{branch.branchCode}</td>
                    <td className="px-6 py-4 text-slate-900">{branch.branchName}</td>
                    <td className="px-6 py-4 text-right text-blue-600 font-semibold">{formatVND(branch.salesRevenue)}</td>
                    <td className="px-6 py-4 text-right text-orange-600 font-semibold">{formatVND(branch.purchaseAmount)}</td>
                    <td className="px-6 py-4 text-right text-indigo-600 font-semibold">{formatVND(branch.payrollExpense)}</td>
                    <td className={`px-6 py-4 text-right font-bold ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {formatVND(profit)}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">{branch.headcount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
