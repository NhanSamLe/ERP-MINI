import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Banknote, CheckCircle2, FileText, RefreshCw, RotateCcw, Search } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Roles } from "@/types/enum";
import {
  approveCreditNote,
  approveRefund,
  createCreditNote,
  createRefund,
  getCreditNotes,
  getRefunds,
  getRmas,
  getReturns,
} from "@/features/sales/service/salesReturn.service";
import { ArCreditNoteDto, ArRefundDto, SalesReturnAuthorizationDto, SalesReturnDto } from "@/features/sales/dto/salesReturn.dto";

const METHOD_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  bank: "Ngân hàng",
  transfer: "Chuyển khoản",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Nháp",
  submitted: "Đã gửi duyệt",
  waiting_approval: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  posted: "Đã ghi sổ",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  pending: "Đang chờ",
  inspected: "Đã kiểm tra",
};

const RETURN_TYPE_LABELS: Record<string, string> = {
  credit_note: "Ghi nhận công nợ",
  refund: "Hoàn tiền",
  replacement: "Đổi hàng",
};

const fmtMoney = (value?: number | string | null, code = "VND") =>
  `${Number(value || 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} ${code}`;

const getCurrencyCode = (item?: { currency?: { code?: string }; currency_id?: number | null }) =>
  item?.currency?.code || (!item?.currency_id ? "VND" : "VND");

const toBaseAmount = (amount?: number | string | null, exchangeRate?: number | string | null) =>
  Number(amount || 0) * Number(exchangeRate || 1);

const badgeClass = (status?: string) => {
  if (status === "approved" || status === "posted" || status === "completed") return "bg-emerald-50 text-emerald-700";
  if (status === "rejected" || status === "cancelled") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
};

