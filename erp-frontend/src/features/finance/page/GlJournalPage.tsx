import React, { useEffect, useState } from "react";
import { BookOpen, RefreshCcw, Search, Filter, Download, FileText } from "lucide-react";

// Mock data types
interface GlJournalDTO {
  id: number;
  code: string;
  name: string;
  description?: string;
  status?: string;
  createdAt?: string;
}

// Mock service
const fetchGlJournals = async (): Promise<GlJournalDTO[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, code: "SALES", name: "Nhật ký bán hàng", description: "Ghi nhận các giao dịch bán hàng", status: "active", createdAt: "2024-01-15" },
        { id: 2, code: "PURCHASE", name: "Nhật ký mua hàng", description: "Ghi nhận các giao dịch mua hàng", status: "active", createdAt: "2024-01-15" },
        { id: 3, code: "CASH", name: "Nhật ký tiền mặt", description: "Ghi nhận các giao dịch tiền mặt", status: "active", createdAt: "2024-01-15" },
        { id: 4, code: "BANK", name: "Nhật ký ngân hàng", description: "Ghi nhận các giao dịch ngân hàng", status: "active", createdAt: "2024-01-15" },
      ]);
    }, 800);
  });
};

const GlJournalPage: React.FC = () => {
  const [data, setData] = useState<GlJournalDTO[]>([]);
  const [filteredData, setFilteredData] = useState<GlJournalDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const rows = await fetchGlJournals();
      setData(rows);
      setFilteredData(rows);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Lỗi tải danh sách nhật ký");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = data.filter(
      (item) =>
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchTerm, data]);

  const handleExport = () => {
    alert("Xuất dữ liệu Excel/PDF");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  Nhật ký chung
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Quản lý danh sách nhật ký kế toán: SALES, PURCHASE, CASH, BANK
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow"
              >
                <Download className="w-4 h-4" />
                Xuất file
              </button>
              <button
                onClick={loadData}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Đang tải..." : "Tải lại"}
              </button>
            </div>
          </div>
        </div>

        {/* Filter & Search Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[280px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã hoặc tên nhật ký..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Filter className="w-4 h-4" />
              <span className="font-medium">
                Hiển thị: <span className="text-blue-600">{filteredData.length}</span> / {data.length} nhật ký
              </span>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-20">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-32">
                    Mã nhật ký
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Tên nhật ký
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-32">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td className="px-6 py-12 text-center" colSpan={5}>
                      <div className="flex flex-col items-center justify-center gap-3">
                        <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin" />
                        <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td className="px-6 py-12 text-center" colSpan={5}>
                      <div className="flex flex-col items-center justify-center gap-3">
                        <FileText className="w-12 h-12 text-slate-300" />
                        <div>
                          <p className="text-sm font-medium text-slate-600">
                            {searchTerm ? "Không tìm thấy kết quả" : "Chưa có nhật ký nào"}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {searchTerm ? "Thử tìm kiếm với từ khóa khác" : "Dữ liệu sẽ được hiển thị ở đây"}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row) => (
                    <tr 
                      key={row.id} 
                      className="hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                        #{row.id}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-sm font-mono font-semibold">
                          {row.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {row.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {row.description || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                          Hoạt động
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        </div>
    </div>
  );
};

export default GlJournalPage;