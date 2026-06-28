import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchSaleOrders } from "@/features/sales/store/saleOrder.slice";
import SaleOrderFilters from "../components/SaleOrderFilters";
import SaleOrderTable from "../components/SaleOrderTable";
import { Link } from "react-router-dom";
import { Plus, Download, ShoppingCart } from "lucide-react";
import { exportExcelReport } from "@/utils/excel/exportExcelReport";
import ReportConfigModal, { ReportConfig } from "@/components/reports/ReportConfigModal";
import { reportApi } from "@/features/reports/api/report.api";
import { toast } from "react-toastify";

export default function SaleOrderListPage() {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.saleOrder);
  const { user }           = useAppSelector((state) => state.auth);

  const [search, setSearch]               = useState("");
  const [status, setStatus]               = useState("");
  const [currentPage, setCurrentPage]     = useState(1);
  const [openReportModal, setOpenReportModal] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => { dispatch(fetchSaleOrders()); }, [dispatch]);
  useEffect(() => { setCurrentPage(1); }, [search, status]);

  const canCreate = ["SALES", "SALESMANAGER", "BRANCH_MANAGER", "CEO", "ADMIN"].includes(user?.role?.code ?? "");

  const filteredItems = useMemo(() =>
    items.filter((item) => {
      const s = search.toLowerCase();
      const matchSearch =
        !search ||
        item.order_no?.toLowerCase().includes(s) ||
        item.customer?.name?.toLowerCase().includes(s);
      const matchStatus = !status || item.approval_status === status;
      return matchSearch && matchStatus;
    }),
    [items, search, status]
  );

  const totalPages     = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() =>
    filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredItems, currentPage]
  );

  const handleExport = async (config: ReportConfig) => {
    try {
      if (config.reportType === "detailed") {
        await exportExcelReport({
          title: "DANH SÁCH ĐƠN HÀNG BÁN (SALE ORDERS)",
          columns: [
            { header: "Số đơn hàng",      key: "order_no",        width: 15 },
            { header: "Ngày đặt",          key: "order_date",      width: 15, formatter: (v) => v ? new Date(String(v)).toLocaleDateString("vi-VN") : "" },
            { header: "Khách hàng",        key: "customer",        width: 30, formatter: (v: any) => v?.name || "-" },
            { header: "Tổng tiền",         key: "total_after_tax", width: 20, format: "currency", align: "right" },
            { header: "Trạng thái duyệt", key: "approval_status", width: 15, formatter: (v) => String(v).toUpperCase() },
            { header: "Trạng thái giao",  key: "status",          width: 15, formatter: (v) => String(v).toUpperCase() },
            { header: "Người tạo",         key: "creator",         width: 20, formatter: (v: any) => v?.full_name || "-" },
          ],
          data: filteredItems,
          fileName: `Bao_Cao_Don_Hang_${Date.now()}.xlsx`,
          footer: { creator: user?.full_name || "Admin" },
        });
      } else {
        const data = await reportApi.getSalesSummary(config);
        await exportExcelReport({
          title: `BÁO CÁO DOANH THU THEO ${config.period.toUpperCase()}`,
          subtitle: `Từ: ${new Date(config.startDate!).toLocaleDateString("vi-VN")} – Đến: ${new Date(config.endDate!).toLocaleDateString("vi-VN")}`,
          columns: [
            { header: "Thời gian",   key: "time_period",   width: 20 },
            { header: "Tổng số đơn", key: "total_orders",  width: 15, align: "center" },
            { header: "Doanh thu",   key: "total_revenue", width: 25, format: "currency", align: "right" },
          ],
          data: data.data,
          fileName: `Bao_Cao_Doanh_Thu_${config.period}_${Date.now()}.xlsx`,
          footer: { creator: user?.full_name || "Admin" },
        });
      }
      setOpenReportModal(false);
    } catch {
      toast.error("Lỗi xuất báo cáo");
    }
  };

  return (
    <div className="page-container">
      <div className="erp-card overflow-hidden">
        {/* Page header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Đơn hàng bán</h1>
              <p className="text-xs text-gray-400 mt-0.5">Quản lý tất cả đơn hàng bán</p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {filteredItems.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpenReportModal(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-gray-600 border border-gray-300 bg-white rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất báo cáo
            </button>

            {canCreate && (
              <Link
                to="/sales/orders/create"
                className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Tạo đơn hàng
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
          <SaleOrderFilters
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
            <span className="text-sm">Đang tải đơn hàng...</span>
          </div>
        ) : (
          <SaleOrderTable items={paginatedItems} />
        )}

        {/* Pagination */}
        {!loading && filteredItems.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Hiển thị{" "}
              <span className="font-semibold text-gray-700">
                {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredItems.length)}
              </span>{" "}
              / <span className="font-semibold text-gray-700">{filteredItems.length}</span>
            </p>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="h-7 px-3 text-xs font-medium border border-gray-300 rounded-md text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Trước
              </button>
              <span className="h-7 px-3 text-xs font-semibold flex items-center bg-orange-500 text-white rounded-md">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="h-7 px-3 text-xs font-medium border border-gray-300 rounded-md text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      <ReportConfigModal
        open={openReportModal}
        onClose={() => setOpenReportModal(false)}
        onExport={handleExport}
        title="Xuất đơn hàng"
      />
    </div>
  );
}
