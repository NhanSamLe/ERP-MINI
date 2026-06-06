import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { CornerUpLeft, Package, X, AlertCircle, Loader2 } from "lucide-react";
import { RootState, AppDispatch } from "../../../../store/store";
import {
  fetchReturnByIdThunk,
  shipReturnThunk,
  confirmReturnThunk,
  completeReturnThunk,
  clearSelectedReturn,
  createDebitNoteFromReturnThunk,
} from "../../store/purchaseReturn";
import { StatusBadge } from "../../../../components/common";
import { ActionConfirmModal } from "../../../../components/common";
import { StandardFormLayout } from "../../../../components/layout/StandardFormLayout";
import { FormSection } from "../../../../components/layout/FormSection";
import { formatVND } from "@/utils/currency.helper";
import { Roles } from "@/types/enum";

export default function PurchaseReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const {
    selectedReturn: ret,
    loading,
    actionLoading,
  } = useSelector((s: RootState) => s.purchaseReturn);
  const user = useSelector((s: RootState) => s.auth.user);
  const role = user?.role.code;
  const [modal, setModal] = useState<
    "ship" | "confirm" | "complete" | "debit_note" | null
  >(null);

  interface ConfirmLineState {
    line_id: number;
    productName: string;
    qty_returned: number;
    uomName: string;
    qty_confirmed: number;
    qty_rejected: number;
  }

  const [confirmLines, setConfirmLines] = useState<ConfirmLineState[]>([]);

  const handleOpenConfirm = () => {
    if (!ret) return;
    setConfirmLines(
      (ret.lines ?? []).map((l: any) => ({
        line_id: l.id,
        productName: l.product?.name ?? `Sản phẩm #${l.product_id}`,
        qty_returned: l.quantity_returned,
        uomName: l.uom?.name ?? "—",
        qty_confirmed: l.quantity_returned,
        qty_rejected: 0,
      }))
    );
    setModal("confirm");
  };

  const handleQtyConfirmedChange = (idx: number, val: number) => {
    setConfirmLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        const qty = Math.min(l.qty_returned, Math.max(0, val));
        return { ...l, qty_confirmed: qty, qty_rejected: l.qty_returned - qty };
      })
    );
  };

  const handleQtyRejectedChange = (idx: number, val: number) => {
    setConfirmLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        const qty = Math.min(l.qty_returned, Math.max(0, val));
        return { ...l, qty_confirmed: l.qty_returned - qty, qty_rejected: qty };
      })
    );
  };

  useEffect(() => {
    const numId = Number(id);
    if (id && !isNaN(numId)) dispatch(fetchReturnByIdThunk(numId));
    return () => {
      dispatch(clearSelectedReturn());
    };
  }, [id, dispatch]);

  const handleAction = async () => {
    if (!ret) return;
    try {
      if (modal === "ship") {
        await dispatch(shipReturnThunk(ret.id)).unwrap();
        toast.success("Đã xuất hàng trả lại");
      } else if (modal === "confirm") {
        await dispatch(
          confirmReturnThunk({
            id: ret.id,
            lines: confirmLines.map((l) => ({
              line_id: l.line_id,
              qty_confirmed: l.qty_confirmed,
              qty_rejected: l.qty_rejected,
            })),
          })
        ).unwrap();
        toast.success("Xác nhận trả hàng thành công");
      } else if (modal === "complete") {
        await dispatch(completeReturnThunk(ret.id)).unwrap();
        toast.success("Hoàn thành trả hàng");
      } else if (modal === "debit_note") {
        const dn = await dispatch(
          createDebitNoteFromReturnThunk(ret.id),
        ).unwrap();
        toast.success(`Đã tạo Thẻ nợ ${dn.debit_note_no}`);
        navigate(`/purchase/debit-notes/${dn.id}`);
      }
      setModal(null);
    } catch (e: any) {
      toast.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!ret) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <CornerUpLeft className="w-10 h-10 text-gray-300" />
        <p className="text-sm font-medium">Không tìm thấy Phiếu trả hàng mua</p>
        <button
          onClick={() => navigate("/purchase/returns")}
          className="text-sm text-orange-600 hover:underline"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const isPurchase = role === Roles.PURCHASE || role === Roles.PURCHASEMANAGER;
  const isAccountant = role === Roles.ACCOUNT || role === Roles.CHACC;

  const actions = [
    {
      label: "Quay lại",
      variant: "outline" as const,
      onClick: () => navigate("/purchase/returns"),
    },
    ...(ret.status === "draft" && isPurchase
      ? [
          {
            label: "Chỉnh sửa",
            variant: "outline" as const,
            onClick: () => navigate(`/purchase/returns/${ret.id}/edit`),
          },
          {
            label: "Xuất hàng",
            variant: "primary" as const,
            onClick: () => setModal("ship"),
          },
        ]
      : []),
    ...(ret.status === "shipped" && isPurchase
      ? [
          {
            label: "Xác nhận nhận",
            variant: "primary" as const,
            onClick: handleOpenConfirm,
          },
        ]
      : []),
    ...(ret.status === "confirmed" && isPurchase
      ? [
          {
            label: "Hoàn thành",
            variant: "success" as const,
            onClick: () => setModal("complete"),
          },
        ]
      : []),
    ...(["confirmed", "completed"].includes(ret.status) && isAccountant
      ? [
          {
            label: "Tạo Thẻ nợ",
            variant: "primary" as const,
            onClick: () => setModal("debit_note"),
          },
        ]
      : []),
  ];

  const lines = ret.lines ?? [];

  return (
    <>
      <StandardFormLayout
        title={ret.return_no}
        statusBadge={<StatusBadge status={ret.status} />}
        actions={actions}
      >
        <FormSection
          title="Chi tiết trả hàng"
          icon={<CornerUpLeft className="w-4 h-4" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Số phiếu trả</p>
              <p className="text-sm font-semibold">{ret.return_no}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Nhà cung cấp</p>
              <p className="text-sm">{ret.supplier?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Kho xuất hàng</p>
              <p className="text-sm">{(ret as any).warehouse?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Ngày trả hàng</p>
              <p className="text-sm">
                {new Date(ret.return_date).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Tổng giá trị trả hàng</p>
              <p className="text-sm font-bold text-orange-600">
                {formatVND(ret.total_return_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Người tạo</p>
              <p className="text-sm">{ret.creator?.full_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Thời gian tạo</p>
              <p className="text-sm">
                {new Date(ret.created_at).toLocaleDateString("vi-VN")}
              </p>
            </div>
            {ret.pra_id && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Từ yêu cầu PRA</p>
                <button
                  onClick={() =>
                    navigate(`/purchase/return-authorizations/${ret.pra_id}`)
                  }
                  className="text-sm text-orange-600 hover:underline"
                >
                  Xem PRA →
                </button>
              </div>
            )}
            {ret.stock_move_id && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Phiếu kho</p>
                <button
                  onClick={() =>
                    navigate(`/inventory/stock_move/view/${ret.stock_move_id}`)
                  }
                  className="text-sm text-orange-600 hover:underline font-medium"
                >
                  Xem phiếu kho →
                </button>
              </div>
            )}
          </div>
          {ret.notes && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-1">Ghi chú</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {ret.notes}
              </p>
            </div>
          )}
        </FormSection>

        {/* Lines */}
        <FormSection
          title="Danh sách mặt hàng trả lại"
          icon={<Package className="w-4 h-4" />}
          noPadding
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-orange-100 bg-orange-50/60">
                {[
                  "#",
                  "Sản phẩm",
                  "SL Trả",
                  "ĐVT",
                  "SL Xác nhận",
                  "SL Từ chối",
                  "Đơn giá",
                  "Tình trạng",
                  "Thành tiền",
                ].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${["SL Trả", "SL Xác nhận", "SL Từ chối", "Đơn giá", "Thành tiền"].includes(h) ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-sm text-gray-400"
                  >
                    Chưa có mặt hàng nào
                  </td>
                </tr>
              ) : (
                lines.map((line, i) => (
                  <tr key={line.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {line.product?.name ?? `Sản phẩm #${line.product_id}`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {line.quantity_returned}
                    </td>
                    <td className="px-4 py-3 text-left text-gray-600">
                      {(line as any).uom?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-medium">
                      {line.quantity_confirmed}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium">
                      {line.quantity_rejected}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatVND(line.unit_price)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          line.condition === "good"
                            ? "bg-green-100 text-green-700"
                            : line.condition === "damaged"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {line.condition === "good" ? "Tốt" : line.condition === "damaged" ? "Hỏng hóc" : "Lỗi sản xuất"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-orange-600">
                      {formatVND(line.line_total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </FormSection>
      </StandardFormLayout>

      <ActionConfirmModal
        isOpen={modal === "ship"}
        onClose={() => setModal(null)}
        onConfirm={handleAction}
        title="Xuất hàng trả lại"
        description={`Xác nhận đã xuất hàng trả lại cho nhà cung cấp đối với phiếu ${ret.return_no}?`}
        confirmText="Xác nhận xuất hàng"
        variant="primary"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "complete"}
        onClose={() => setModal(null)}
        onConfirm={handleAction}
        title="Hoàn thành trả hàng"
        description={`Xác nhận hoàn thành phiếu trả hàng mua ${ret.return_no}?`}
        confirmText="Hoàn thành"
        variant="success"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "debit_note"}
        onClose={() => setModal(null)}
        onConfirm={handleAction}
        title="Tạo Thẻ nợ"
        description={`Tạo Thẻ nợ phải trả từ phiếu ${ret.return_no}? Chỉ số lượng hàng đã được nhà cung cấp xác nhận nhận mới được đưa vào thẻ nợ.`}
        confirmText="Tạo Thẻ nợ"
        variant="primary"
        loading={actionLoading}
      />

      {modal === "confirm" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-orange-50">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Xác nhận hàng trả</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Xác nhận số lượng thực tế nhà cung cấp đã nhận cho phiếu {ret.return_no}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModal(null)}
                className="shrink-0 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content (Table) */}
            <div className="p-6 overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-orange-100 bg-orange-50/40">
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase text-left">#</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase text-left">Sản phẩm</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase text-right">SL Trả</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase text-left">ĐVT</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase text-center w-36">SL Xác nhận</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase text-center w-36">SL Bị từ chối</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {confirmLines.map((line, idx) => (
                    <tr key={line.line_id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{line.productName}</td>
                      <td className="px-4 py-3 text-right text-gray-700 font-semibold">{line.qty_returned}</td>
                      <td className="px-4 py-3 text-left text-gray-500">{line.uomName}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <input
                            type="number"
                            min={0}
                            max={line.qty_returned}
                            value={line.qty_confirmed}
                            onChange={(e) => handleQtyConfirmedChange(idx, Number(e.target.value))}
                            className="w-24 text-center px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium text-emerald-700 bg-emerald-50/20"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <input
                            type="number"
                            min={0}
                            max={line.qty_returned}
                            value={line.qty_rejected}
                            onChange={(e) => handleQtyRejectedChange(idx, Number(e.target.value))}
                            className="w-24 text-center px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium text-red-600 bg-red-50/20"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 p-3.5 bg-orange-50/50 border border-orange-100/50 rounded-lg text-xs text-orange-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Mẹo sử dụng:</p>
                  <p className="mt-0.5 leading-relaxed">
                    Hệ thống tự động cân đối số lượng giữa <strong>SL Xác nhận</strong> và <strong>SL Bị từ chối</strong> dựa trên tổng số lượng thực tế đã gửi đi (SL Trả) để đảm bảo độ chính xác của số liệu kế toán.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModal(null)}
                disabled={actionLoading}
                className="h-9 px-4 rounded-md text-sm font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleAction}
                disabled={actionLoading}
                className="h-9 px-5 rounded-md text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Xác nhận nhận hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