export default function SalesReturnAccountingPage() {
  const role = useSelector((s: RootState) => s.auth.user?.role?.code);
  const isAccountant = role === Roles.ACCOUNT;
  const isChiefAccountant = role === Roles.CHACC;
  const canCreateCreditNote = isAccountant || isChiefAccountant;

  const [rmas, setRmas] = useState<SalesReturnAuthorizationDto[]>([]);
  const [returns, setReturns] = useState<SalesReturnDto[]>([]);
  const [notes, setNotes] = useState<ArCreditNoteDto[]>([]);
  const [refunds, setRefunds] = useState<ArRefundDto[]>([]);
  const [tab, setTab] = useState<"rmas" | "returns" | "pending" | "notes" | "refunds">("rmas");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<ArCreditNoteDto | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundMethod, setRefundMethod] = useState<"cash" | "bank" | "transfer">("bank");

  const loadData = async () => {
    try {
      setLoading(true);
      const [rmaRows, returnRows, noteRows, refundRows] = await Promise.all([getRmas(), getReturns(), getCreditNotes(), getRefunds()]);
      setRmas(rmaRows);
      setReturns(returnRows);
      setNotes(noteRows);
      setRefunds(refundRows);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Không thể tải dữ liệu kế toán hàng bán trả lại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRmas = useMemo(
    () => rmas.filter((item) => {
      const text = `${item.rma_no} ${item.customer?.name || ""} ${item.saleOrder?.order_no || ""}`.toLowerCase();
      return text.includes(keyword.toLowerCase());
    }),
    [keyword, rmas],
  );

  const filteredReturns = useMemo(
    () => returns.filter((item) => {
      const text = `${item.return_no} ${item.customer?.name || ""} ${item.saleOrder?.order_no || ""}`.toLowerCase();
      return text.includes(keyword.toLowerCase());
    }),
    [keyword, returns],
  );

  const noteByReturnId = useMemo(() => {
    const map = new Map<number, ArCreditNoteDto>();
    notes.forEach((note) => {
      if (note.sales_return_id) map.set(Number(note.sales_return_id), note);
    });
    return map;
  }, [notes]);

  const returnById = useMemo(() => {
    const map = new Map<number, SalesReturnDto>();
    returns.forEach((item) => map.set(item.id, item));
    return map;
  }, [returns]);

  const refundByCreditNoteId = useMemo(() => {
    const map = new Map<number, ArRefundDto>();
    refunds.forEach((item) => {
      if (item.credit_note_id) map.set(Number(item.credit_note_id), item);
    });
    return map;
  }, [refunds]);

  const pendingReturns = useMemo(
    () =>
      returns.filter((item) => {
        const returnType = item.rma?.return_type;
        return item.status === "completed" && !noteByReturnId.has(item.id) && returnType !== "replacement";
      }).filter((item) => {
        const text = `${item.return_no} ${item.customer?.name || ""} ${item.saleOrder?.order_no || ""}`.toLowerCase();
        return text.includes(keyword.toLowerCase());
      }),
    [keyword, noteByReturnId, returns],
  );

  const filteredNotes = useMemo(
    () =>
      notes.filter((item) => {
        const text = `${item.credit_note_no} ${item.customer?.name || ""}`.toLowerCase();
        return text.includes(keyword.toLowerCase());
      }),
    [keyword, notes],
  );

  const filteredRefunds = useMemo(
    () =>
      refunds.filter((item) => {
        const text = `${item.refund_no} ${item.customer?.name || ""} ${item.creditNote?.credit_note_no || ""}`.toLowerCase();
        return text.includes(keyword.toLowerCase());
      }),
    [keyword, refunds],
  );

  const runAction = async (key: string, action: () => Promise<unknown>, message: string) => {
    try {
      setActingId(key);
      await action();
      toast.success(message);
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Thao tác thất bại");
    } finally {
      setActingId(null);
    }
  };

  const handleCreateRefund = async () => {
    if (!refundTarget) return;
    if (refundByCreditNoteId.has(refundTarget.id)) {
      toast.error("Phiếu ghi có này đã có phiếu hoàn tiền, không thể tạo thêm");
      setRefundTarget(null);
      return;
    }
    const amount = Number(refundAmount || refundTarget.total_after_tax || 0);
    const maxAmount = Number(refundTarget.total_after_tax || 0);
    if (amount <= 0) {
      toast.error("Số tiền hoàn phải lớn hơn 0");
      return;
    }
    if (amount > maxAmount + 0.0001) {
      toast.error("Số tiền hoàn không được vượt quá giá trị phiếu ghi có");
      return;
    }
    await runAction(
      `refund-${refundTarget.id}`,
      () => createRefund(refundTarget.id, { amount, method: refundMethod, notes: "Hoàn tiền từ phiếu ghi có hàng bán trả lại" }),
      "Đã tạo yêu cầu hoàn tiền",
    );
    setRefundTarget(null);
    setRefundAmount("");
    setRefundMethod("bank");
  };

  return (
    <div className="page-container">
      <div className="erp-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-200 bg-orange-50/40 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <Banknote className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Kế toán hàng bán trả lại</h1>
              <p className="mt-0.5 text-xs text-gray-500">Tạo và duyệt phiếu ghi có, xử lý hoàn tiền sau khi kho hoàn tất nhận hàng trả.</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex w-fit rounded-md border border-gray-200 bg-white p-1 flex-wrap gap-0.5">
            {[
              ["rmas",    `Yêu cầu trả hàng (${filteredRmas.length})`],
              ["returns", `Phiếu trả hàng (${filteredReturns.length})`],
              ["pending", `Chờ lập phiếu ghi có (${pendingReturns.length})`],
              ["notes",   `Phiếu ghi có (${filteredNotes.length})`],
              ["refunds", `Hoàn tiền (${filteredRefunds.length})`],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value as typeof tab)}
                className={`rounded px-3 py-1.5 text-sm font-medium ${tab === value ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm mã chứng từ, khách hàng..."
              className="h-9 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
          </div>
        ) : (
          <>
            {tab === "rmas" && (
              <DataTable
                emptyText="Chưa có yêu cầu trả hàng"
                headers={["Mã yêu cầu", "Khách hàng", "Đơn gốc", "Hình thức xử lý", "Giá trị", "Trạng thái", "Duyệt"]}
                rows={filteredRmas.map((item) => [
                  <Link className="font-semibold text-orange-600 hover:underline" to={`/sales/returns/rmas/${item.id}`}>{item.rma_no}</Link>,
                  item.customer?.name || "-",
                  item.saleOrder?.order_no || "-",
                  RETURN_TYPE_LABELS[item.return_type] || item.return_type,
                  fmtMoney(item.total_return_amount),
                  <StatusPill value={item.status} status={item.status} />,
                  <StatusPill value={item.approval_status} status={item.approval_status} />,
                ])}
              />
            )}

            {tab === "returns" && (
              <DataTable
                emptyText="Chưa có phiếu trả hàng"
                headers={["Mã phiếu trả", "Yêu cầu", "Khách hàng", "Đơn gốc", "Ngày trả", "Giá trị", "Trạng thái"]}
                rows={filteredReturns.map((item) => [
                  <Link className="font-semibold text-orange-600 hover:underline" to={`/sales/returns/returns/${item.id}`}>{item.return_no}</Link>,
                  item.rma ? (
                    <Link className="text-gray-600 hover:text-orange-600 hover:underline" to={`/sales/returns/rmas/${item.rma.id}`}>{(item.rma as any).rma_no || "-"}</Link>
                  ) : "-",
                  item.customer?.name || "-",
                  item.saleOrder?.order_no || "-",
                  item.return_date ? new Date(item.return_date).toLocaleDateString("vi-VN") : "-",
                  fmtMoney(item.total_return_amount),
                  <StatusPill value={item.status} status={item.status} />,
                ])}
              />
            )}

            {tab === "pending" && (
              <DataTable
                emptyText="Không có phiếu trả hàng chờ lập phiếu ghi có"
                headers={["Mã phiếu trả", "Khách hàng", "Đơn gốc", "Giá trị", "Trạng thái", "Thao tác"]}
                rows={pendingReturns.map((item) => [
                  <Link className="font-semibold text-orange-600 hover:underline" to={`/sales/returns/returns/${item.id}`}>{item.return_no}</Link>,
                  item.customer?.name || "-",
                  item.saleOrder?.order_no || "-",
                  fmtMoney(item.total_return_amount, (item as any).currency?.code || "VND"),
                  <StatusPill value="Kho đã hoàn tất" status="completed" />,
                  canCreateCreditNote ? (
                    <button
                      onClick={() => runAction(`note-${item.id}`, () => createCreditNote(item.id), "Đã tạo phiếu ghi có")}
                      disabled={actingId === `note-${item.id}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-orange-500 px-3 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Tạo phiếu ghi có
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">Kế toán phụ trách tạo</span>
                  ),
                ])}
              />
            )}

            {tab === "notes" && (
              <DataTable
                emptyText="Chưa có phiếu ghi có hàng trả"
                headers={["Phiếu ghi có", "Khách hàng", "Ngày lập", "Giá trị", "Trạng thái", "Duyệt", "Thao tác"]}
                rows={filteredNotes.map((item) => [
                  item.credit_note_no,
                  item.customer?.name || "-",
                  new Date(item.credit_note_date).toLocaleDateString("vi-VN"),
                  <MoneyWithBase amount={item.total_after_tax} currencyCode={getCurrencyCode(item)} exchangeRate={item.exchange_rate} />,
                  <StatusPill value={item.status} status={item.status} />,
                  <StatusPill value={item.approval_status} status={item.approval_status} />,
                  <div className="flex justify-end gap-2">
                    {isChiefAccountant && item.approval_status !== "approved" && (
                      <button
                        onClick={() => runAction(`approve-note-${item.id}`, () => approveCreditNote(item.id), "Đã duyệt phiếu ghi có")}
                        disabled={actingId === `approve-note-${item.id}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Duyệt
                      </button>
                    )}
                    {refundByCreditNoteId.has(item.id) ? (
                      <span className="inline-flex h-8 items-center rounded-md bg-gray-100 px-3 text-xs font-semibold text-gray-600">
                        Đã hoàn tiền
                      </span>
                    ) : isAccountant && item.status === "posted" && returnById.get(Number(item.sales_return_id))?.rma?.return_type === "refund" && (
                      <button
                        onClick={() => {
                          setRefundTarget(item);
                          setRefundAmount(String(Number(item.total_after_tax || 0)));
                        }}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-3 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Tạo hoàn tiền
                      </button>
                    )}
                  </div>,
                ])}
              />
            )}

            {tab === "refunds" && (
              <DataTable
                emptyText="Chưa có phiếu hoàn tiền"
                headers={["Phiếu hoàn tiền", "Phiếu ghi có", "Khách hàng", "Ngày hoàn", "Phương thức", "Số tiền", "Trạng thái", "Thao tác"]}
                rows={filteredRefunds.map((item) => [
                  item.refund_no,
                  item.creditNote?.credit_note_no || "-",
                  item.customer?.name || "-",
                  new Date(item.refund_date).toLocaleDateString("vi-VN"),
                  METHOD_LABELS[item.method] || item.method,
                  <MoneyWithBase amount={item.amount} currencyCode={getCurrencyCode(item)} exchangeRate={item.exchange_rate} />,
                  <StatusPill value={item.status} status={item.status} />,
                  isChiefAccountant && item.status !== "posted" ? (
                    <button
                      onClick={() => runAction(`approve-refund-${item.id}`, () => approveRefund(item.id), "Đã duyệt phiếu hoàn tiền")}
                      disabled={actingId === `approve-refund-${item.id}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Duyệt chi tiền
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  ),
                ])}
              />
            )}
          </>
        )}
      </div>

      {refundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">Tạo yêu cầu hoàn tiền</h2>
              <p className="mt-1 text-sm text-gray-500">{refundTarget.credit_note_no}</p>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-2 gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-gray-500">Tiền tệ phiếu ghi có</p>
                  <p className="mt-1 font-semibold text-gray-900">{getCurrencyCode(refundTarget)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Tỷ giá VND</p>
                  <p className="mt-1 font-semibold text-gray-900">{Number(refundTarget.exchange_rate || 1).toLocaleString("vi-VN")}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Giá trị phiếu ghi có</p>
                  <p className="mt-1 font-semibold text-gray-900">{fmtMoney(refundTarget.total_after_tax, getCurrencyCode(refundTarget))}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Quy đổi VND</p>
                  <p className="mt-1 font-semibold text-gray-900">{fmtMoney(toBaseAmount(refundTarget.total_after_tax, refundTarget.exchange_rate), "VND")}</p>
                </div>
              </div>
              <label className="block text-sm font-medium text-gray-700">
                Số tiền hoàn ({getCurrencyCode(refundTarget)})
                <input
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  type="number"
                  min="0"
                  max={Number(refundTarget.total_after_tax || 0)}
                  className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </label>
              <div className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Số tiền quy đổi: {fmtMoney(toBaseAmount(refundAmount || refundTarget.total_after_tax, refundTarget.exchange_rate), "VND")}
              </div>
              <label className="block text-sm font-medium text-gray-700">
                Phương thức
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value as "cash" | "bank" | "transfer")}
                  className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                >
                  <option value="bank">Ngân hàng</option>
                  <option value="transfer">Chuyển khoản</option>
                  <option value="cash">Tiền mặt</option>
                </select>
              </label>
              <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                Yêu cầu hoàn tiền sẽ được tạo ở trạng thái nháp và cần Kế toán trưởng duyệt.
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
              <button onClick={() => setRefundTarget(null)} className="h-9 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Hủy
              </button>
              <button onClick={handleCreateRefund} disabled={actingId === `refund-${refundTarget.id}`} className="h-9 rounded-md bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
                Tạo hoàn tiền
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ value, status }: { value: string; status?: string }) {
  const label = STATUS_LABELS[value] || STATUS_LABELS[status || ""] || value;
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(status)}`}>{label}</span>;
}

function MoneyWithBase({
  amount,
  currencyCode,
  exchangeRate,
}: {
  amount?: number | string | null;
  currencyCode: string;
  exchangeRate?: number | string | null;
}) {
  const rate = Number(exchangeRate || 1);
  const isBase = currencyCode === "VND" || rate === 1;
  return (
    <div className="text-right">
      <p className="font-semibold text-gray-900">{fmtMoney(amount, currencyCode)}</p>
      {!isBase && <p className="mt-0.5 text-xs text-gray-500">= {fmtMoney(toBaseAmount(amount, rate), "VND")}</p>}
    </div>
  );
}

function DataTable({
  headers,
  rows,
  emptyText,
}: {
  headers: string[];
  rows: Array<Array<ReactNode>>;
  emptyText: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
        <FileText className="h-10 w-10" />
        <p className="text-sm font-medium">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {headers.map((header, index) => (
              <th key={header} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${index === headers.length - 1 ? "text-right" : "text-left"}`}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-orange-50/30">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={`px-4 py-3 text-gray-700 ${cellIndex === row.length - 1 ? "text-right" : ""}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
