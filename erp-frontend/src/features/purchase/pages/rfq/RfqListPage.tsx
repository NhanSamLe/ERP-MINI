import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus, RotateCw, GitCompare, FileText } from "lucide-react";
import { RootState, AppDispatch } from "../../../../store/store";
import { fetchRfqsThunk, deleteRfqThunk } from "../../store/rfq";
import { Rfq } from "../../api/rfq.api";
import { StatusBadge } from "../../../../components/common";
import { Button } from "../../../../components/ui/Button";
import { ActionConfirmModal } from "../../../../components/common";
import { formatVND } from "@/utils/currency.helper";
import { Roles } from "@/types/enum";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "received", label: "Received" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

export default function RfqListPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { items, loading } = useSelector((s: RootState) => s.rfq);
  const user = useSelector((s: RootState) => s.auth.user);
  const role = user?.role.code;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Rfq | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchRfqsThunk(undefined));
  }, [dispatch]);

  const filtered = items.filter((r) => {
    const matchSearch =
      !search ||
      r.rfq_no.toLowerCase().includes(search.toLowerCase()) ||
      r.supplier?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const isExpiringSoon = (rfq: Rfq) => {
    if (!rfq.valid_until) return false;
    const diff = new Date(rfq.valid_until).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  };

  const isExpired = (rfq: Rfq) => {
    if (!rfq.valid_until) return false;
    return new Date(rfq.valid_until).getTime() < Date.now();
  };

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteRfqThunk(deleteTarget.id)).unwrap();
      toast.success("RFQ deleted");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="erp-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                Request for Quotations
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Manage supplier price requests
              </p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(fetchRfqsThunk(undefined))}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-gray-600 border border-gray-300 bg-white rounded-md hover:bg-gray-50 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            {selectedIds.length >= 2 && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<GitCompare className="w-3.5 h-3.5" />}
                onClick={() =>
                  navigate(
                    `/purchase/rfqs/compare?ids=${selectedIds.join(",")}`,
                  )
                }
              >
                Compare ({selectedIds.length})
              </Button>
            )}
            {(role === Roles.PURCHASE || role === Roles.PURCHASEMANAGER) && (
              <Button
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => navigate("/purchase/rfqs/create")}
              >
                New RFQ
              </Button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-3 border-b border-orange-100 bg-orange-50/30">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <input
                placeholder="Search RFQ No, Supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-3 pr-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-gray-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 pl-3 pr-8 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
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
            <FileText className="w-10 h-10" />
            <p className="text-sm font-medium">No RFQs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orange-100 bg-orange-50/60">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    RFQ No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Valid Until
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Approval
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((rfq) => (
                  <tr
                    key={rfq.id}
                    className="hover:bg-orange-50/50 transition-colors duration-100 cursor-pointer"
                    onClick={() => navigate(`/purchase/rfqs/${rfq.id}`)}
                  >
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(rfq.id)}
                        onChange={() => toggleSelect(rfq.id)}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {rfq.rfq_no}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {rfq.supplier?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(rfq.rfq_date).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3">
                      {rfq.valid_until ? (
                        <span
                          className={
                            isExpired(rfq)
                              ? "text-red-600 font-medium"
                              : isExpiringSoon(rfq)
                                ? "text-amber-600 font-medium"
                                : "text-gray-600"
                          }
                        >
                          {new Date(rfq.valid_until).toLocaleDateString(
                            "vi-VN",
                          )}
                          {isExpiringSoon(rfq) && " ⚠️"}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatVND(rfq.total_after_tax)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={rfq.status} />
                    </td>
                    <td className="px-4 py-3">
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
                        {rfq.approval_status === "draft" && "Draft"}
                        {rfq.approval_status === "waiting_approval" &&
                          "Waiting"}
                        {rfq.approval_status === "approved" && "Approved"}
                        {rfq.approval_status === "rejected" && "Rejected"}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/purchase/rfqs/${rfq.id}`)}
                          className="p-1.5 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                        {["draft", "received"].includes(rfq.status) &&
                          rfq.approval_status !== "waiting_approval" &&
                          role === Roles.PURCHASE && (
                            <button
                              onClick={() =>
                                navigate(`/purchase/rfqs/${rfq.id}/edit`)
                              }
                              className="p-1.5 rounded text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                              title="Edit"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                          )}
                        {rfq.status === "draft" && role === Roles.PURCHASE && (
                          <button
                            onClick={() => setDeleteTarget(rfq)}
                            className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-orange-100 bg-orange-50/30">
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {filtered.length}
            </span>{" "}
            records
          </p>
        </div>
      </div>

      <ActionConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete RFQ"
        description={`Are you sure you want to delete ${deleteTarget?.rfq_no}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
