import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchSaleOrders } from "@/features/sales/store/saleOrder.slice";
import SaleOrderFilters from "../components/SaleOrderFilters";
import SaleOrderTable from "../components/SaleOrderTable";
import { Link } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import { Plus, Download } from "lucide-react";
import { exportExcelReport } from "@/utils/excel/exportExcelReport";
import ReportConfigModal, {
  ReportConfig,
} from "@/components/reports/ReportConfigModal";
import { reportApi } from "@/features/reports/api/report.api";
import { toast } from "react-toastify";

// ... existing imports

export default function SaleOrderListPage() {
  // ... existing code

  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.saleOrder);
  const { user } = useAppSelector((state) => state.auth);

  // ================= LOCAL FILTERS =================
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // ================= PAGINATION =================
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ================= REPORTING =================
  const [openReportModal, setOpenReportModal] = useState(false);

  useEffect(() => {
    dispatch(fetchSaleOrders());
  }, [dispatch]);

  // ✅ Check if user can create order
  const canCreateOrder = user?.role?.code === "SALES" || user?.role?.code === "SALESMANAGER";

  // ================= FILTER LOGIC =================
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search by order number or customer name
      const searchLower = search.toLowerCase();
      const matchesSearch =
        item.order_no?.toLowerCase().includes(searchLower) ||
        item.customer?.name?.toLowerCase().includes(searchLower);

      if (search && !matchesSearch) return false;

      // Filter by status
      if (status && item.approval_status !== status) {
        return false;
      }

      return true;
    });
  }, [items, search, status]);

  const handleExport = async (config: ReportConfig) => {
    try {
      if (config.reportType === "detailed") {
        await exportExcelReport({
          title: "DANH SÁCH ĐƠN HÀNG BÁN (SALE ORDERS)",
          columns: [
            { header: "Số đơn hàng", key: "order_no", width: 15 },
            { header: "Ngày đặt", key: "order_date", width: 15, formatter: (val) => val ? new Date(String(val)).toLocaleDateString('vi-VN') : "" },
            { header: "Khách hàng", key: "customer", width: 30, formatter: (val: any) => val?.name || "-" },
            { header: "Tổng tiền", key: "total_after_tax", width: 20, format: "currency", align: "right" },
            { header: "Trạng thái duyệt", key: "approval_status", width: 15, formatter: (val) => String(val).toUpperCase() },
            { header: "Trạng thái giao", key: "status", width: 15, formatter: (val) => String(val).toUpperCase() },
            { header: "Người tạo", key: "creator", width: 20, formatter: (val: any) => val?.full_name || "-" },
          ],
          data: filteredItems, // Use filteredItems for detailed export
          fileName: `Bao_Cao_Don_Hang_${new Date().getTime()}.xlsx`,
          footer: {
            creator: user?.full_name || "Admin"
          }
        });
      } else {
        // Summary Report
        const data = await reportApi.getSalesSummary(config);

        // Transform for Excel
        const reportData = data.data.map((item) => ({
          ...item,
          // Format time_period if needed, or keeping it as returned (YYYY-MM-DD or YYYY-MM)
        }));

        await exportExcelReport({
          title: `BÁO CÁO DOANH THU THEO ${config.period.toUpperCase()}`,
          subtitle: `Từ ngày: ${new Date(config.startDate!).toLocaleDateString("vi-VN")} - Đên ngày: ${new Date(config.endDate!).toLocaleDateString("vi-VN")}`,
          columns: [
            { header: "Thời gian", key: "time_period", width: 20 },
            { header: "Tổng số đơn", key: "total_orders", width: 15, align: "center" },
            { header: "Doanh thu", key: "total_revenue", width: 25, format: "currency", align: "right" }
          ],
          data: reportData,
          fileName: `Bao_Cao_Doanh_Thu_${config.period}_${new Date().getTime()}.xlsx`,
          footer: {
            creator: user?.full_name || "Admin"
          }
        });
      }
      setOpenReportModal(false);
    } catch (err) {
      console.error("Export Error: ", err);
      toast.error("Lỗi xuất báo cáo");
    }
  };

  // ================= PAGINATION LOGIC =================
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, status]);


  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border">
        {/* ========== PAGE HEADER ========== */}
        <PageHeader
          title="Sale Orders"
          description="Manage all sale orders"
          action={
            <div className="flex gap-2">
              <button
                onClick={() => setOpenReportModal(true)}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download size={18} />
                Export Excel
              </button>
              {canCreateOrder && (
                <Link
                  to="/sales/orders/create"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus size={18} />
                  New Sale Order
                </Link>
              )}
            </div>
          }
        />

        {/* ========== FILTERS ========== */}
        <SaleOrderFilters
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
        />

        {/* ========== TABLE ========== */}
        {loading ? (
          <div className="p-6">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-6">
            <p className="text-gray-500 text-center">No sale orders found</p>
          </div>
        ) : (
          <SaleOrderTable items={paginatedItems} />
        )}

        {/* ========== PAGINATION ========== */}
        {/* Only show pagination if loading is done and we have items (or even if 0 items, but keeping consistent with prev logic) */}
        {!loading && (
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{" "}
              <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredItems.length)}</span> of{" "}
              <span className="font-semibold">{filteredItems.length}</span> results
            </div>

            <div className="flex gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
              >
                ← Previous
              </button>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      <ReportConfigModal
        open={openReportModal}
        onClose={() => setOpenReportModal(false)}
        onExport={handleExport}
        title="Export Sale Orders"
      />
    </div>
  );
}