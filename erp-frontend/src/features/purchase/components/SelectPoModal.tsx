import {
  X,
  FileText,
  Calendar,
  User,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { PurchaseOrder } from "../store/purchaseOrder.types";
import { CheckCircle } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  poList: PurchaseOrder[];
  onSelect: (po: PurchaseOrder) => void;
}

export default function SelectPoModal({
  open,
  onClose,
  poList,
  onSelect,
}: Props) {
  if (!open) return null;

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatAmount = (val?: number) => (val ?? 0).toLocaleString("vi-VN");

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">
        {/* ================= HEADER ================= */}
        <div className="relative px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Chọn đơn đặt hàng (PO)
              </h2>
              <p className="text-sm text-gray-500">
                Có {poList.length} đơn đặt hàng khả dụng — hỗ trợ xuất hóa đơn một phần
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="max-h-[520px] overflow-auto">
          {poList.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-700 font-semibold text-lg">
                Không có đơn đặt hàng nào khả dụng
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Không có đơn đặt hàng nào đã xác nhận hoặc đã nhận hàng một phần để xuất hóa đơn
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {poList.map((po) => {
                const poTotal = Number(po.total_after_tax ?? 0);
                const invoiced = Number(po.invoiced_amount ?? 0);
                const remaining = Number(po.remaining_amount ?? poTotal);
                const isFullyInvoiced = remaining <= 0;
                const invoiceCount = po.invoice_count ?? 0;
                const pct =
                  poTotal > 0 ? Math.round((invoiced / poTotal) * 100) : 0;

                const getStatusLabel = (status: string) => {
                  const statusMap: Record<string, string> = {
                    draft: "Nháp",
                    waiting_approval: "Chờ phê duyệt",
                    confirmed: "Đã xác nhận",
                    partially_received: "Nhập một phần",
                    completed: "Hoàn thành",
                    cancelled: "Đã hủy",
                  };
                  return statusMap[status] || status;
                };

                return (
                  <div
                    key={po.id}
                    onClick={() => {
                      if (isFullyInvoiced) return;
                      onSelect(po);
                      onClose();
                    }}
                    className={`group px-6 py-5 border-l-4 transition-all duration-200 ${
                      isFullyInvoiced
                        ? "opacity-50 cursor-not-allowed border-transparent bg-gray-50"
                        : "cursor-pointer hover:bg-gradient-to-r hover:from-orange-50/40 hover:to-orange-50/60 border-transparent hover:border-orange-500"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-6">
                      {/* ========== LEFT SECTION ========== */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4 mb-3">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center ring-4 ring-orange-50 group-hover:ring-orange-100 transition-all flex-shrink-0">
                            <FileText className="w-7 h-7 text-orange-600" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-xl text-gray-900 group-hover:text-orange-600 transition-colors mb-2">
                              {po.po_no}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 shadow-sm">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                                  {getStatusLabel(po.status)}
                                </span>
                              </div>
                              {invoiceCount > 0 && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 shadow-sm">
                                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                                  <span className="text-xs font-bold text-blue-700">
                                    Đã tạo {invoiceCount} hóa đơn
                                  </span>
                                </div>
                              )}
                              {isFullyInvoiced && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-300">
                                  <AlertTriangle className="w-3.5 h-3.5 text-gray-500" />
                                  <span className="text-xs font-bold text-gray-600">
                                    Đã xuất hóa đơn đầy đủ
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="ml-[72px] space-y-2 text-sm">
                          {po.creator && (
                            <div className="flex items-center gap-2.5 text-gray-600">
                              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="font-medium">Người tạo:</span>
                              <span className="text-gray-900 font-semibold">
                                {po.creator.full_name}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2.5 text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="font-medium">Ngày đặt hàng:</span>
                            <span className="text-gray-900 font-semibold">
                              {formatDate(po.order_date)}
                            </span>
                          </div>

                          {po.approver && (
                            <div className="flex items-center gap-2.5 text-gray-600">
                              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              <span className="font-medium">Người duyệt:</span>
                              <span className="text-gray-900 font-semibold">
                                {po.approver.full_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ========== RIGHT SECTION ========== */}
                      <div className="flex items-start gap-4 flex-shrink-0">
                        <div className="flex flex-col items-end gap-4 min-w-[280px]">
                          {/* Supplier Card */}
                          {po.supplier && (
                            <div className="w-full rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-blue-50/50 p-4 shadow-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <Building2 className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                                  Nhà cung cấp
                                </span>
                              </div>
                              <div className="font-bold text-base text-gray-900 mb-1 line-clamp-1">
                                {po.supplier.name}
                              </div>
                              <div className="text-xs text-gray-600 line-clamp-1">
                                {po.supplier.email}
                              </div>
                            </div>
                          )}

                          {/* Amount breakdown */}
                          <div className="w-full bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-2">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Tổng tiền PO</span>
                              <span className="font-semibold text-gray-800">
                                {formatAmount(poTotal)} VND
                              </span>
                            </div>
                            {invoiceCount > 0 && (
                              <>
                                <div className="flex justify-between text-xs text-blue-600">
                                  <span>Đã xuất hóa đơn</span>
                                  <span className="font-semibold">
                                    {formatAmount(invoiced)} VND
                                  </span>
                                </div>
                                {/* Progress bar */}
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      isFullyInvoiced
                                        ? "bg-gray-400"
                                        : "bg-orange-500"
                                    }`}
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                  />
                                </div>
                              </>
                            )}
                            <div
                              className={`flex justify-between text-sm font-bold ${
                                isFullyInvoiced
                                  ? "text-gray-400"
                                  : "text-orange-600"
                              }`}
                            >
                              <span>Còn lại</span>
                              <span>{formatAmount(remaining)} VND</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-white hover:border-gray-400 hover:shadow-md transition-all duration-200"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
