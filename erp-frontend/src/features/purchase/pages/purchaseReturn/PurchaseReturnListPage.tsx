import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Plus, RotateCw, CornerUpLeft } from "lucide-react";
import { RootState, AppDispatch } from "../../../../store/store";
import { fetchReturnsThunk } from "../../store/purchaseReturn";
import { StatusBadge } from "../../../../components/common";
import { Button } from "../../../../components/ui/Button";
import { formatVND } from "@/utils/currency.helper";
import { Roles } from "@/types/enum";

export default function PurchaseReturnListPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { returns, loading } = useSelector((s: RootState) => s.purchaseReturn);
  const user = useSelector((s: RootState) => s.auth.user);
  const role = user?.role.code;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    dispatch(fetchReturnsThunk(undefined));
  }, [dispatch]);

  const filtered = returns.filter((r) => {
    const matchSearch =
      !search ||
      r.return_no.toLowerCase().includes(search.toLowerCase()) ||
      r.supplier?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="page-container">
      <div className="erp-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <CornerUpLeft className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                Purchase Returns
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Physical returns to suppliers
              </p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(fetchReturnsThunk(undefined))}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-gray-600 border border-gray-300 bg-white rounded-md hover:bg-gray-50 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            {(role === Roles.PURCHASE || role === Roles.PURCHASEMANAGER) && (
              <Button
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => navigate("/purchase/returns/create")}
              >
                New Return
              </Button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-3 border-b border-orange-100 bg-orange-50/30">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              placeholder="Search Return No, Supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] max-w-xs h-8 pl-3 pr-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-gray-400"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 pl-3 pr-8 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="shipped">Shipped</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
            <CornerUpLeft className="w-10 h-10" />
            <p className="text-sm font-medium">No purchase returns found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orange-100 bg-orange-50/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Return No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Return Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((ret) => (
                  <tr
                    key={ret.id}
                    className="hover:bg-orange-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/purchase/returns/${ret.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {ret.return_no}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {ret.supplier?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(ret.return_date).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatVND(ret.total_return_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ret.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(ret.created_at).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center px-5 py-3 border-t border-orange-100 bg-orange-50/30">
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {filtered.length}
            </span>{" "}
            records
          </p>
        </div>
      </div>
    </div>
  );
}
