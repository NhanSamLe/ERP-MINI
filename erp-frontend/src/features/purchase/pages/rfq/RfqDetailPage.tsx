import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  FileText,
  Package,
  StickyNote,
  History,
  ArrowLeft,
} from "lucide-react";
import { RootState, AppDispatch } from "../../../../store/store";
import {
  fetchRfqByIdThunk,
  sendRfqThunk,
  markRfqReceivedThunk,
  acceptRfqThunk,
  rejectRfqThunk,
  convertRfqToPoThunk,
  createRfqVersionThunk,
  submitRfqThunk,
  approveRfqThunk,
  rejectRfqApprovalThunk,
  clearSelected,
} from "../../store/rfq";
import { StatusBadge } from "../../../../components/common";
import { ActionConfirmModal } from "../../../../components/common";
import { StandardFormLayout } from "../../../../components/layout/StandardFormLayout";
import { FormSection } from "../../../../components/layout/FormSection";
import { formatVND } from "@/utils/currency.helper";
import { Roles } from "@/types/enum";

export default function RfqDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const {
    selected: rfq,
    loading,
    actionLoading,
  } = useSelector((s: RootState) => s.rfq);
  const user = useSelector((s: RootState) => s.auth.user);
  const role = user?.role.code;

  const [modal, setModal] = useState<
    | "send"
    | "receive"
    | "accept"
    | "reject"
    | "convert"
    | "version"
    | "submit"
    | "approve"
    | "reject_approval"
    | null
  >(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const numId = Number(id);
    if (id && !isNaN(numId)) {
      dispatch(fetchRfqByIdThunk(numId));
    }
    // Clear selected khi unmount để tránh data cũ hiện khi navigate sang RFQ khác
    return () => {
      dispatch(clearSelected());
    };
  }, [id, dispatch]);

  const handleAction = async (action: typeof modal) => {
    if (!rfq) return;
    try {
      switch (action) {
        case "send":
          await dispatch(sendRfqThunk(rfq.id)).unwrap();
          toast.success("Đã gửi yêu cầu báo giá RFQ cho nhà cung cấp");
          break;
        case "receive":
          await dispatch(markRfqReceivedThunk(rfq.id)).unwrap();
          toast.success("Đã đánh dấu là đã nhận báo giá");
          break;
        case "accept":
          await dispatch(acceptRfqThunk(rfq.id)).unwrap();
          toast.success("Đã chấp nhận báo giá RFQ");
          break;
        case "reject":
          await dispatch(rejectRfqThunk(rfq.id)).unwrap();
          toast.success("Đã từ chối báo giá RFQ");
          break;
        case "convert": {
          const result = await dispatch(convertRfqToPoThunk(rfq.id)).unwrap();
          toast.success("Đã tạo đơn mua hàng (PO)");
          navigate(`/purchase-orders/view/${result.po_id}`);
          break;
        }
        case "version": {
          const newRfq = await dispatch(createRfqVersionThunk(rfq.id)).unwrap();
          toast.success(`Đã tạo phiên bản mới v${newRfq.version}`);
          navigate(`/purchase/rfqs/${newRfq.id}`);
          break;
        }
        case "submit":
          await dispatch(submitRfqThunk(rfq.id)).unwrap();
          toast.success("Đã gửi yêu cầu báo giá RFQ để duyệt");
          break;
        case "approve":
          await dispatch(approveRfqThunk(rfq.id)).unwrap();
          toast.success("Đã duyệt yêu cầu báo giá RFQ");
          break;
        case "reject_approval": {
          if (!rejectReason.trim()) {
            toast.error("Vui lòng nhập lý do từ chối");
            return;
          }
          await dispatch(
            rejectRfqApprovalThunk({ id: rfq.id, reason: rejectReason }),
          ).unwrap();
          toast.success("Đã từ chối duyệt yêu cầu báo giá RFQ");
          setRejectReason("");
          break;
        }
      }
      setModal(null);
    } catch (e: any) {
      toast.error(e);
    }
  };

  const actions = () => {
    if (!rfq) return [];
    const base: Array<{
      label: string;
      variant: "outline" | "primary" | "success" | "danger";
      onClick: () => void;
      disabled?: boolean;
    }> = [
      {
        label: "Quay lại",
        variant: "outline",
        onClick: () => navigate("/purchase/rfqs"),
      },
    ];

    // 1. Kiểm tra Branch_id (chỉ hiển thị nếu trùng chi nhánh)
    if (rfq.branch_id !== user?.branch?.id) {
      return base;
    }

    const isCreator = Number(rfq.created_by) === Number(user?.id);

    if (["draft", "received"].includes(rfq.status) && role === Roles.PURCHASE && isCreator) {
      base.push({
        label: "Chỉnh sửa",
        variant: "outline" as const,
        onClick: () => navigate(`/purchase/rfqs/${rfq.id}/edit`),
        disabled: rfq.approval_status === "waiting_approval",
      });
    }
    // Nút Gửi RFQ chỉ hiện khi người tạo truy cập VÀ trạng thái duyệt đã là approved
    if (rfq.status === "draft" && role === Roles.PURCHASE && isCreator && rfq.approval_status === "approved") {
      base.push({
        label: "Gửi RFQ",
        variant: "primary" as const,
        onClick: () => setModal("send"),
      });
    }
    if (rfq.status === "sent" && role === Roles.PURCHASE && isCreator) {
      base.push({
        label: "Đánh dấu đã nhận",
        variant: "primary" as const,
        onClick: () => setModal("receive"),
      });
    }
    if (rfq.status === "received" && isCreator) {
      // Only show these actions if NOT waiting for approval
      if (rfq.approval_status !== "waiting_approval") {
        if (role === Roles.PURCHASE) {
          base.push({
            label: "Tạo PO",
            variant: "success" as const,
            onClick: () => setModal("convert"),
          });
          base.push({
            label: "Phiên bản mới",
            variant: "outline" as const,
            onClick: () => setModal("version"),
          });
          base.push({
            label: "Từ chối",
            variant: "danger" as const,
            onClick: () => setModal("reject"),
          });
        }
      }
    }
    // Approval workflow buttons - Chỉ người tạo mới được gửi duyệt
    if (rfq.approval_status === "draft" && role === Roles.PURCHASE && isCreator) {
      base.push({
        label: "Gửi duyệt",
        variant: "primary" as const,
        onClick: () => setModal("submit"),
      });
    }
    // Trưởng phòng duyệt (không được là người tạo để đảm bảo tính khách quan - Maker & Checker)
    if (
      rfq.approval_status === "waiting_approval" &&
      role === Roles.PURCHASEMANAGER
    ) {
      base.push({
        label: "Duyệt",
        variant: "success" as const,
        onClick: () => setModal("approve"),
      });
      base.push({
        label: "Từ chối duyệt",
        variant: "danger" as const,
        onClick: () => setModal("reject_approval"),
      });
    }
    return base;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <FileText className="w-10 h-10 text-gray-300" />
        <p className="text-sm font-medium">Không tìm thấy yêu cầu báo giá RFQ</p>
        <button
          onClick={() => navigate("/purchase/rfqs")}
          className="text-sm text-orange-600 hover:underline"
        >
          Quay lại danh sách RFQ
        </button>
      </div>
    );
  }

  const lines = rfq.lines ?? [];

  return (
    <>
      <StandardFormLayout
        title={rfq.rfq_no}
        statusBadge={<StatusBadge status={rfq.status} />}
        actions={actions()}
      >
        {/* General Info */}
        <FormSection
          title="Thông tin yêu cầu báo giá (RFQ)"
          icon={<FileText className="w-4 h-4" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Số RFQ</p>
              <p className="text-sm font-semibold text-gray-900">
                {rfq.rfq_no}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Nhà cung cấp</p>
              <p className="text-sm text-gray-800">
                {rfq.supplier?.name ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Người mua</p>
              <p className="text-sm text-gray-800">
                {rfq.creator?.full_name ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Ngày RFQ</p>
              <p className="text-sm text-gray-800">
                {new Date(rfq.rfq_date).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Hiệu lực đến</p>
              <p
                className={`text-sm font-medium ${rfq.valid_until && new Date(rfq.valid_until) < new Date() ? "text-red-600" : "text-gray-800"}`}
              >
                {rfq.valid_until
                  ? new Date(rfq.valid_until).toLocaleDateString("vi-VN")
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Phiên bản</p>
              <p className="text-sm text-gray-800">v{rfq.version}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Điều khoản thanh toán</p>
              <p className="text-sm text-gray-800">
                {rfq.paymentTerm ? `${rfq.paymentTerm.name} (${rfq.paymentTerm.days} ngày)` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Tiền tệ</p>
              <p className="text-sm text-gray-800">
                {rfq.currency ? `${rfq.currency.code} (${rfq.currency.name})` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Tỷ giá</p>
              <p className="text-sm text-gray-800">
                {rfq.exchange_rate ? Number(rfq.exchange_rate).toLocaleString("vi-VN") : "1"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Trạng thái</p>
              <StatusBadge status={rfq.status} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Trạng thái duyệt</p>
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  rfq.approval_status === "approved"
                    ? "bg-green-50 text-green-700"
                    : rfq.approval_status === "waiting_approval"
                      ? "bg-yellow-50 text-yellow-700"
                      : rfq.approval_status === "rejected"
                        ? "bg-red-50 text-red-700"
                        : "bg-gray-50 text-gray-700"
                }`}
              >
                {rfq.approval_status === "draft" && "Nháp"}
                {rfq.approval_status === "waiting_approval" &&
                  "Chờ duyệt"}
                {rfq.approval_status === "approved" && "Đã duyệt"}
                {rfq.approval_status === "rejected" && "Từ chối"}
              </span>
            </div>
            {rfq.submitted_at && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Thời gian gửi</p>
                <p className="text-sm text-gray-800">
                  {new Date(rfq.submitted_at).toLocaleDateString("vi-VN")} lúc{" "}
                  {new Date(rfq.submitted_at).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
            {rfq.approved_at && (
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {rfq.approval_status === "rejected"
                    ? "Thời gian từ chối"
                    : "Thời gian duyệt"}
                </p>
                <p className="text-sm text-gray-800">
                  {new Date(rfq.approved_at).toLocaleDateString("vi-VN")} lúc{" "}
                  {new Date(rfq.approved_at).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
            {rfq.approver && (
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {rfq.approval_status === "rejected"
                    ? "Người từ chối"
                    : "Người duyệt"}
                </p>
                <p className="text-sm text-gray-800">
                  {rfq.approver.full_name}
                </p>
              </div>
            )}
            {rfq.reject_reason && (
              <div className="md:col-span-3">
                <p className="text-xs text-gray-500 mb-1">Lý do từ chối</p>
                <p className="text-sm text-red-700 bg-red-50 p-2 rounded border border-red-200">
                  {rfq.reject_reason}
                </p>
              </div>
            )}
            {rfq.sent_at && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Thời gian gửi</p>
                <p className="text-sm text-gray-800">
                  {new Date(rfq.sent_at).toLocaleDateString("vi-VN")}
                </p>
              </div>
            )}
            {rfq.received_at && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Thời gian nhận</p>
                <p className="text-sm text-gray-800">
                  {new Date(rfq.received_at).toLocaleDateString("vi-VN")}
                </p>
              </div>
            )}
          </div>
        </FormSection>

        {/* Line Items */}
        <FormSection
          title="Sản phẩm"
          icon={<Package className="w-4 h-4" />}
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orange-100 bg-orange-50/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Số lượng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    ĐVT
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Đơn giá
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Chiết khấu
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Thuế
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Thành tiền
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    T.gian giao
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lines.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-gray-400 text-sm"
                    >
                      Không có sản phẩm nào
                    </td>
                  </tr>
                ) : (
                  lines.map((line, i) => {
                    const gross = Number(line.quantity) * Number(line.unit_price);
                    const lineDiscount = Number(line.discount_amount || 0);
                    const lineTotalBeforeHeader = gross - lineDiscount;
                    const taxRate = Number((line as any).taxRate?.rate ?? 0);
                    const lineTaxGross = (lineTotalBeforeHeader * taxRate) / 100;
                    const lineTotalAfterTaxGross = lineTotalBeforeHeader + lineTaxGross;
                    return (
                      <tr key={line.id ?? i} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <div>
                            <p>{line.product?.name ?? `Product #${line.product_id}`}</p>
                            {line.discount_type === "fixed" && (line.discount_amount ?? 0) > 0 ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-medium mt-0.5">
                                -{formatVND(line.discount_amount || 0)}
                              </span>
                            ) : (line.discount_percent ?? 0) > 0 ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-medium mt-0.5">
                                -{line.discount_percent}%
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {line.description ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-800">
                          {line.quantity}
                        </td>
                        <td className="px-4 py-3 text-left text-gray-600">
                          {(line as any).uom?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-800">
                          {formatVND(line.unit_price)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {line.discount_type === "fixed" && (line.discount_amount ?? 0) > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100">
                              -{formatVND(line.discount_amount || 0)}
                            </span>
                          ) : (line.discount_percent ?? 0) > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100">
                              -{line.discount_percent}%
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatVND(lineTaxGross)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {formatVND(lineTotalAfterTaxGross)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {line.lead_time_days != null
                            ? `${line.lead_time_days} ngày`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="border-t border-gray-200 bg-gray-50/50">
                {Number(rfq.discount_amount || 0) > 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-3 text-right text-sm font-medium text-orange-500"
                    >
                      Chiết khấu tổng đơn
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-orange-600">
                      -{formatVND(rfq.discount_amount)}
                    </td>
                    <td />
                  </tr>
                )}
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-3 text-right text-sm font-medium text-gray-600"
                  >
                    Tổng tiền trước thuế
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatVND(rfq.total_before_tax)}
                  </td>
                  <td />
                </tr>
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-3 text-right text-sm font-medium text-gray-600"
                  >
                    Thuế
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">
                    {formatVND(rfq.total_tax)}
                  </td>
                  <td />
                </tr>
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-3 text-right text-sm font-bold text-gray-800"
                  >
                    Tổng cộng
                  </td>
                  <td className="px-4 py-3 text-right text-base font-bold text-orange-600">
                    {formatVND(rfq.total_after_tax)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </FormSection>

        {/* Notes */}
        {(rfq.internal_notes || rfq.supplier_notes) && (
          <FormSection title="Ghi chú" icon={<StickyNote className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rfq.internal_notes && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Ghi chú nội bộ
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {rfq.internal_notes}
                  </p>
                </div>
              )}
              {rfq.supplier_notes && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Ghi chú nhà cung cấp
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {rfq.supplier_notes}
                  </p>
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Version history */}
        {rfq.parent_id && (
          <FormSection
            title="Lịch sử phiên bản"
            icon={<History className="w-4 h-4" />}
          >
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                Đây là phiên bản <strong>v{rfq.version}</strong> của RFQ.
              </span>
              <button
                onClick={() => navigate(`/purchase/rfqs/${rfq.parent_id}`)}
                className="text-orange-600 hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Xem phiên bản trước
              </button>
            </div>
          </FormSection>
        )}
      </StandardFormLayout>

      {/* Confirm modals */}
      <ActionConfirmModal
        isOpen={modal === "send"}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction("send")}
        title="Gửi RFQ cho nhà cung cấp"
        description={`Gửi RFQ ${rfq.rfq_no} đến ${rfq.supplier?.name ?? "nhà cung cấp"}?`}
        confirmText="Gửi"
        variant="primary"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "receive"}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction("receive")}
        title="Đánh dấu đã nhận báo giá"
        description="Xác nhận rằng bạn đã nhận được báo giá của nhà cung cấp?"
        confirmText="Xác nhận đã nhận"
        variant="success"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "accept"}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction("accept")}
        title="Chấp nhận RFQ"
        description="Chấp nhận báo giá này?"
        confirmText="Chấp nhận"
        variant="success"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "reject"}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction("reject")}
        title="Từ chối RFQ"
        description="Từ chối báo giá này?"
        confirmText="Từ chối"
        variant="danger"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "convert"}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction("convert")}
        title="Tạo đơn mua hàng (PO)"
        description={`Tạo đơn mua hàng từ RFQ ${rfq.rfq_no}? Các chi tiết sản phẩm và giá cả sẽ được sao chép tự động.`}
        confirmText="Tạo PO"
        variant="success"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "version"}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction("version")}
        title="Tạo phiên bản mới"
        description={`Tạo phiên bản mới v${rfq.version + 1} của RFQ ${rfq.rfq_no}?`}
        confirmText="Tạo phiên bản"
        variant="primary"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "submit"}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction("submit")}
        title="Gửi duyệt yêu cầu báo giá"
        description={`Gửi duyệt yêu cầu báo giá RFQ ${rfq.rfq_no}? Tài liệu sẽ được chuyển đến người quản lý của bạn.`}
        confirmText="Gửi duyệt"
        variant="primary"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "approve"}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction("approve")}
        title="Duyệt RFQ"
        description={`Duyệt yêu cầu báo giá RFQ ${rfq.rfq_no}?`}
        confirmText="Duyệt"
        variant="success"
        loading={actionLoading}
      />
      {/* Reject Approval Modal - with reason input */}
      {modal === "reject_approval" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Từ chối duyệt RFQ
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Vui lòng nhập lý do từ chối duyệt RFQ {rfq.rfq_no}.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Lý do từ chối..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setModal(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleAction("reject_approval")}
                disabled={!rejectReason.trim() || actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 rounded-md"
              >
                {actionLoading ? "Đang từ chối..." : "Từ chối duyệt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
