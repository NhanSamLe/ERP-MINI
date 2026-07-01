import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Eye, PackageCheck, RotateCcw, Search } from "lucide-react";
import { toast } from "react-toastify";
import { StatusBadge } from "@/components/common";
import {
  completeReturn,
  getReturns,
  getRmas,
} from "@/features/sales/service/salesReturn.service";
import { SalesReturnAuthorizationDto, SalesReturnDto } from "@/features/sales/dto/salesReturn.dto";

const fmtDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "-";

const fmtMoney = (value?: number | null) =>
  value != null ? `${Number(value).toLocaleString("vi-VN")} ₫` : "-";

export default function SalesReturnWarehousePage() {
  const [rmas, setRmas] = useState<SalesReturnAuthorizationDto[]>([]);
  const [returns, setReturns] = useState<SalesReturnDto[]>([]);
  const [tab, setTab] = useState<"waiting" | "returns">("waiting");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [rmaData, returnData] = await Promise.all([getRmas(), getReturns()]);
      setRmas(rmaData);
      setReturns(returnData);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không tải được dữ liệu hàng hoàn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const keyword = search.toLowerCase();
  const waitingRmas = useMemo(
    () =>
      rmas.filter((item) =>
        item.status === "approved" &&
        item.approval_status === "approved" &&
        (!keyword ||
          item.rma_no.toLowerCase().includes(keyword) ||
          item.saleOrder?.order_no?.toLowerCase().includes(keyword) ||
          item.customer?.name?.toLowerCase().includes(keyword)),
      ),
    [rmas, keyword],
  );

  const filteredReturns = useMemo(
    () =>
      returns.filter((item) =>
        !keyword ||
        item.return_no.toLowerCase().includes(keyword) ||
        item.rma?.rma_no?.toLowerCase().includes(keyword) ||
        item.saleOrder?.order_no?.toLowerCase().includes(keyword) ||
        item.customer?.name?.toLowerCase().includes(keyword),
      ),
    [returns, keyword],
  );

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      toast.success(message);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Thao tác thất bại");
    }
  };

  return (
    <div className="page-container">
      <div className="erp-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
              <PackageCheck className="h-4 w-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Hàng bán trả về</h1>
              <p className="mt-0.5 text-xs text-gray-400">
                Kho tạo phiếu hoàn, nhận hàng, kiểm tra và hoàn tất hàng khách trả về
              </p>
            </div>
          </div>

          <div className="relative min-w-48 max-w-sm flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="RMA, phiếu hoàn, đơn hàng, khách hàng..."
              className="h-8 w-full rounded-md border border-gray-200 bg-white pl-8 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-3">
          <div className="inline-flex rounded-md border border-gray-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setTab("waiting")}
              className={`h-7 rounded px-3 text-xs font-medium transition-colors ${
                tab === "waiting" ? "bg-orange-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              RMA chờ kho nhận ({waitingRmas.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("returns")}
              className={`h-7 rounded px-3 text-xs font-medium transition-colors ${
                tab === "returns" ? "bg-orange-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Phiếu hoàn ({filteredReturns.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
            <span className="text-sm">Đang tải...</span>
          </div>
        ) : tab === "waiting" ? (
          <WaitingRmaTable items={waitingRmas} />
        ) : (
          <ReturnReceiptTable
            items={filteredReturns}
            onComplete={(id) => run(() => completeReturn(id), "Đã hoàn tất phiếu hoàn")}
          />
        )}
      </div>
    </div>
  );
}

function WaitingRmaTable({ items }: { items: SalesReturnAuthorizationDto[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
        <RotateCcw className="h-10 w-10 text-gray-200" />
        <p className="text-sm font-medium">Không có RMA nào đang chờ kho nhận.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/80">
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">RMA</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Đơn hàng</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Khách hàng</th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Giá trị</th>
            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Trạng thái</th>
            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <tr key={item.id} className="transition-colors hover:bg-orange-50/30">
              <td className="px-5 py-3.5 font-semibold text-orange-600">{item.rma_no}</td>
              <td className="px-5 py-3.5 text-sm text-gray-600">{item.saleOrder?.order_no || "-"}</td>
              <td className="px-5 py-3.5">
                <p className="font-medium text-gray-900">{item.customer?.name || "-"}</p>
                {item.customer?.phone && <p className="mt-0.5 text-xs text-gray-400">{item.customer.phone}</p>}
              </td>
              <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{fmtMoney(item.total_return_amount)}</td>
              <td className="px-5 py-3.5 text-center">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-5 py-3.5 text-center">
                <Link
                  to={`/inventory/sales-returns/rmas/${item.id}`}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                >
                  <PackageCheck className="h-3 w-3" />
                  Tạo phiếu hoàn
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReturnReceiptTable({
  items,
  onComplete,
}: {
  items: SalesReturnDto[];
  onComplete: (id: number) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
        <PackageCheck className="h-10 w-10 text-gray-200" />
        <p className="text-sm font-medium">Chưa có phiếu hoàn nào.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/80">
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Phiếu hoàn</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">RMA</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Khách hàng</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Ngày nhận</th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Giá trị</th>
            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Trạng thái</th>
            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Phiếu kho</th>
            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => {
            const sm = (item as any).stockMove;
            return (
              <tr key={item.id} className="transition-colors hover:bg-orange-50/30">
                <td className="px-5 py-3.5 font-semibold text-orange-600">{item.return_no}</td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{item.rma?.rma_no || "-"}</td>
                <td className="px-5 py-3.5">
                  <p className="font-medium text-gray-900">{item.customer?.name || "-"}</p>
                  {item.customer?.phone && <p className="mt-0.5 text-xs text-gray-400">{item.customer.phone}</p>}
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{fmtDate(item.return_date)}</td>
                <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{fmtMoney(item.total_return_amount)}</td>
                <td className="px-5 py-3.5 text-center">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-5 py-3.5 text-center text-xs font-medium">
                  {sm ? (
                    <div className="flex flex-col items-center">
                      <Link to={`/inventory/stock_move/view/${sm.id}`} className="text-orange-600 hover:underline">
                        {sm.move_no}
                      </Link>
                      <span className={`text-[10px] mt-0.5 px-1.5 py-0.2 rounded-full font-bold ${
                        sm.status === "posted" ? "bg-green-100 text-green-700" :
                        sm.status === "waiting_approval" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {sm.status === "posted" ? "Đã duyệt" : sm.status === "waiting_approval" ? "Chờ duyệt" : "Nháp"}
                      </span>
                    </div>
                  ) : "—"}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-center gap-1">
                    <Link
                      to={`/inventory/sales-returns/returns/${item.id}`}
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                    >
                      <Eye className="h-3 w-3" />
                      Xem
                    </Link>
                    {item.status === "inspected" && (
                      <button
                        type="button"
                        onClick={() => onComplete(item.id)}
                        disabled={sm && sm.status !== "posted"}
                        title={sm && sm.status !== "posted" ? "Yêu cầu Quản lý kho duyệt phiếu kho trước" : ""}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-green-600 transition-colors hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Hoàn tất
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


