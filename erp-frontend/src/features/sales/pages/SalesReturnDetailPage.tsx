import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle,
  ClipboardCheck,
  FilePlus2,
  Loader2,
  Package,
  RotateCcw,
  Send,
  Info,
} from "lucide-react";
import { toast } from "react-toastify";
import { StatusBadge } from "@/components/common";
import { StandardFormLayout, FormSection } from "@/components/layout";
import { useAppSelector } from "@/store/hooks";
import { warehouseService } from "@/features/inventory/services/warehouse.service";
import { Warehouse } from "@/features/inventory/store/stock/warehouse/warehouse.types";
import { SaleOrderDto } from "../dto/saleOrder.dto";
import { SalesReturnAuthorizationDto, SalesReturnDto } from "../dto/salesReturn.dto";
import { getSaleOrderById } from "../service/saleOrder.service";
import {
  approveRma,
  completeReturn,
  createCreditNote,
  createReturnFromRma,
  getReturn,
  getReturnByRmaId,
  getRma,
  inspectReturn,
  submitRma,
} from "../service/salesReturn.service";
import { formatCurrency } from "@/utils/currency.helper";

type ReturnLineDraft = {
  id?: number;
  product_id: number;
  productName: string;
  sku?: string;
  orderedQty?: number;
  quantity_returned: number;
  quantity_received: number;
  quantity_rejected: number;
  unit_price: number;
  reason: string;
  condition: "good" | "damaged" | "defective";
};

const RETURN_TYPE_LABEL: Record<string, string> = {
  credit_note: "Chứng từ ghi có",
  refund: "Hoàn tiền",
  replacement: "Đổi hàng",
};

const CONDITION_LABEL: Record<string, string> = {
  good: "Đạt",
  damaged: "Hư hỏng",
  defective: "Lỗi",
};

const fmtDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "—";

const fmtMoney = (value?: number | null, currency = "VND") =>
  value != null ? formatCurrency(value, currency) : "—";

