import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  ClipboardCheck,
  FilePlus2,
  Loader2,
  Package,
  RotateCcw,
  Send,
} from "lucide-react";
import { toast } from "react-toastify";
import { StatusBadge } from "@/components/common";
import { useAppSelector } from "@/store/hooks";
import { SaleOrderDto } from "../dto/saleOrder.dto";
import { SalesReturnAuthorizationDto, SalesReturnDto } from "../dto/salesReturn.dto";
import { getSaleOrderById } from "../service/saleOrder.service";
import {
  approveRma,
  completeReturn,
  createCreditNote,
  createReturnFromRma,
  getReturn,
  getRma,
  inspectReturn,
  submitRma,
} from "../service/salesReturn.service";

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
  credit_note: "Credit Note",
  refund: "Hoàn tiền",
  replacement: "Đổi hàng",
};

const CONDITION_LABEL: Record<string, string> = {
  good: "Đạt",
  damaged: "Hư hỏng",
  defective: "Lỗi",
};

const fmtDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "-";

const fmtMoney = (value?: number | null, currency = "VND") =>
  value != null ? `${Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} ${currency}` : "-";

export default function SalesReturnDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { kind = "rmas", id = "" } = useParams();
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role?.code;
  const isRma = kind === "rmas";
  const numericId = Number(id);

  const [rma, setRma] = useState<SalesReturnAuthorizationDto | null>(null);
  const [salesReturn, setSalesReturn] = useState<SalesReturnDto | null>(null);
  const [orderDetail, setOrderDetail] = useState<SaleOrderDto | null>(null);
  const [returnDrafts, setReturnDrafts] = useState<ReturnLineDraft[]>([]);
  const [inspectDrafts, setInspectDrafts] = useState<ReturnLineDraft[]>([]);
  const [returnNotes, setReturnNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const isSalesOwner = role === "SALES" && rma?.created_by === user?.id;
  const isSalesApprover = role === "SALESMANAGER" || role === "BRANCH_MANAGER";
  const isWarehouse = role === "WHSTAFF" || role === "WHMANAGER";
  const isAccountant = role === "ACCOUNT";
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
        setSalesReturn(null);
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

  useEffect(() => {
    load();
  }, [kind, id]);

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
    isRma &&
    rma?.approval_status === "approved" &&
    rma.status === "approved" &&
    isWarehouse &&
    returnDrafts.length > 0;
  const canInspectReturn = !isRma && salesReturn?.status === "received" && isWarehouse;
  const canCompleteReturn = !isRma && salesReturn?.status === "inspected" && isWarehouse;
  const canCreateCreditNote = !isRma && salesReturn?.status === "completed" && isAccountant;

  const updateReturnDraft = (index: number, patch: Partial<ReturnLineDraft>) => {
    setReturnDrafts((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const updateInspectDraft = (index: number, patch: Partial<ReturnLineDraft>) => {
    setInspectDrafts((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const validateLines = (lines: ReturnLineDraft[]) => {
    const selected = lines.filter((line) => Number(line.quantity_returned) > 0);
    if (selected.length === 0) {
      toast.error("Vui lòng nhập ít nhất một dòng hàng hoàn");
      return null;
    }

    for (const line of selected) {
      const returned = Number(line.quantity_returned || 0);
      const received = Number(line.quantity_received || 0);
      const rejected = Number(line.quantity_rejected || 0);
      if (returned < 0 || received < 0 || rejected < 0) {
        toast.error("Số lượng không được âm");
        return null;
      }
      if (line.orderedQty != null && returned > line.orderedQty) {
        toast.error(`Số lượng hoàn của ${line.productName} vượt quá số lượng đã bán`);
        return null;
      }
      if (received + rejected > returned) {
        toast.error(`Số lượng nhận và loại của ${line.productName} không được vượt quá số lượng hoàn`);
        return null;
      }
    }

    return selected;
  };

  const handleCreateReturn = () => {
    const selected = validateLines(returnDrafts);
    if (!selected) return;

    run(
      () =>
        createReturnFromRma(numericId, {
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
      () =>
        inspectReturn(numericId, {
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

  if (loading) {
    return (
      <div className="page-container">
        <div className="erp-card flex items-center justify-center gap-2 py-16 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          <span>Đang tải chi tiết hoàn hàng...</span>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="page-container">
        <div className="erp-card space-y-3 py-16 text-center">
          <p className="text-sm font-semibold text-gray-700">Không tìm thấy chứng từ hoàn hàng.</p>
          <p className="text-xs text-gray-400">
            {loadError || "Nếu bạn đang mở phiếu hoàn, hãy chắc rằng RMA đã được kho tạo phiếu hoàn trước đó."}
          </p>
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="inline-flex h-8 items-center rounded-md bg-orange-500 px-3 text-sm font-medium text-white"
          >
            Về danh sách hoàn hàng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {canSubmitRma && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => run(() => submitRma(numericId), "Đã gửi duyệt RMA")}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-orange-500 px-3 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
              >
                <Send className="h-3.5 w-3.5" />
                Gửi duyệt
              </button>
            )}
            {canApproveRma && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => run(() => approveRma(numericId), "Đã duyệt RMA")}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-green-600 px-3 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Duyệt RMA
              </button>
            )}
            {canCompleteReturn && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => run(() => completeReturn(numericId), "Đã hoàn tất phiếu hoàn")}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-green-600 px-3 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Hoàn tất
              </button>
            )}
            {canCreateCreditNote && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => run(() => createCreditNote(numericId), "Đã tạo credit note")}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-orange-500 px-3 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
              >
                <FilePlus2 className="h-3.5 w-3.5" />
                Tạo Credit Note
              </button>
            )}
          </div>
        </div>

        <div className="erp-card overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                <RotateCcw className="h-4.5 w-4.5 text-orange-500" />
              </span>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {isRma ? rma?.rma_no : salesReturn?.return_no}
                </h1>
                <p className="mt-0.5 text-xs text-gray-400">
                  {isRma ? "Yêu cầu hoàn hàng cần được duyệt trước khi kho nhận hàng" : "Phiếu kho ghi nhận hàng khách trả về"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={subject.status} />
              {"approval_status" in subject && subject.approval_status !== subject.status && (
                <StatusBadge status={subject.approval_status} />
              )}
            </div>
          </div>

          <div className="grid gap-5 p-5 lg:grid-cols-[1.4fr_1fr]">
            <section className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="Khách hàng" value={customer?.name || "-"} />
                <InfoRow label="Điện thoại" value={customer?.phone || "-"} />
                <InfoRow label="Email" value={customer?.email || "-"} />
                <InfoRow label="Đơn hàng gốc" value={saleOrder?.order_no || "-"} />
                {isRma ? (
                  <>
                    <InfoRow label="Hướng xử lý" value={RETURN_TYPE_LABEL[rma?.return_type || ""] || "-"} />
                    <InfoRow label="Giá trị dự kiến" value={fmtMoney(rma?.total_return_amount, currencyCode)} />
                  </>
                ) : (
                  <>
                    <InfoRow label="Ngày hoàn" value={fmtDate(salesReturn?.return_date)} />
                    <InfoRow label="Kho nhận" value={(salesReturn as any)?.warehouse?.name || "-"} />
                  </>
                )}
              </div>

              <div className="rounded-md border border-gray-200 bg-gray-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lý do hoàn hàng</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{rma?.reason || salesReturn?.notes || "-"}</p>
              </div>

              {(rma?.notes || salesReturn?.notes || rma?.reject_reason) && (
                <div className="rounded-md border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ghi chú</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                    {rma?.reject_reason || rma?.notes || salesReturn?.notes}
                  </p>
                </div>
              )}
            </section>

            <aside className="rounded-md border border-gray-200 bg-gray-50/60">
              <div className="border-b border-gray-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Luồng xử lý và người phụ trách</p>
              </div>
              <div className="space-y-3 p-4">
                <TimelineItem active done label="Sales tạo yêu cầu RMA" />
                <TimelineItem
                  active={rma?.approval_status === "waiting_approval"}
                  done={["approved", "rejected"].includes(rma?.approval_status || "")}
                  label="Sales Manager hoặc Trưởng chi nhánh duyệt RMA"
                />
                <TimelineItem
                  active={rma?.status === "approved" || salesReturn?.status === "received"}
                  done={Boolean(salesReturn)}
                  label="Kho tạo phiếu hoàn và nhận hàng trả về"
                />
                <TimelineItem
                  active={salesReturn?.status === "received"}
                  done={["inspected", "completed"].includes(salesReturn?.status || "")}
                  label="Kho kiểm tra số lượng và tình trạng hàng"
                />
                <TimelineItem
                  active={salesReturn?.status === "inspected"}
                  done={salesReturn?.status === "completed"}
                  label="Kho hoàn tất, kế toán xử lý Credit Note hoặc hoàn tiền"
                />
              </div>
            </aside>
          </div>
        </div>

        {canCreateReturn && (
          <WarehouseReturnForm
            lines={returnDrafts}
            notes={returnNotes}
            currencyCode={currencyCode}
            saving={actionLoading}
            onChangeLine={updateReturnDraft}
            onChangeNotes={setReturnNotes}
            onSubmit={handleCreateReturn}
          />
        )}

        {canInspectReturn && (
          <WarehouseInspectForm
            lines={inspectDrafts}
            currencyCode={currencyCode}
            saving={actionLoading}
            onChangeLine={updateInspectDraft}
            onSubmit={handleInspectReturn}
          />
        )}

        <div className="erp-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
            <div className="flex items-center gap-2">
              <Package className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-sm font-semibold text-gray-800">
                {isRma ? "Sản phẩm trong đơn hàng gốc" : "Dòng hàng hoàn"}
              </span>
            </div>
            {orderDetail && (
              <Link to={`/sales/orders/${orderDetail.id}`} className="text-xs font-medium text-orange-600 hover:text-orange-700">
                Xem đơn hàng
              </Link>
            )}
          </div>

          {isRma ? (
            <OrderLinesTable lines={orderLines} currencyCode={currencyCode} />
          ) : (
            <ReturnLinesTable lines={salesReturn?.lines || []} currencyCode={currencyCode} />
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs text-gray-400">{label}</p>
      <div className="mt-1 text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}

function TimelineItem({ label, active, done }: { label: string; active?: boolean; done?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
          done
            ? "border-green-500 bg-green-500 text-white"
            : active
              ? "border-orange-500 bg-orange-50 text-orange-600"
              : "border-gray-300 bg-white text-gray-300"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      <p className={`text-sm ${done || active ? "text-gray-900" : "text-gray-400"}`}>{label}</p>
    </div>
  );
}

function WarehouseReturnForm({
  lines,
  notes,
  currencyCode,
  saving,
  onChangeLine,
  onChangeNotes,
  onSubmit,
}: {
  lines: ReturnLineDraft[];
  notes: string;
  currencyCode: string;
  saving: boolean;
  onChangeLine: (index: number, patch: Partial<ReturnLineDraft>) => void;
  onChangeNotes: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="erp-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Kho tạo phiếu hoàn</h2>
          <p className="mt-0.5 text-xs text-gray-400">Nhập số lượng khách trả, số lượng kho nhận và số lượng loại nếu có.</p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={onSubmit}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FilePlus2 className="h-3.5 w-3.5" />}
          Tạo phiếu hoàn
        </button>
      </div>
      <EditableReturnLinesTable lines={lines} currencyCode={currencyCode} onChangeLine={onChangeLine} showOrdered />
      <div className="border-t border-gray-100 p-5">
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Ghi chú kho</label>
        <textarea
          value={notes}
          onChange={(event) => onChangeNotes(event.target.value)}
          rows={2}
          placeholder="Ghi chú khi nhận hàng hoàn..."
          className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
    </div>
  );
}

function WarehouseInspectForm({
  lines,
  currencyCode,
  saving,
  onChangeLine,
  onSubmit,
}: {
  lines: ReturnLineDraft[];
  currencyCode: string;
  saving: boolean;
  onChangeLine: (index: number, patch: Partial<ReturnLineDraft>) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="erp-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Kho kiểm tra hàng hoàn</h2>
          <p className="mt-0.5 text-xs text-gray-400">Xác nhận số lượng đạt, số lượng loại và tình trạng hàng trước khi hoàn tất.</p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={onSubmit}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardCheck className="h-3.5 w-3.5" />}
          Xác nhận kiểm tra
        </button>
      </div>
      <EditableReturnLinesTable lines={lines} currencyCode={currencyCode} onChangeLine={onChangeLine} />
    </div>
  );
}

function EditableReturnLinesTable({
  lines,
  currencyCode,
  showOrdered,
  onChangeLine,
}: {
  lines: ReturnLineDraft[];
  currencyCode: string;
  showOrdered?: boolean;
  onChangeLine: (index: number, patch: Partial<ReturnLineDraft>) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/80">
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Sản phẩm</th>
            {showOrdered && <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Đã bán</th>}
            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">SL hoàn</th>
            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">SL nhận</th>
            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">SL loại</th>
            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Tình trạng</th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Đơn giá ({currencyCode})</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Ghi chú dòng</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lines.map((line, index) => (
            <tr key={`${line.product_id}-${line.id ?? index}`}>
              <td className="px-5 py-3">
                <p className="font-medium text-gray-900">{line.productName}</p>
                <p className="text-xs text-gray-400">{line.sku || "-"}</p>
              </td>
              {showOrdered && (
                <td className="px-5 py-3 text-center text-sm text-gray-600">
                  {Number(line.orderedQty || 0).toLocaleString("vi-VN")}
                </td>
              )}
              <td className="px-5 py-3">
                <QuantityInput
                  value={line.quantity_returned}
                  onChange={(value) => onChangeLine(index, {
                    quantity_returned: value,
                    quantity_received: Math.min(line.quantity_received, value),
                    quantity_rejected: Math.min(line.quantity_rejected, value),
                  })}
                />
              </td>
              <td className="px-5 py-3">
                <QuantityInput value={line.quantity_received} onChange={(value) => onChangeLine(index, { quantity_received: value })} />
              </td>
              <td className="px-5 py-3">
                <QuantityInput value={line.quantity_rejected} onChange={(value) => onChangeLine(index, { quantity_rejected: value })} />
              </td>
              <td className="px-5 py-3">
                <select
                  value={line.condition}
                  onChange={(event) => onChangeLine(index, { condition: event.target.value as ReturnLineDraft["condition"] })}
                  className="h-8 w-28 rounded-md border border-gray-200 bg-white px-2 text-xs focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="good">Đạt</option>
                  <option value="damaged">Hư hỏng</option>
                  <option value="defective">Lỗi</option>
                </select>
              </td>
              <td className="px-5 py-3 text-right text-gray-600">{fmtMoney(line.unit_price, currencyCode)}</td>
              <td className="px-5 py-3">
                <input
                  value={line.reason}
                  onChange={(event) => onChangeLine(index, { reason: event.target.value })}
                  placeholder="Lý do/ghi chú"
                  className="h-8 w-44 rounded-md border border-gray-200 px-2 text-xs focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
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
      onChange={(event) => onChange(Number(event.target.value || 0))}
      className="h-8 w-24 rounded-md border border-gray-200 px-2 text-right text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
    />
  );
}

function OrderLinesTable({ lines, currencyCode }: { lines: SaleOrderDto["lines"]; currencyCode: string }) {
  if (lines.length === 0) {
    return <EmptyLines />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/80">
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Sản phẩm</th>
            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">SL / UOM</th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Đơn giá ({currencyCode})</th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Thành tiền ({currencyCode})</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lines.map((line, index) => {
            const productUom = (line.product as any)?.uom;
            const uomCode = line.uom?.code || productUom?.code || "-";
            const uomName = line.uom?.name || productUom?.name || "Đơn vị tính";

            return (
              <tr key={line.id ?? index}>
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">{line.product?.name || "-"}</p>
                  <p className="text-xs text-gray-400">{(line.product as any)?.sku || "-"}</p>
                </td>
                <td className="px-5 py-3 text-center font-semibold text-gray-800">
                  {Number(line.quantity || 0).toLocaleString("vi-VN")} {uomCode}
                  <p className="text-[11px] font-normal text-gray-400">{uomName}</p>
                </td>
                <td className="px-5 py-3 text-right text-gray-600">{fmtMoney(line.unit_price, currencyCode)}</td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">
                  {fmtMoney(line.line_total_after_tax, currencyCode)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReturnLinesTable({ lines, currencyCode }: { lines: SalesReturnDto["lines"]; currencyCode: string }) {
  if (!lines || lines.length === 0) {
    return <EmptyLines />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/80">
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Sản phẩm</th>
            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Hoàn / nhận / loại</th>
            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Tình trạng</th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Đơn giá ({currencyCode})</th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Thành tiền ({currencyCode})</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lines.map((line, index) => (
            <tr key={line.id ?? index}>
              <td className="px-5 py-3">
                <p className="font-medium text-gray-900">{line.product?.name || "-"}</p>
                <p className="text-xs text-gray-400">{line.product?.sku || "-"}</p>
              </td>
              <td className="px-5 py-3 text-center text-sm text-gray-700">
                {Number(line.quantity_returned || 0).toLocaleString("vi-VN")} /{" "}
                {Number(line.quantity_received || 0).toLocaleString("vi-VN")} /{" "}
                {Number(line.quantity_rejected || 0).toLocaleString("vi-VN")}
              </td>
              <td className="px-5 py-3 text-center text-xs text-gray-500">
                {CONDITION_LABEL[line.condition || "good"] || "-"}
              </td>
              <td className="px-5 py-3 text-right text-gray-600">{fmtMoney(line.unit_price, currencyCode)}</td>
              <td className="px-5 py-3 text-right font-semibold text-gray-900">
                {fmtMoney(line.line_total, currencyCode)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyLines() {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
      <Package className="h-8 w-8 text-gray-200" />
      <p className="text-sm">Chưa có dòng hàng.</p>
    </div>
  );
}
