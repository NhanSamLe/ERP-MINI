import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../store/store";
import { DataTable } from "../../../components/ui/DataTable";
import { Button } from "../../../components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Roles } from "@/types/enum";
import { Card, Space, Tooltip, Badge } from "antd";
import {
  FileText,
  FileSpreadsheet,
  RotateCw,
  ChevronUp,
  Upload,
  Plus,
  Trash2,
  Download,
  Filter,
  Eye,
} from "lucide-react";

import {
  fetchPurchaseOrdersThunk,
  deletePurchaseOrderThunk,
  searchPurchaseOrdersThunk,
  bulkApprovePurchaseOrdersThunk,
  bulkCancelPurchaseOrdersThunk,
} from "../store/purchaseOrder.thunks";
import {
  setSelectedIds,
  clearSelectedIds,
  setFilters,
} from "../store/purchaseOrder.slice";

import { PurchaseOrder } from "../store/purchaseOrder.types";
import { getErrorMessage } from "@/utils/ErrorHelper";
import { exportExcelReport } from "@/utils/excel/exportExcelReport";
import ReportConfigModal, {
  ReportConfig,
} from "@/components/reports/ReportConfigModal";
import { reportApi } from "@/features/reports/api/report.api";

// Import new components
import AdvancedFilterPanel from "../components/AdvancedFilterPanel";
import BulkActionModal from "../components/BulkActionModal";

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
      toast.success("Purchase Order deleted successfully!");
      setConfirmOpen(false);
    } catch (error) {
      console.log(">>> Error caught:", error);
      console.log(">>>> ERROR TYPE:", typeof error);
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = async (filters: any) => {
    try {
      dispatch(setFilters(filters));
      await dispatch(searchPurchaseOrdersThunk(filters)).unwrap();
      toast.success("Tìm kiếm thành công");
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
      toast.success("Phê duyệt thành công");
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
      toast.success("Hủy thành công");
      dispatch(fetchPurchaseOrdersThunk());
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleExport = async (config: ReportConfig) => {
    try {
      if (config.reportType === "detailed") {
        await exportExcelReport({
          title: "DANH SÁCH ĐƠN MUA HÀNG (PURCHASE ORDERS)",
          columns: [
            { header: "Số PO", key: "po_no", width: 15 },
            {
              header: "Ngày đặt",
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
              header: "Tổng tiền",
              key: "total_after_tax",
              width: 20,
              format: "currency",
              align: "right",
            },
            {
              header: "Trạng thái",
              key: "status",
              width: 15,
              formatter: (val) => String(val).toUpperCase(),
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
          fileName: `Bao_Cao_Don_Mua_Hang_${new Date().getTime()}.xlsx`,
          footer: {
            creator: user?.full_name || "Admin",
          },
        });
      } else {
        // Summary Report
        const data = await reportApi.getPurchaseSummary(config);

        const reportData = data.data.map((item) => ({
          ...item,
        }));

        await exportExcelReport({
          title: `BÁO CÁO CHI PHÍ MUA HÀNG THEO ${config.period.toUpperCase()}`,
          subtitle: `Từ ngày: ${new Date(config.startDate!).toLocaleDateString(
            "vi-VN",
          )} - Đên ngày: ${new Date(config.endDate!).toLocaleDateString(
            "vi-VN",
          )}`,
          columns: [
            { header: "Thời gian", key: "time_period", width: 20 },
            {
              header: "Tổng số đơn",
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
          data: reportData,
          fileName: `Bao_Cao_Chi_Phi_${config.period}_${new Date().getTime()}.xlsx`,
          footer: {
            creator: user?.full_name || "Admin",
          },
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi xuất báo cáo Excel");
    }
  };

  const columns = [
    { key: "po_no", label: "PO No" },
    {
      key: "order_date",
      label: "Order Date",
      render: (po: PurchaseOrder) =>
        po.order_date
          ? new Date(po.order_date).toLocaleDateString("vi-VN")
          : "—",
    },
    {
      key: "Creator",
      label: "Created By",
      render: (po: PurchaseOrder) => po.creator.full_name,
    },
    {
      key: "total_after_tax",
      label: "Total",
      render: (po: PurchaseOrder) =>
        po.total_after_tax ? `${po.total_after_tax}` : "—",
    },
    {
      key: "status",
      label: "Status",
      render: (po: PurchaseOrder) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium
    ${
      po.status === "draft"
        ? "bg-gray-100 text-gray-600"
        : po.status === "waiting_approval"
          ? "bg-amber-100 text-amber-700"
          : po.status === "confirmed"
            ? "bg-blue-100 text-blue-700"
            : po.status === "partially_received"
              ? "bg-indigo-100 text-indigo-700"
              : po.status === "completed"
                ? "bg-green-100 text-green-700"
                : po.status === "cancelled"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600"
    }
  `}
        >
          {po.status.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Created At",
      render: (po: PurchaseOrder) =>
        new Date(po.created_at).toLocaleDateString("vi-VN"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            Purchase Orders
          </h1>
          <p className="text-sm text-gray-500">
            Manage supplier purchase orders
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-1 border border-red-300 bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-200 transition">
            <FileText className="w-4 h-4" />
          </button>

          <button className="flex items-center gap-1 border border-green-300 bg-green-100 text-green-600 px-3 py-1.5 rounded-lg text-sm hover:bg-green-200 transition">
            <FileSpreadsheet className="w-4 h-4" />
          </button>

          <button
            onClick={() => setOpenReportModal(true)}
            className="flex items-center gap-1 border border-blue-300 bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-sm hover:bg-blue-200 transition"
            title="Export Excel"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => dispatch(fetchPurchaseOrdersThunk())}
            className="flex items-center gap-1 border border-gray-300 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className="flex items-center gap-1 border border-gray-300 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition"
            title="Advanced Filter"
          >
            <Filter className="w-4 h-4" />
          </button>

          <Tooltip title={`Bulk Actions (${selectedIds.length} selected)`}>
            <button
              onClick={() => setBulkActionModalVisible(true)}
              disabled={selectedIds.length === 0}
              className="flex items-center gap-1 border border-purple-300 bg-purple-100 text-purple-600 px-3 py-1.5 rounded-lg text-sm hover:bg-purple-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Badge count={selectedIds.length} />
            </button>
          </Tooltip>

          <Link to="/purchase-orders/create">
            <Button className="flex items-center gap-1 bg-[#ff8c00] hover:bg-[#ff7700] text-white px-4 py-2 rounded-lg shadow text-sm font-medium transition">
              <Plus className="w-4 h-4" />
              Add Purchase Order
            </Button>
          </Link>

          <Button className="flex items-center gap-1 bg-[#1a1d29] hover:bg-[#0f111a] text-white px-4 py-2 rounded-lg shadow text-sm font-medium transition">
            <Upload className="w-4 h-4" />
            Import PO
          </Button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      {showAdvancedFilter && (
        <AdvancedFilterPanel
          onSearch={handleSearch}
          onReset={handleReset}
          loading={loading}
        />
      )}

      {/* Data Table */}
      <DataTable
        data={purchaseOrders}
        columns={columns}
        loading={loading}
        searchKeys={["po_no"]}
        onView={(item) => {
          navigate(`/purchase-orders/view/${item.id}`, { state: { po: item } });
        }}
        onEdit={(item) =>
          item.status === "draft"
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
        canEdit={(item) => item.status === "draft" && role === Roles.PURCHASE}
        canDelete={(item) => item.status === "draft"}
      />

      {/* Confirm Delete Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2">
              Are you sure you want to delete this Purchase Order?
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
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
        title="Export Purchase Report"
      />
    </div>
  );
}
