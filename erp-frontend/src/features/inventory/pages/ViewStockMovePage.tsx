import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import {
  approveStockMoveThunk,
  fetchStockMoveByIdThunk,
  rejectStockMoveThunk,
  submitStockMoveThunk,
  receiveTransferThunk,
} from "../store";
import { fetchWarehousesThunk } from "../store/stock/warehouse/warehouse.thunks";
import { Button } from "../../../components/ui/Button";
import { Textarea } from "../../../components/ui/textarea";
import {
  mapToViewStockMove,
  ReferenceType,
  ViewStockMove,
  StockMove,
  StockMoveLine,
} from "../store/stock/stockmove/stockMove.types";
import { Roles } from "@/types/enum";
import { getErrorMessage } from "@/utils/ErrorHelper";
import { toast } from "react-toastify";
import { formatDateTime } from "@/utils/time.helper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronLeft, Send, CheckCircle2, XCircle, Info, Warehouse, ListPlus, Notebook, ShieldAlert, FileCheck, Circle } from "lucide-react";

export interface UserInfo {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  avatar_url: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
  waiting_approval: "bg-yellow-50 text-yellow-700 border-yellow-255 hover:bg-yellow-50",
  in_transit: "bg-blue-50 text-blue-700 border-blue-150 hover:bg-blue-50",
  posted: "bg-emerald-50 text-emerald-700 border-emerald-255 hover:bg-emerald-50",
  cancelled: "bg-rose-50 text-rose-700 border-rose-255 hover:bg-rose-50",
};

const statusLabels: Record<string, string> = {
  draft: "Nháp",
  waiting_approval: "Chờ duyệt",
  in_transit: "Đang vận chuyển",
  posted: "Đã duyệt",
  cancelled: "Đã hủy",
};

const typeLabels: Record<string, string> = {
  receipt: "Nhập kho",
  issue: "Xuất kho",
  transfer: "Điều chuyển",
  adjustment: "Kiểm kê",
};

const referenceColors: Record<ReferenceType, string> = {
  purchase_order: "bg-green-50 text-green-700 border border-green-200 hover:bg-green-50",
  sale_order: "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-50",
  transfer: "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50",
  adjustment: "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-50",
};

const referenceLabels: Record<ReferenceType, string> = {
  purchase_order: "Đơn mua hàng",
  sale_order: "Đơn bán hàng",
  transfer: "Điều chuyển",
  adjustment: "Kiểm kê",
};

