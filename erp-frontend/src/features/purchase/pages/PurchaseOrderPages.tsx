import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../store/store";
import { DataTable } from "../../../components/ui/DataTable";
import { Button } from "../../../components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Roles } from "@/types/enum";
import { Tooltip, Badge } from "antd";
import {
  FileText,
  FileSpreadsheet,
  RotateCw,
  Upload,
  Plus,
  Trash2,
  Download,
  Filter,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Package,
  ChevronRight,
  Layers,
  X,
} from "lucide-react";

import {
  fetchPurchaseOrdersThunk,
  deletePurchaseOrderThunk,
  searchPurchaseOrdersThunk,
  bulkApprovePurchaseOrdersThunk,
  bulkCancelPurchaseOrdersThunk,
} from "../store/purchaseOrder.thunks";
import { clearSelectedIds, setFilters } from "../store/purchaseOrder.slice";

import { PurchaseOrder } from "../store/purchaseOrder.types";
import { getErrorMessage } from "@/utils/ErrorHelper";
import { exportExcelReport } from "@/utils/excel/exportExcelReport";
import ReportConfigModal, {
  ReportConfig,
} from "@/components/reports/ReportConfigModal";
import { reportApi } from "@/features/reports/api/report.api";

import AdvancedFilterPanel from "../components/AdvancedFilterPanel";
import BulkActionModal from "../components/BulkActionModal";
import { PurchaseOrderStatus } from "../constants/purchaseStatus.enum";
import { StatsCard, StatusBadge, EmptyState } from "../components/Common";