export default function SalesReturnDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { kind = "rmas", id = "" } = useParams();
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role?.code;
  const userBranchId = Number((user as any)?.branch_id || user?.branch?.id || 0);
  const isRma = kind === "rmas";
  const numericId = Number(id);

  const [rma, setRma] = useState<SalesReturnAuthorizationDto | null>(null);
  const [salesReturn, setSalesReturn] = useState<SalesReturnDto | null>(null);
  const [orderDetail, setOrderDetail] = useState<SaleOrderDto | null>(null);
  const [returnDrafts, setReturnDrafts] = useState<ReturnLineDraft[]>([]);
  const [inspectDrafts, setInspectDrafts] = useState<ReturnLineDraft[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const isSalesOwner = role === "SALES" && rma?.created_by === user?.id;
  const isSalesApprover = role === "SALESMANAGER" || role === "BRANCH_MANAGER";
  const isWarehouse = role === "WHSTAFF" || role === "WHMANAGER";
  const canCreateAccountingDocument = role === "ACCOUNT" || role === "CHACC";
  const backPath = location.pathname.startsWith("/inventory")
    ? "/inventory/sales-returns"
    : "/sales/returns";

  const load = async () => {
    if (!numericId) return;
    setLoading(true);
    setLoadError("");
    try {
      if (isRma) {
        const data = await getRma(numericId);
        setRma(data);
        const relatedReturn = ["processing", "completed"].includes(data.status)
          ? await getReturnByRmaId(numericId)
          : null;
        setSalesReturn(relatedReturn);
        if (data.sale_order_id) {
          setOrderDetail(await getSaleOrderById(data.sale_order_id));
        }
      } else {
        const data = await getReturn(numericId);
        setSalesReturn(data);
        setRma(data.rma || null);
        if (data.sale_order_id) {
          setOrderDetail(await getSaleOrderById(data.sale_order_id));
        }
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || "Không tải được chi tiết hoàn hàng";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [kind, id]);

  useEffect(() => {
    if (!isWarehouse) return;
    warehouseService
      .getAllWarehouses()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        const sameBranch = list.filter((w: Warehouse) => !userBranchId || Number(w.branch_id) === userBranchId);
        setWarehouses(sameBranch);
        if (warehouseId && !sameBranch.some((w: Warehouse) => String(w.id) === warehouseId)) setWarehouseId("");
        if (!warehouseId && sameBranch.length === 1) setWarehouseId(String(sameBranch[0].id));
      })
      .catch(() => toast.error("Không tải được danh sách kho"));
  }, [isWarehouse, userBranchId]);

  const currencyCode = orderDetail?.currency?.code || "VND";
  const orderLines = useMemo(() => orderDetail?.lines ?? [], [orderDetail?.lines]);
  const subject = isRma ? rma : salesReturn;
  const customer = subject?.customer;
  const saleOrder = subject?.saleOrder || rma?.saleOrder || salesReturn?.saleOrder;

  useEffect(() => {
    if (!isRma || !rma || !orderLines.length) return;
    setReturnDrafts(
      orderLines.map((line) => ({
        product_id: Number(line.product_id),
        productName: line.product?.name || "-",
        sku: (line.product as any)?.sku,
        orderedQty: Number(line.quantity || 0),
        quantity_returned: Number(line.quantity || 0),
        quantity_received: Number(line.quantity || 0),
        quantity_rejected: 0,
        unit_price: Number(line.unit_price || 0),
        reason: rma.reason || "",
        condition: "good",
      })),
    );
    setReturnNotes(rma.notes || "");
  }, [isRma, rma?.id, orderLines]);

  useEffect(() => {
    if (isRma || !salesReturn?.lines?.length) return;
    setInspectDrafts(
      salesReturn.lines.map((line) => ({
        id: line.id,
        product_id: Number(line.product_id),
        productName: line.product?.name || "-",
        sku: line.product?.sku,
        quantity_returned: Number(line.quantity_returned || 0),
        quantity_received: Number(line.quantity_received ?? line.quantity_returned ?? 0),
        quantity_rejected: Number(line.quantity_rejected || 0),
        unit_price: Number(line.unit_price || 0),
        reason: line.reason || "",
        condition: line.condition || "good",
      })),
    );
  }, [isRma, salesReturn?.id, salesReturn?.lines]);

  const run = async (action: () => Promise<unknown>, message: string) => {
    setActionLoading(true);
    try {
      await action();
      toast.success(message);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Thao tác thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const canSubmitRma = isRma && rma?.status === "draft" && isSalesOwner;
  const canApproveRma = isRma && rma?.approval_status === "waiting_approval" && isSalesApprover;
  const canCreateReturn =
    isRma && rma?.approval_status === "approved" && rma.status === "approved" &&
    isWarehouse && returnDrafts.length > 0;
  const canInspectReturn = !isRma && salesReturn?.status === "received" && isWarehouse;
  const canCompleteReturn = !isRma && salesReturn?.status === "inspected" && isWarehouse;
  const canCreateCreditNote = !isRma && salesReturn?.status === "completed" && canCreateAccountingDocument;

  const updateReturnDraft = (index: number, patch: Partial<ReturnLineDraft>) =>
    setReturnDrafts((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  const updateInspectDraft = (index: number, patch: Partial<ReturnLineDraft>) =>
    setInspectDrafts((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  const validateLines = (lines: ReturnLineDraft[]) => {
    const selected = lines.filter((line) => Number(line.quantity_returned) > 0);
    if (selected.length === 0) { toast.error("Vui lòng nhập ít nhất một dòng hàng hoàn"); return null; }
    for (const line of selected) {
      const returned = Number(line.quantity_returned || 0);
      const received = Number(line.quantity_received || 0);
      const rejected = Number(line.quantity_rejected || 0);
      if (returned < 0 || received < 0 || rejected < 0) { toast.error("Số lượng không được âm"); return null; }
      if (line.orderedQty != null && returned > line.orderedQty) {
        toast.error(`Số lượng hoàn của ${line.productName} vượt quá số lượng đã bán`); return null;
      }
      if (received + rejected !== returned) {
        toast.error(`${line.productName}: SL nhận lại + SL không nhận phải bằng SL khách trả (${returned})`); return null;
      }
    }
    return selected;
  };

  const handleCreateReturn = () => {
    if (!warehouseId) { toast.error("Vui lòng chọn kho nhận hàng hoàn"); return; }
    const selected = validateLines(returnDrafts);
    if (!selected) return;
    run(
      () => createReturnFromRma(numericId, {
        warehouse_id: Number(warehouseId),
        notes: returnNotes.trim() || null,
        lines: selected.map((line) => ({
          product_id: line.product_id,
          quantity_returned: Number(line.quantity_returned || 0),
          quantity_received: Number(line.quantity_received || 0),
          quantity_rejected: Number(line.quantity_rejected || 0),
          unit_price: Number(line.unit_price || 0),
          reason: line.reason.trim() || rma?.reason || null,
          condition: line.condition,
        })),
      }),
      "Đã tạo phiếu hoàn từ RMA",
    );
  };

  const handleInspectReturn = () => {
    const selected = validateLines(inspectDrafts);
    if (!selected) return;
    run(
      () => inspectReturn(numericId, {
        lines: selected.map((line) => ({
          id: line.id,
          quantity_received: Number(line.quantity_received || 0),
          quantity_rejected: Number(line.quantity_rejected || 0),
          condition: line.condition,
          reason: line.reason.trim() || null,
        })),
      }),
      "Đã kiểm tra phiếu hoàn",
    );
  };

  const pageTitle = isRma
    ? (rma?.rma_no || "Chi tiết RMA")
    : (salesReturn?.return_no || "Chi tiết phiếu hoàn");

  const pageActions = [
    { label: "Quay lại", variant: "outline" as const, onClick: () => navigate(backPath) },
    ...(canSubmitRma ? [{
      label: actionLoading ? "Đang xử lý..." : "Gửi duyệt",
      variant: "primary" as const,
      onClick: () => run(() => submitRma(numericId), "Đã gửi duyệt RMA"),
      isLoading: actionLoading,
      disabled: actionLoading,
      icon: <Send className="h-3.5 w-3.5" />,
    }] : []),
    ...(canApproveRma ? [{
      label: actionLoading ? "Đang xử lý..." : "Duyệt RMA",
      variant: "success" as const,
      onClick: () => run(() => approveRma(numericId), "Đã duyệt RMA"),
      isLoading: actionLoading,
      disabled: actionLoading,
      icon: <CheckCircle className="h-3.5 w-3.5" />,
    }] : []),
    ...(canCompleteReturn ? [{
      label: actionLoading ? "Đang xử lý..." : "Hoàn tất",
      variant: "success" as const,
      onClick: () => run(() => completeReturn(numericId), "Đã hoàn tất phiếu hoàn"),
      isLoading: actionLoading,
      disabled: actionLoading,
      icon: <CheckCircle className="h-3.5 w-3.5" />,
    }] : []),
    ...(canCreateCreditNote ? [{
      label: actionLoading ? "Đang xử lý..." : "Tạo chứng từ ghi có",
      variant: "primary" as const,
      onClick: () => run(() => createCreditNote(numericId), "Đã tạo credit note"),
      isLoading: actionLoading,
      disabled: actionLoading,
      icon: <FilePlus2 className="h-3.5 w-3.5" />,
    }] : []),
  ];

  const sidebarContent = (
    <>
      {/* Timeline */}
      <FormSection title="Tiến trình xử lý" icon={<RotateCcw className="w-4 h-4" />}>
        <div className="space-y-3">
          <TimelineItem done label="Sales tạo yêu cầu RMA" />
          <TimelineItem
            active={rma?.approval_status === "waiting_approval"}
            done={["approved", "rejected"].includes(rma?.approval_status || "")}
            label="Quản lý duyệt RMA"
          />
          <TimelineItem
            active={rma?.status === "approved" && !salesReturn}
            done={Boolean(salesReturn)}
            label="Kho tạo phiếu hoàn"
          />
          <TimelineItem
            active={salesReturn?.status === "received"}
            done={["inspected", "completed"].includes(salesReturn?.status || "")}
            label="Kho kiểm tra hàng"
          />
          <TimelineItem
            active={salesReturn?.status === "inspected"}
            done={salesReturn?.status === "completed"}
            label="Hoàn tất & kế toán xử lý"
          />
        </div>
      </FormSection>

      {/* Meta */}
      <FormSection title="Thông tin chứng từ" icon={<Package className="w-4 h-4" />}>
        <div className="space-y-2.5 text-sm">
          {isRma ? (
            <>
              <MetaRow label="Số RMA" value={<span className="font-semibold text-orange-600">{rma?.rma_no}</span>} />
              <MetaRow label="Hướng xử lý" value={RETURN_TYPE_LABEL[rma?.return_type || ""] || "—"} />
              <MetaRow label="Giá trị" value={fmtMoney(rma?.total_return_amount, currencyCode)} />
            </>
          ) : (
            <>
              <MetaRow label="Số phiếu hoàn" value={<span className="font-semibold text-orange-600">{salesReturn?.return_no}</span>} />
              <MetaRow label="Ngày hoàn" value={fmtDate(salesReturn?.return_date)} />
              <MetaRow label="Kho nhận" value={(salesReturn as any)?.warehouse?.name || "—"} />
              <MetaRow label="Giá trị" value={fmtMoney(salesReturn?.total_return_amount, currencyCode)} />
              {salesReturn?.stock_move_id && (
                <MetaRow
                  label="Phiếu kho"
                  value={
                    <Link to={`/inventory/stock_move/view/${salesReturn.stock_move_id}`} className="font-medium text-orange-600 hover:underline">
                      Xem phiếu kho
                    </Link>
                  }
                />
              )}
            </>
          )}
          {saleOrder && (
            <MetaRow
              label="Đơn hàng gốc"
              value={
                orderDetail ? (
                  <Link to={`/sales/orders/${orderDetail.id}`} className="font-medium text-orange-600 hover:underline">
                    {saleOrder.order_no}
                  </Link>
                ) : saleOrder.order_no || "—"
              }
            />
          )}
          <MetaRow label="Trạng thái" value={subject ? <StatusBadge status={subject.status} /> : "—"} />
          {"approval_status" in (subject || {}) && (subject as any)?.approval_status !== subject?.status && (
            <MetaRow label="Duyệt" value={<StatusBadge status={(subject as any).approval_status} />} />
          )}
        </div>
      </FormSection>
    </>
  );

  return (
    <StandardFormLayout
      title={pageTitle}
      loading={loading}
      statusBadge={subject ? <StatusBadge status={subject.status} /> : undefined}
      actions={pageActions}
      sidebarContent={sidebarContent}
    >
      {loadError && !subject ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-center">
          <p className="text-sm font-medium text-red-700">{loadError}</p>
          <p className="mt-1 text-xs text-red-500">Hãy chắc rằng RMA đã được kho tạo phiếu hoàn trước đó.</p>
        </div>
      ) : (
        <>
          {/* Thông tin chung */}
          <FormSection title={isRma ? "Thông tin RMA" : "Thông tin phiếu hoàn"} icon={<RotateCcw className="w-4 h-4" />}>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="Khách hàng" value={customer?.name || "—"} />
              <InfoRow label="Điện thoại" value={customer?.phone || "—"} />
              <InfoRow label="Email" value={customer?.email || "—"} />
              <InfoRow label="Đơn hàng gốc" value={saleOrder?.order_no || "—"} />
            </div>
            {rma?.reason && (
              <div className="mt-4 rounded-md border border-gray-200 bg-gray-50/60 px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Lý do hoàn hàng</p>
                <p className="whitespace-pre-wrap text-sm text-gray-800">{rma.reason}</p>
              </div>
            )}
            {(rma?.notes || rma?.reject_reason) && (
              <div className="mt-3 rounded-md border border-amber-100 bg-amber-50 px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-600">
                  {rma?.reject_reason ? "Lý do từ chối" : "Ghi chú"}
                </p>
                <p className="whitespace-pre-wrap text-sm text-gray-700">{rma?.reject_reason || rma?.notes}</p>
              </div>
            )}
          </FormSection>

          {/* Form kho tạo phiếu hoàn */}
          {canCreateReturn && (
            <FormSection
              title="Kho tạo phiếu hoàn"
              icon={<Package className="w-4 h-4" />}
              action={
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleCreateReturn}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-orange-500 px-3 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FilePlus2 className="h-3.5 w-3.5" />}
                  Tạo phiếu hoàn
                </button>
              }
            >
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[minmax(200px,280px)_1fr]">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Kho nhận hàng hoàn <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={warehouseId}
                      onChange={(e) => setWarehouseId(e.target.value)}
                      className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="">— Chọn kho nhận —</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-700">
                    <Info className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                    Hàng đạt (SL nhận lại) sẽ được cộng vào tồn kho sau khi hoàn tất phiếu.
                  </div>
                </div>
                <EditableReturnLinesTable lines={returnDrafts} currencyCode={currencyCode} onChangeLine={updateReturnDraft} showOrdered />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Ghi chú kho</label>
                  <textarea
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    rows={2}
                    placeholder="Ghi chú khi nhận hàng hoàn..."
                    className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>
            </FormSection>
          )}

          {/* Form kho kiểm tra */}
          {canInspectReturn && (
            <FormSection
              title="Kho kiểm tra hàng hoàn"
              icon={<ClipboardCheck className="w-4 h-4" />}
              action={
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleInspectReturn}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-orange-500 px-3 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardCheck className="h-3.5 w-3.5" />}
                  Xác nhận kiểm tra
                </button>
              }
            >
              <EditableReturnLinesTable lines={inspectDrafts} currencyCode={currencyCode} onChangeLine={updateInspectDraft} />
            </FormSection>
          )}

          {/* Danh sách sản phẩm */}
          <FormSection
            title={isRma ? "Sản phẩm trong đơn hàng gốc" : "Dòng hàng hoàn"}
            icon={<Package className="w-4 h-4" />}
          >
            {isRma
              ? <OrderLinesTable lines={orderLines} currencyCode={currencyCode} />
              : <ReturnLinesTable lines={salesReturn?.lines || []} currencyCode={currencyCode} />
            }
          </FormSection>
        </>
      )}
    </StandardFormLayout>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-right text-xs font-medium text-gray-900">{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs text-gray-400">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}

function TimelineItem({ label, active, done }: { label: string; active?: boolean; done?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
        done
          ? "border-green-500 bg-green-500 text-white"
          : active
            ? "border-orange-500 bg-orange-50 text-orange-600"
            : "border-gray-300 bg-white text-gray-300"
      }`}>
        {done ? "✓" : ""}
      </span>
      <p className={`text-sm leading-snug ${done || active ? "font-medium text-gray-900" : "text-gray-400"}`}>{label}</p>
    </div>
  );
}

function EditableReturnLinesTable({
  lines, currencyCode, showOrdered, onChangeLine,
}: {
  lines: ReturnLineDraft[];
  currencyCode: string;
  showOrdered?: boolean;
  onChangeLine: (index: number, patch: Partial<ReturnLineDraft>) => void;
}) {
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-gray-100 bg-gray-50/80">
            <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Sản phẩm</th>
            {showOrdered && <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Đã bán</th>}
            <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">SL khách trả</th>
            <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">SL nhận lại</th>
            <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">SL không nhận</th>
            <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Tình trạng</th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Đơn giá ({currencyCode})</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Ghi chú</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lines.map((line, index) => (
            <tr key={`${line.product_id}-${line.id ?? index}`} className="hover:bg-orange-50/20">
              <td className="px-5 py-3">
                <p className="font-medium text-gray-900">{line.productName}</p>
                <p className="text-xs text-gray-400">{line.sku || "—"}</p>
              </td>
              {showOrdered && (
                <td className="px-4 py-3 text-center text-sm text-gray-600">
                  {Number(line.orderedQty || 0).toLocaleString("vi-VN")}
                </td>
              )}
              <td className="px-4 py-3">
                <QuantityInput
                  value={line.quantity_returned}
                  onChange={(value) => onChangeLine(index, {
                    quantity_returned: value,
                    quantity_received: Math.min(line.quantity_received, value),
                    quantity_rejected: Math.max(0, value - Math.min(line.quantity_received, value)),
                  })}
                />
              </td>
              <td className="px-4 py-3">
                <QuantityInput
                  value={line.quantity_received}
                  onChange={(value) => onChangeLine(index, {
                    quantity_received: value,
                    quantity_rejected: Math.max(0, line.quantity_returned - value),
                  })}
                />
              </td>
              <td className="px-4 py-3">
                <QuantityInput value={line.quantity_rejected} onChange={(value) => onChangeLine(index, { quantity_rejected: value })} />
              </td>
              <td className="px-4 py-3">
                <select
                  value={line.condition}
                  onChange={(e) => onChangeLine(index, { condition: e.target.value as ReturnLineDraft["condition"] })}
                  className="h-8 w-28 rounded-md border border-gray-200 bg-white px-2 text-xs focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="good">Đạt</option>
                  <option value="damaged">Hư hỏng</option>
                  <option value="defective">Lỗi</option>
                </select>
              </td>
              <td className="px-4 py-3 text-right text-sm text-gray-600">{fmtMoney(line.unit_price, currencyCode)}</td>
              <td className="px-4 py-3">
                <input
                  value={line.reason}
                  onChange={(e) => onChangeLine(index, { reason: e.target.value })}
                  placeholder="Lý do/ghi chú"
                  className="h-8 w-40 rounded-md border border-gray-200 px-2 text-xs focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuantityInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      step="0.01"
      value={Number(value || 0)}
      onChange={(e) => onChange(Number(e.target.value || 0))}
      className="h-8 w-20 rounded-md border border-gray-200 px-2 text-right text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
    />
  );
}

function OrderLinesTable({ lines, currencyCode }: { lines: SaleOrderDto["lines"]; currencyCode: string }) {
  if (!lines.length) return <EmptyLines />;
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-gray-100 bg-gray-50/80">
            <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Sản phẩm</th>
            <th className="px-5 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">SL / ĐVT</th>
            <th className="px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Đơn giá ({currencyCode})</th>
            <th className="px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Thành tiền ({currencyCode})</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lines.map((line, index) => {
            const productUom = (line.product as any)?.uom;
            const uomCode = line.uom?.code || productUom?.code || "";
            return (
              <tr key={line.id ?? index} className="hover:bg-orange-50/20">
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">{line.product?.name || "—"}</p>
                  <p className="text-xs text-gray-400">{(line.product as any)?.sku || "—"}</p>
                </td>
                <td className="px-5 py-3 text-center font-semibold text-gray-800">
                  {Number(line.quantity || 0).toLocaleString("vi-VN")} {uomCode}
                </td>
                <td className="px-5 py-3 text-right text-gray-600">{fmtMoney(line.unit_price, currencyCode)}</td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">{fmtMoney(line.line_total_after_tax, currencyCode)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReturnLinesTable({ lines, currencyCode }: { lines: SalesReturnDto["lines"]; currencyCode: string }) {
  if (!lines || !lines.length) return <EmptyLines />;
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-gray-100 bg-gray-50/80">
            <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Sản phẩm</th>
            <th className="px-5 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Khách trả</th>
            <th className="px-5 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Nhận lại</th>
            <th className="px-5 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Không nhận</th>
            <th className="px-5 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Tình trạng</th>
            <th className="px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Đơn giá ({currencyCode})</th>
            <th className="px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Thành tiền ({currencyCode})</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lines.map((line, index) => (
            <tr key={line.id ?? index} className="hover:bg-orange-50/20">
              <td className="px-5 py-3">
                <p className="font-medium text-gray-900">{line.product?.name || "—"}</p>
                <p className="text-xs text-gray-400">{line.product?.sku || "—"}</p>
              </td>
              <td className="px-5 py-3 text-center font-semibold text-gray-800">{Number(line.quantity_returned || 0).toLocaleString("vi-VN")}</td>
              <td className="px-5 py-3 text-center font-semibold text-green-700">{Number(line.quantity_received || 0).toLocaleString("vi-VN")}</td>
              <td className="px-5 py-3 text-center font-semibold text-red-600">{Number(line.quantity_rejected || 0).toLocaleString("vi-VN")}</td>
              <td className="px-5 py-3 text-center">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  line.condition === "good" ? "bg-green-50 text-green-700" :
                  line.condition === "damaged" ? "bg-amber-50 text-amber-700" :
                  "bg-red-50 text-red-700"
                }`}>
                  {CONDITION_LABEL[line.condition || "good"]}
                </span>
              </td>
              <td className="px-5 py-3 text-right text-gray-600">{fmtMoney(line.unit_price, currencyCode)}</td>
              <td className="px-5 py-3 text-right font-semibold text-gray-900">{fmtMoney(line.line_total, currencyCode)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyLines() {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
      <Package className="h-8 w-8 text-gray-200" />
      <p className="text-sm">Chưa có dòng hàng.</p>
    </div>
  );
}