export default function ViewStockMovePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const warehouses = useSelector((state: RootState) => state.warehouse.items);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [data, setData] = useState<ViewStockMove | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [confirmReceive, setConfirmReceive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  let stockMoveBranchId: number | undefined = undefined;
  let destinationBranchId: number | undefined = undefined;
  if (data) {
    let warehouseIdToCheck: number | undefined;
    switch (data.type) {
      case "receipt":
        warehouseIdToCheck = data.warehouse_to_id!;
        break;
      case "issue":
      case "adjustment":
      case "transfer":
        warehouseIdToCheck = data.warehouse_from_id!;
        break;
    }
    const warehouse = warehouses.find((w) => w.id === warehouseIdToCheck);
    stockMoveBranchId = warehouse?.branch_id;

    if (data.warehouse_to_id) {
      const whTo = warehouses.find((w) => w.id === data.warehouse_to_id);
      destinationBranchId = whTo?.branch_id;
    }
  }

  useEffect(() => {
    dispatch(fetchWarehousesThunk());
  }, [dispatch]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const res = await dispatch(fetchStockMoveByIdThunk(Number(id)));
      const raw = res.payload as StockMove;
      setData(mapToViewStockMove(raw, warehouses));
      setLoading(false);
    };
    load();
  }, [id, warehouses, dispatch]);

  const handleSubmitApproval = async () => {
    if (!data) return;
    try {
      setSubmitting(true);
      const res = await dispatch(submitStockMoveThunk(data.id)).unwrap();
      setData(res);
      setConfirmSubmit(false);
      toast.success("Gửi yêu cầu phê duyệt thành công!");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await dispatch(approveStockMoveThunk(data!.id)).unwrap();
      const fresh = await dispatch(fetchStockMoveByIdThunk(data!.id)).unwrap();
      setData(mapToViewStockMove(fresh, warehouses));
      setConfirmApprove(false);
      toast.success("Đã phê duyệt thành công!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceive = async () => {
    setSubmitting(true);
    try {
      await dispatch(receiveTransferThunk(data!.id)).unwrap();
      const fresh = await dispatch(fetchStockMoveByIdThunk(data!.id)).unwrap();
      setData(mapToViewStockMove(fresh, warehouses));
      setConfirmReceive(false);
      toast.success("Xác nhận nhận hàng thành công, phiếu hoàn thành!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!data) return;
    if (!rejectReason.trim()) {
      toast.error("Vui lòng cung cấp lý do từ chối!");
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(
        rejectStockMoveThunk({ id: data.id, rejectReason }),
      ).unwrap();
      const fresh = await dispatch(fetchStockMoveByIdThunk(data.id)).unwrap();
      setData(mapToViewStockMove(fresh, warehouses));
      setConfirmReject(false);
      setRejectReason("");
      toast.success("Đã hủy phiếu dịch chuyển kho thành công!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Đang tải chi tiết phiếu dịch chuyển kho...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-2">
          <ShieldAlert className="w-12 h-12 text-rose-500" />
          <h3 className="text-base font-bold text-slate-700">Không tìm thấy phiếu dịch chuyển</h3>
          <p className="text-sm text-slate-400">Bản ghi yêu cầu không hợp lệ hoặc đã bị xóa vĩnh viễn.</p>
        </div>
      </div>
    );
  }

  const isTransfer = data.type === "transfer";
  const canReceive =
    data.type === "transfer" &&
    data.status === "in_transit" &&
    (currentUser?.role.code === Roles.WHSTAFF || currentUser?.role.code === Roles.WHMANAGER) &&
    destinationBranchId === currentUser?.branch.id;

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 transition shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Phiếu dịch chuyển #{data.move_no}
              </h1>
              <Badge
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-none capitalize ${
                  statusColors[data.status] || "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                <Circle
                  className={`w-2 h-2 mr-1.5 fill-current ${
                    data.status === "draft"
                      ? "text-slate-450"
                      : data.status === "waiting_approval"
                        ? "text-yellow-500 animate-pulse"
                        : data.status === "posted"
                          ? "text-emerald-500"
                          : "text-rose-500"
                  }`}
                />
                {statusLabels[data.status] || data.status}
              </Badge>
              <Badge className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 border border-blue-150 text-blue-700 capitalize shadow-none">
                {typeLabels[data.type] || data.type}
              </Badge>
            </div>
            <p className="text-slate-500 text-xs font-medium mt-1">
              Ngày dịch chuyển: <time dateTime={data.move_date}>{formatDateTime(data.move_date)}</time>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          {data.status === "draft" &&
            currentUser?.role.code === Roles.WHSTAFF &&
            (data.creator?.id === currentUser?.id || !!data.reference_type) &&
            stockMoveBranchId === currentUser?.branch.id && (
              <Button
                onClick={() => setConfirmSubmit(true)}
                variant="primary"
                leftIcon={<Send className="w-4 h-4" />}
              >
                Gửi yêu cầu phê duyệt
              </Button>
            )}

          {currentUser?.role.code === Roles.WHMANAGER &&
            data.status === "waiting_approval" &&
            stockMoveBranchId === currentUser?.branch.id && (
              <>
                <Button
                  onClick={() => setConfirmApprove(true)}
                  variant="success"
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Phê duyệt phiếu
                </Button>
                <Button
                  onClick={() => setConfirmReject(true)}
                  variant="danger"
                  leftIcon={<XCircle className="w-4 h-4" />}
                >
                  Hủy phiếu
                </Button>
              </>
            )}

          {canReceive && (
            <Button
              onClick={() => setConfirmReceive(true)}
              variant="success"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Nhận hàng (Xác nhận)
            </Button>
          )}
        </div>
      </div>

      {/* BODY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <Card className="border-slate-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
            <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/20">
              <div className="flex items-center gap-2 text-slate-800">
                <Info className="w-4 h-4 text-orange-500" />
                <CardTitle className="text-base font-semibold">Thông tin chung</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <InfoItem label="Mã phiếu" value={data.move_no} />
                <InfoItem
                  label="Ngày chứng từ"
                  value={formatDateTime(data.move_date)}
                />
                <InfoItem
                  label="Nguồn tham chiếu"
                  value={
                    <Badge
                      className={`shadow-none font-bold px-2 py-0.5 text-[10px] capitalize border ${
                        referenceColors[data.reference_type] || "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {referenceLabels[data.reference_type] || data.reference_type}
                    </Badge>
                  }
                />
                <InfoItem
                  label="Mã tham chiếu"
                  value={<span className="font-mono bg-slate-55 px-2 py-0.5 rounded font-bold border border-slate-100">{data.reference_id ?? "—"}</span>}
                />
                <InfoItem
                  label="Ngày tạo"
                  value={formatDateTime(data.created_at)}
                />
                <InfoItem
                  label="Ngày cập nhật"
                  value={formatDateTime(data.updated_at)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Warehouses */}
          <Card className="border-slate-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
            <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/20">
              <div className="flex items-center gap-2 text-slate-800">
                <Warehouse className="w-4 h-4 text-indigo-500" />
                <CardTitle className="text-base font-semibold">Kho liên kết</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <InfoItem
                  label="Kho nguồn (Từ)"
                  value={data.warehouse_from_name ? <span className="font-semibold text-slate-750">{data.warehouse_from_name}</span> : "—"}
                />
                <InfoItem 
                  label="Kho đích (Đến)" 
                  value={data.warehouse_to_name ? <span className="font-semibold text-slate-750">{data.warehouse_to_name}</span> : "—"} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Lines table */}
          <Card className="border-slate-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
            <CardHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/20 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <ListPlus className="w-5 h-5 text-slate-700" />
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800">
                    Chi tiết dịch chuyển kho
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-0.5">
                    Các chi tiết nhập xuất kho liên quan đến phiếu dịch chuyển này
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6 text-left">Sản phẩm</th>
                    <th className="py-3.5 px-6 text-left">SKU</th>
                    <th className="py-3.5 px-6 text-right w-20">Số lượng</th>
                    <th className="py-3.5 px-6 text-left">ĐVT</th>
                    <th className="py-3.5 px-6 text-left">
                      {data.type === "receipt" ? "Vị trí đích" : "Vị trí nguồn"}
                    </th>
                    {isTransfer && <th className="py-3.5 px-6 text-left">Vị trí đích</th>}
                    <th className="py-3.5 px-6 text-left">Lô hàng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.lines && data.lines.length > 0 ? (
                    data.lines.map((line: StockMoveLine) => (
                      <tr
                        key={line.id}
                        className="hover:bg-slate-50/30 transition-colors align-middle"
                      >
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 shadow-sm shrink-0">
                              <img
                                src={line.product?.image_url || "/no-image.png"}
                                alt={line.product?.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="font-semibold text-slate-800">
                              {line.product?.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {line.product?.sku}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-xs font-mono">
                            {Number(line.quantity)}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-slate-600 text-xs font-semibold">
                          {line.uom?.name ??
                            line.uom?.code ??
                            line.product?.uom?.name ??
                            "—"}
                        </td>
                        <td className="py-3.5 px-6 text-xs">
                          {data.type === "receipt" ? (
                            line.locationTo ? (
                              <Badge variant="secondary" className="shadow-none rounded px-2 text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                                {line.locationTo.code} · {line.locationTo.name}
                              </Badge>
                            ) : (
                              "—"
                            )
                          ) : (
                            line.locationFrom ? (
                              <Badge variant="secondary" className="shadow-none rounded px-2 text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                                {line.locationFrom.code} · {line.locationFrom.name}
                              </Badge>
                            ) : (
                              "—"
                            )
                          )}
                        </td>
                        {isTransfer && (
                          <td className="py-3.5 px-6 text-xs">
                            {line.locationTo ? (
                              <Badge variant="secondary" className="shadow-none rounded px-2 text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                                {line.locationTo.code} · {line.locationTo.name}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </td>
                        )}
                        <td className="py-3.5 px-6 text-xs">
                          {line.lot ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-indigo-650 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded font-mono text-[10px] w-fit">
                                {line.lot.lot_no}
                              </span>
                              {line.lot.expiry_date && (
                                <span className="text-slate-400 font-mono text-[9px] font-bold mt-0.5">
                                  HSD: {line.lot.expiry_date.split("T")[0]}
                                </span>
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={isTransfer ? 7 : 6}
                        className="py-16 text-center text-slate-450 italic"
                      >
                        Không tìm thấy chi tiết nào trong phiếu dịch chuyển.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Note */}
          {data.note && (
            <Card className="border-slate-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
              <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/20">
                <div className="flex items-center gap-2 text-slate-800">
                  <Notebook className="w-4 h-4 text-slate-555" />
                  <CardTitle className="text-base font-semibold">Ghi chú nội bộ</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 text-sm text-slate-700 italic">
                "{data.note}"
              </CardContent>
            </Card>
          )}

          {/* Reject reason */}
          {data.reject_reason && (
            <Card className="border-rose-100 shadow-sm overflow-hidden bg-rose-50/15">
              <CardHeader className="pb-4 border-b border-rose-100/40 bg-rose-50/25">
                <div className="flex items-center gap-2 text-rose-800">
                  <XCircle className="w-4 h-4" />
                  <CardTitle className="text-base font-semibold">Lý do hủy / từ chối</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 text-sm text-rose-700 font-semibold italic">
                "{data.reject_reason}"
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT: sidebar */}
        <div className="space-y-6">
          {/* Approval details */}
          <Card className="border-slate-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
            <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/20">
              <div className="flex items-center gap-2 text-slate-800">
                <FileCheck className="w-4 h-4 text-slate-700" />
                <CardTitle className="text-base font-semibold">Kiểm toán & Phê duyệt</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Người tạo</span>
                <PersonCard user={data.creator} />
              </div>
              <div className="border-t border-slate-100 pt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Người duyệt</span>
                {data.approver ? (
                  <PersonCard user={data.approver} />
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-xs text-slate-450 text-center font-semibold mt-2">
                    Chưa có thông tin phê duyệt
                  </div>
                )}
              </div>
              <div className="pt-3 border-t border-slate-150 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-400 uppercase tracking-wide text-[10px]">Ngày tạo</span>
                  <span className="font-semibold text-slate-700">{formatDateTime(data.created_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-400 uppercase tracking-wide text-[10px]">Ngày cập nhật</span>
                  <span className="font-semibold text-slate-700">{formatDateTime(data.updated_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary stats details */}
          <Card className="border-slate-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
            <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/20">
              <CardTitle className="text-base font-semibold">Thông số dịch chuyển</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5 text-xs">
              <SummaryRow label="Tổng số dòng" value={data.lines?.length ?? 0} />
              <SummaryRow
                label="Loại dịch chuyển"
                value={<Badge className="bg-slate-100 text-slate-700 font-bold border border-slate-200 uppercase tracking-wider text-[10px] rounded shadow-none">{typeLabels[data.type] || data.type}</Badge>}
              />
              <SummaryRow
                label="Nguồn phát sinh"
                value={<span className="font-semibold capitalize text-slate-700">{referenceLabels[data.reference_type] || data.reference_type}</span>}
              />
              <SummaryRow
                label="Kho nguồn"
                value={<span className="font-semibold text-slate-700">{data.warehouse_from_name || "—"}</span>}
              />
              <SummaryRow
                label="Kho đích"
                value={<span className="font-semibold text-slate-700">{data.warehouse_to_name || "—"}</span>}
              />
              <div className="border-t border-slate-100 pt-3">
                <SummaryRow
                  label="Tổng số lượng dịch chuyển"
                  value={
                    <span className="font-mono font-extrabold text-blue-700 bg-blue-50 border border-blue-150 px-2 py-0.5 rounded">
                      {data.lines?.reduce(
                        (sum, l) => sum + Number(l.quantity),
                        0,
                      ) ?? 0}
                    </span>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CONFIRM SUBMIT */}
      <Dialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4 animate-pulse">
              <Send className="h-6 w-6 text-blue-600" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-slate-900">
              Gửi yêu cầu phê duyệt?
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-500 mt-1">
              Sau khi gửi, phiếu dịch chuyển kho này sẽ được gửi đến Quản lý kho. Bạn sẽ không thể chỉnh sửa bản ghi này nữa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-center gap-3 mt-4 border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmSubmit(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitApproval}
              loading={submitting}
              className="w-full sm:w-auto"
            >
              Đồng ý gửi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRM APPROVE */}
      <Dialog open={confirmApprove} onOpenChange={setConfirmApprove}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-4 animate-pulse">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-slate-900">
              Phê duyệt phiếu dịch chuyển?
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-500 mt-1">
              Sau khi được duyệt, phiếu dịch chuyển này sẽ được ghi sổ. Số lượng tồn kho và số dư sổ cái tại các vị trí sẽ được thay đổi ngay lập tức.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-center gap-3 mt-4 border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmApprove(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button
              variant="success"
              onClick={handleApprove}
              loading={submitting}
              className="w-full sm:w-auto"
            >
              Phê duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRM REJECT */}
      <Dialog open={confirmReject} onOpenChange={setConfirmReject}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 mb-4 animate-pulse">
              <XCircle className="h-6 w-6 text-rose-600" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-slate-900">
              Hủy / Từ chối phiếu dịch chuyển
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-500 mt-1.5">
              Vui lòng chỉ rõ lý do hủy hoặc ghi chú bên dưới. Các phiếu đã hủy không thể khôi phục.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <Textarea
              placeholder="Nhập lý do hủy phiếu..."
              value={rejectReason}
              onChange={(value) => setRejectReason(value)}
              rows={4}
            />
          </div>

          <DialogFooter className="flex-row justify-center gap-3 border-t border-slate-150 pt-4 mt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmReject(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Đóng
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={submitting}
              className="w-full sm:w-auto"
            >
              Hủy phiếu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRM RECEIVE */}
      <Dialog open={confirmReceive} onOpenChange={setConfirmReceive}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-4 animate-pulse">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-slate-900">
              Xác nhận nhận hàng?
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-500 mt-1">
              Bạn có chắc chắn muốn xác nhận nhận hàng cho phiếu điều chuyển này? Tồn kho tại kho đích sẽ tăng lên và hàng đi đường (In-Transit) sẽ được xóa bỏ tương ứng.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-center gap-3 mt-4 border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmReceive(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button
              variant="success"
              onClick={handleReceive}
              loading={submitting}
              className="w-full sm:w-auto"
            >
              Xác nhận nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* --- helpers --- */

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
      <div className="font-semibold text-slate-800 text-sm mt-0.5">{value}</div>
    </div>
  );
}

function PersonCard({ user }: { user: UserInfo | null }) {
  if (!user) return null;
  return (
    <div className="flex items-center gap-3 mt-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100 shadow-xxs">
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xxs">
        <img
          src={user.avatar_url || "/default-avatar.png"}
          alt={user.full_name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="min-w-0">
        <div className="font-bold text-slate-800 text-xs truncate">{user.full_name}</div>
        <div className="text-[10px] text-slate-450 mt-0.5 truncate font-medium">{user.email}</div>
        <div className="text-[10px] text-slate-400 font-mono tracking-tighter truncate mt-0.5">{user.phone}</div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs font-semibold">
      <div className="text-slate-450 uppercase tracking-wide">{label}</div>
      <div className="text-slate-800 font-bold">{value}</div>
    </div>
  );
}
