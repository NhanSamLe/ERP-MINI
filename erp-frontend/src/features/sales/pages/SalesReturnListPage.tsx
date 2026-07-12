import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  RotateCcw,
  FilePlus2,
  Search,
  ClipboardCheck,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react";
import { toast } from "react-toastify";
import { StatusBadge } from "@/components/common";
import { useAppSelector } from "@/store/hooks";
import { approveRma, getRmas, submitRma } from "../service/salesReturn.service";
import { SalesReturnAuthorizationDto } from "../dto/salesReturn.dto";
import { formatVND } from "@/utils/currency.helper";

const RETURN_TYPE_LABEL: Record<string, string> = {
  credit_note: "Chứng từ ghi có",
  refund: "Hoàn tiền",
  replacement: "Đổi hàng",
};

const fmtMoney = (value?: number | null) =>
  value != null ? formatVND(value) : "-";

export default function SalesReturnListPage() {
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role?.code;
  const [rmas, setRmas] = useState<SalesReturnAuthorizationDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const isSalesApprover = role === "SALESMANAGER" || role === "BRANCH_MANAGER";

  const load = async () => {
    setLoading(true);
    try {
      setRmas(await getRmas());
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không tải được yêu cầu hoàn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRmas = useMemo(() => {
    const keyword = search.toLowerCase();
    return rmas.filter((item) =>
      !keyword ||
      item.rma_no.toLowerCase().includes(keyword) ||
      item.saleOrder?.order_no?.toLowerCase().includes(keyword) ||
      item.customer?.name?.toLowerCase().includes(keyword),
    );
  }, [rmas, search]);

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
              <RotateCcw className="h-4 w-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Yêu cầu hoàn hàng bán</h1>
              <p className="mt-0.5 text-xs text-gray-400">
                Sales tạo RMA, quản lý duyệt; kho xử lý phiếu hoàn trong module Inventory
              </p>
            </div>
            <span className="ml-1 inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600">
              {filteredRmas.length}
            </span>
          </div>

          {(role === "SALES" || role === "SALESMANAGER" || role === "BRANCH_MANAGER") && (
            <Link
              to="/sales/returns/create"
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-orange-500 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-600"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              Tạo RMA
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/50 px-5 py-3">
          <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500">
            <ClipboardCheck className="h-3.5 w-3.5 text-orange-500" />
            RMA là bước duyệt nghiệp vụ trước khi kho nhận hàng hoàn
          </div>

          <div className="relative min-w-48 max-w-sm flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Số RMA, đơn hàng, khách hàng..."
              className="h-8 w-full rounded-md border border-gray-200 bg-white pl-8 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
            <span className="text-sm">Đang tải...</span>
          </div>
        ) : filteredRmas.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
            <ClipboardCheck className="h-10 w-10 text-gray-200" />
            <p className="text-sm font-medium">Chưa có yêu cầu hoàn hàng nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Số RMA</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Đơn hàng</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Khách hàng</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Hướng xử lý</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Giá trị</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Trạng thái</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRmas.map((item) => {
                  const canSubmit = role === "SALES" && item.created_by === user?.id && item.status === "draft";
                  const canApprove = isSalesApprover && item.approval_status === "waiting_approval";

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-orange-50/30">
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-orange-600">{item.rma_no}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{item.saleOrder?.order_no || "-"}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{item.customer?.name || "-"}</p>
                        {item.customer?.phone && <p className="mt-0.5 text-xs text-gray-400">{item.customer.phone}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {RETURN_TYPE_LABEL[item.return_type] || item.return_type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-900">
                        {fmtMoney(item.total_return_amount)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            to={`/sales/returns/rmas/${item.id}`}
                            title="Xem chi tiết"
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                          >
                            <Eye className="h-3 w-3" />
                            Xem
                          </Link>
                          {canSubmit && (
                            <button
                              type="button"
                              onClick={() => run(() => submitRma(item.id), "Đã gửi duyệt RMA")}
                              title="Gửi duyệt"
                              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-50"
                            >
                              <Clock className="h-3 w-3" />
                              Gửi duyệt
                            </button>
                          )}
                          {canApprove && (
                            <button
                              type="button"
                              onClick={() => run(() => approveRma(item.id), "Đã duyệt RMA")}
                              title="Duyệt"
                              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-green-600 transition-colors hover:bg-green-50"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Duyệt
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
        )}
      </div>
    </div>
  );
}
