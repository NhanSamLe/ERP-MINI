import { useEffect, useMemo, useState } from "react";
import { Eye, Download, Plus, Search, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getAllApPaymentsThunk } from "../../store/apPayment/apPayment.thunks";
import { ApPayment } from "../../store/apPayment/apPayment.types";
import { useNavigate } from "react-router-dom";
import ApPaymentCreateModal from "../../components/ApPaymentCreateModal";
import { exportExcelReport } from "@/utils/excel/exportExcelReport";
import { toast } from "react-toastify";
import {
  PageHeader,
  StatsCard,
  StatusBadge,
  EmptyState,
} from "../../components/Common";
import { ApPaymentStatus } from "../../constants";

export default function ApPaymentPages() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { list, loading } = useAppSelector((state) => state.apPayment);
  const { user } = useAppSelector((state) => state.auth);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [openCreateModal, setOpenCreateModal] = useState(false);

  useEffect(() => {
    dispatch(getAllApPaymentsThunk());
  }, [dispatch]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filteredPayments = useMemo(() => {
    return list.filter((payment: ApPayment) => {
      const matchesSearch = payment.payment_no
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || payment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [list, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = useMemo(() => {
    return filteredPayments.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredPayments, currentPage]);

  const handleExport = async () => {
    try {
      await exportExcelReport({
        title: "DANH SÁCH PHIẾU CHI",
        columns: [
          { header: "Mã phiếu chi", key: "payment_no", width: 15 },
          {
            header: "Nhà cung cấp",
            key: "supplier",
            width: 30,
            formatter: (val: any) => val?.name || "-",
          },
          {
            header: "Số tiền",
            key: "amount",
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
            header: "Phê duyệt",
            key: "approval_status",
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
        data: filteredPayments,
        fileName: `Payments_${new Date().getTime()}.xlsx`,
        footer: {
          creator: user?.full_name || "Admin",
        },
      });
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xuất báo cáo");
    }
  };

  /* ================= STATS ================= */
  const draftCount = list.filter(
    (p) => p.status === ApPaymentStatus.DRAFT,
  ).length;
  const postedCount = list.filter(
    (p) => p.status === ApPaymentStatus.POSTED,
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ================= HEADER ================= */}
        <PageHeader
          title="Phiếu chi AP"
          subtitle="Quản lý tất cả các khoản thanh toán nhà cung cấp"
          actions={
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                Xuất Excel
              </button>
              <button
                onClick={() => setOpenCreateModal(true)}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Chi tiền mới
              </button>
            </div>
          }
        />

        {/* ================= STATS ================= */}
        <div className="grid grid-cols-3 gap-4">
          <StatsCard
            icon={CreditCard}
            label="Tổng số phiếu chi"
            value={list.length}
            color="orange"
          />
          <StatsCard
            icon={CreditCard}
            label="Bản nháp"
            value={draftCount}
            color="blue"
          />
          <StatsCard
            icon={CreditCard}
            label="Đã ghi sổ"
            value={postedCount}
            color="green"
          />
        </div>

        {/* ================= FILTER ================= */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-orange-400 border p-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-sm font-medium mb-2">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Mã phiếu chi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            <div className="w-56">
              <label className="block text-sm font-medium mb-2">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="All">Tất cả</option>
                <option value={ApPaymentStatus.DRAFT}>Nháp</option>
                <option value={ApPaymentStatus.POSTED}>Đã ghi sổ</option>
                <option value={ApPaymentStatus.CANCELLED}>Đã hủy</option>
              </select>
            </div>
          </div>
        </div>

        {/* ================= TABLE ================= */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-orange-50/60 border-b border-orange-100">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Mã phiếu chi
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Nhà cung cấp
                </th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700">
                  Số tiền
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Phê duyệt
                </th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <CreditCard className="w-8 h-8 animate-pulse" />
                      Đang tải phiếu chi...
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <EmptyState
                      icon={CreditCard}
                      title="Không tìm thấy phiếu chi nào"
                      description="Tạo phiếu chi đầu tiên của bạn bằng cách nhấp vào nút Chi tiền mới"
                      action={{
                        label: "Chi tiền mới",
                        onClick: () => setOpenCreateModal(true),
                      }}
                    />
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-orange-50/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-orange-600">
                      {payment.payment_no}
                    </td>

                    <td className="px-6 py-4">
                      {payment.supplier?.name || "-"}
                    </td>

                    <td className="px-6 py-4 text-right font-medium">
                      {Number(payment.amount || 0).toLocaleString("vi-VN", {
                        minimumFractionDigits: 0,
                      })}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={payment.status} />
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge
                        status={payment.approval_status}
                        variant="approval"
                      />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-3">
                        <Eye
                          onClick={() =>
                            navigate(`/purchase/payments/${payment.id}`)
                          }
                          className="w-5 h-5 cursor-pointer text-gray-500 hover:text-gray-900"
                        />
                        <Download className="w-5 h-5 cursor-pointer text-gray-500 hover:text-gray-900" />
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {/* ================= FOOTER ================= */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-t bg-orange-50/40 gap-3 text-sm text-gray-600">
            <p>
              Hiển thị <strong>{filteredPayments.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filteredPayments.length)}</strong> trên{" "}
              <strong>{filteredPayments.length}</strong> phiếu chi (Tổng cộng <strong>{list.length}</strong> bản ghi)
            </p>

            {filteredPayments.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 min-w-[2rem] px-2 rounded border text-xs font-semibold transition-colors ${
                      currentPage === page
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <ApPaymentCreateModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onSuccess={() => {
          setOpenCreateModal(false);
          navigate(`/purchase/payments`);
        }}
      />
    </div>
  );
}