export default function PurchaseOrderPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const user = useSelector((state: RootState) => state.auth.user);
  const role = user?.role.code;

  const {
    items: purchaseOrders,
    loading,
    selectedIds,
    bulkActionLoading,
  } = useSelector((state: RootState) => state.purchaseOrder);

  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [openReportModal, setOpenReportModal] = useState(false);
  const [bulkActionModalVisible, setBulkActionModalVisible] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  useEffect(() => {
    dispatch(fetchPurchaseOrdersThunk());
  }, [dispatch]);

  const handleDelete = async () => {
    if (!selectedPO) return;
    setDeleting(true);
    try {
      await dispatch(deletePurchaseOrderThunk(selectedPO.id)).unwrap();
      toast.success("Xóa đơn đặt hàng thành công!");
      setConfirmOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = async (filters: any) => {
    try {
      dispatch(setFilters(filters));
      await dispatch(searchPurchaseOrdersThunk(filters)).unwrap();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleReset = () => {
    dispatch(clearSelectedIds());
    dispatch(fetchPurchaseOrdersThunk());
  };

  const handleBulkApprove = async (po_ids: number[]) => {
    try {
      await dispatch(bulkApprovePurchaseOrdersThunk(po_ids)).unwrap();
      toast.success("Phê duyệt thành công!");
      dispatch(fetchPurchaseOrdersThunk());
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleBulkCancel = async (po_ids: number[], reason: string) => {
    try {
      await dispatch(
        bulkCancelPurchaseOrdersThunk({ po_ids, reason }),
      ).unwrap();
      toast.success("Hủy thành công!");
      dispatch(fetchPurchaseOrdersThunk());
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleExport = async (config: ReportConfig) => {
    try {
      if (config.reportType === "detailed") {
        await exportExcelReport({
          title: "DANH SÁCH ĐƠN ĐẶT HÀNG PO",
          columns: [
            { header: "Mã PO", key: "po_no", width: 15 },
            {
              header: "Ngày đặt hàng",
              key: "order_date",
              width: 15,
              formatter: (val) =>
                val ? new Date(String(val)).toLocaleDateString("vi-VN") : "",
            },
            {
              header: "Người tạo",
              key: "creator",
              width: 25,
              formatter: (val: any) => val?.full_name || "-",
            },
            {
              header: "Tổng tiền sau thuế",
              key: "total_after_tax",
              width: 20,
              format: "currency",
              align: "right",
            },
            {
              header: "Trạng thái",
              key: "status",
              width: 15,
              formatter: (val) => {
                const statusMap: Record<string, string> = {
                  draft: "Nháp",
                  waiting_approval: "Chờ phê duyệt",
                  confirmed: "Đã xác nhận",
                  partially_received: "Nhập một phần",
                  completed: "Hoàn thành",
                  cancelled: "Đã hủy",
                };
                return statusMap[String(val)] || String(val);
              },
            },
            {
              header: "Ngày tạo",
              key: "created_at",
              width: 15,
              formatter: (val) =>
                val ? new Date(String(val)).toLocaleDateString("vi-VN") : "",
            },
          ],
          data: purchaseOrders,
          fileName: `Danh_Sach_Don_Dat_Hang_${new Date().getTime()}.xlsx`,
          footer: { creator: user?.full_name || "Admin" },
        });
      } else {
        const data = await reportApi.getPurchaseSummary(config);
        await exportExcelReport({
          title: `BÁO CÁO CHI PHÍ MUA HÀNG THEO ${config.period === "day" ? "NGÀY" : config.period === "week" ? "TUẦN" : config.period === "month" ? "THÁNG" : "NĂM"}`,
          subtitle: `Từ ngày: ${new Date(config.startDate!).toLocaleDateString("vi-VN")} - Đến ngày: ${new Date(config.endDate!).toLocaleDateString("vi-VN")}`,
          columns: [
            { header: "Giai đoạn", key: "time_period", width: 20 },
            {
              header: "Tổng đơn hàng",
              key: "total_orders",
              width: 15,
              align: "center",
            },
            {
              header: "Tổng chi phí",
              key: "total_expense",
              width: 25,
              format: "currency",
              align: "right",
            },
          ],
          data: data.data,
          fileName: `Bao_Cao_Chi_Phi_Mua_Hang_${config.period}_${new Date().getTime()}.xlsx`,
          footer: { creator: user?.full_name || "Admin" },
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xuất báo cáo");
    }
  };

  // Stats
  const totalPOs = purchaseOrders.length;
  const draftCount = purchaseOrders.filter(
    (po) => po.status === PurchaseOrderStatus.DRAFT,
  ).length;
  const confirmedCount = purchaseOrders.filter(
    (po) => po.status === PurchaseOrderStatus.CONFIRMED,
  ).length;
  const waitingCount = purchaseOrders.filter(
    (po) => po.status === PurchaseOrderStatus.WAITING_APPROVAL,
  ).length;

  const columns = [
    { key: "po_no", label: "Mã PO" },
    {
      key: "order_date",
      label: "Ngày đặt hàng",
      render: (po: PurchaseOrder) =>
        po.order_date
          ? new Date(po.order_date).toLocaleDateString("vi-VN")
          : "—",
    },
    {
      key: "Creator",
      label: "Người tạo",
      render: (po: PurchaseOrder) => po.creator.full_name,
    },
    {
      key: "total_after_tax",
      label: "Tổng tiền",
      render: (po: PurchaseOrder) =>
        po.total_after_tax
          ? Number(po.total_after_tax).toLocaleString("vi-VN") + " ₫"
          : "—",
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (po: PurchaseOrder) => <StatusBadge status={po.status} />,
    },
    {
      key: "created_at",
      label: "Ngày tạo",
      render: (po: PurchaseOrder) =>
        new Date(po.created_at).toLocaleDateString("vi-VN"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm border-t-2 border-t-orange-500">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: breadcrumb + count */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <span>Mua hàng</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            </div>
            <span className="text-sm font-semibold text-gray-900">
              Đơn đặt hàng PO
            </span>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-600">
              {totalPOs}
            </span>
          </div>

          {/* Right: toolbar */}
          <div className="flex items-center gap-1.5">
            {/* Utility icon buttons */}
            <Tooltip title="Xuất PDF">
              <button className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                <FileText className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <Tooltip title="Xuất Excel">
              <button className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <Tooltip title="Tải báo cáo">
              <button
                onClick={() => setOpenReportModal(true)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <Tooltip title="Tải lại">
              <button
                onClick={() => dispatch(fetchPurchaseOrdersThunk())}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <Tooltip title="Bộ lọc nâng cao">
              <button
                onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                  showAdvancedFilter
                    ? "border-orange-300 bg-orange-100 text-orange-600"
                    : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <Tooltip
              title={`Hành động hàng loạt${selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}`}
            >
              <button
                onClick={() => setBulkActionModalVisible(true)}
                disabled={selectedIds.length === 0}
                className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Layers className="w-3.5 h-3.5" />
                {selectedIds.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {selectedIds.length}
                  </span>
                )}
              </button>
            </Tooltip>

            {/* Divider */}
            <div className="w-px h-5 bg-gray-200 mx-1" />

            <Link to="/purchase-orders/create">
              <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-sm transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Tạo PO mới
              </button>
            </Link>

            <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Nhập Excel
            </button>
          </div>
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="max-w-screen-2xl mx-auto px-6 py-5 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard
            label="Tổng đơn hàng"
            value={totalPOs}
            icon={ShoppingCart}
            color="orange"
          />
          <StatsCard
            label="Nháp"
            value={draftCount}
            icon={FileText}
            color="blue"
          />
          <StatsCard
            label="Chờ phê duyệt"
            value={waitingCount}
            icon={Clock}
            color="amber"
          />
          <StatsCard
            label="Đã xác nhận"
            value={confirmedCount}
            icon={CheckCircle2}
            color="green"
          />
        </div>

        {/* Advanced filter panel */}
        {showAdvancedFilter && (
          <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-orange-400 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/60">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-700">
                  Bộ lọc nâng cao
                </span>
              </div>
              <button
                onClick={() => setShowAdvancedFilter(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <AdvancedFilterPanel
                onSearch={handleSearch}
                onReset={handleReset}
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* Table / Empty */}
        {purchaseOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <EmptyState
              title="Không có đơn đặt hàng nào"
              description="Bắt đầu bằng việc tạo một đơn đặt hàng mới"
              actionLabel="Tạo đơn đặt hàng"
              onAction={() => navigate("/purchase-orders/create")}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Table header row */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/60">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-700">
                  Đơn đặt hàng
                </span>
                {selectedIds.length > 0 && (
                  <span className="text-xs text-gray-400 ml-1">
                    —{" "}
                    <span className="font-medium text-purple-600">
                      Đã chọn {selectedIds.length} đơn hàng
                    </span>
                  </span>
                )}
              </div>
            </div>
            <DataTable
              data={purchaseOrders}
              columns={columns}
              loading={loading}
              searchKeys={["po_no"]}
              onView={(item) =>
                navigate(`/purchase-orders/view/${item.id}`, {
                  state: { po: item },
                })
              }
              onEdit={(item) =>
                item.status === PurchaseOrderStatus.DRAFT
                  ? navigate(`/purchase-orders/edit/${item.id}`, {
                      state: { po: item },
                    })
                  : undefined
              }
              onDelete={
                role === Roles.PURCHASE
                  ? (item) => {
                      setSelectedPO(item);
                      setConfirmOpen(true);
                    }
                  : undefined
              }
              canEdit={(item) =>
                item.status === PurchaseOrderStatus.DRAFT &&
                role === Roles.PURCHASE
              }
              canDelete={(item) => item.status === PurchaseOrderStatus.DRAFT}
            />
          </div>
        )}
      </div>

      {/* ── Delete Confirm Modal ── */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[420px] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">
                Xác nhận xóa đơn đặt hàng?
              </h3>
              <p className="text-sm text-gray-500">
                Đơn hàng{" "}
                <span className="font-semibold text-gray-700">
                  {selectedPO?.po_no}
                </span>{" "}
                sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-5 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Đang xóa…
                  </>
                ) : (
                  "Đồng ý xóa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Action Modal ── */}
      <BulkActionModal
        visible={bulkActionModalVisible}
        onClose={() => setBulkActionModalVisible(false)}
        selectedPOs={purchaseOrders.filter((po) => selectedIds.includes(po.id))}
        onApprove={handleBulkApprove}
        onCancel={handleBulkCancel}
        loading={bulkActionLoading}
      />

      <ReportConfigModal
        open={openReportModal}
        onClose={() => setOpenReportModal(false)}
        onExport={handleExport}
        title="Xuất báo cáo mua hàng"
      />
    </div>
  );
}
