import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import {
  approveStockMoveThunk,
  fetchStockMoveByIdThunk,
  rejectStockMoveThunk,
  submitStockMoveThunk,
} from "../store";
import { Button } from "../../../components/ui/Button";
import { Textarea } from "../../../components/ui/textarea";

import {
  mapToViewStockMove,
  ReferenceType,
  ViewStockMove,
} from "../store/stock/stockmove/stockMove.types";
import { StockMove } from "../store/stock/stockmove/stockMove.types";
import { Roles } from "@/types/enum";
import { getErrorMessage } from "@/utils/ErrorHelper";
import { toast } from "react-toastify";
import { formatDateTime } from "@/utils/time.helper";

export interface UserInfo {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  avatar_url: string;
}

export default function ViewStockMovePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const warehouses = useSelector((state: RootState) => state.warehouse.items);

  const [data, setData] = useState<ViewStockMove | null>(null);
  const [loading, setLoading] = useState(true);

  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  let stockMoveBranchId: number | undefined = undefined;
  if (data) {
    let warehouseIdToCheck: number | undefined;

    switch (data.type) {
      case "receipt":
        warehouseIdToCheck = data.warehouse_to_id!;
        break;
      case "issue":
      case "adjustment":
        warehouseIdToCheck = data.warehouse_from_id!;
        break;
      case "transfer":
        warehouseIdToCheck = data.warehouse_from_id!;
        break;
    }

    const warehouse = warehouses.find((w) => w.id === warehouseIdToCheck);
    stockMoveBranchId = warehouse?.branch_id;
  }
  // STATUS COLORS
  const statusColors: Record<string, string> = {
    draft: "bg-gray-200 text-gray-700 border border-gray-300",
    waiting_approval: "bg-yellow-100 text-yellow-700 border border-yellow-300",
    posted: "bg-green-100 text-green-700 border border-green-300",
    cancelled: "bg-red-100 text-red-700 border border-red-300",
  };

  const referenceColors: Record<ReferenceType, string> = {
    purchase_order: "bg-green-100 text-green-700 border border-green-300",
    sale_order: "bg-purple-100 text-purple-700 border border-purple-300",
    transfer: "bg-blue-100 text-blue-700 border border-blue-300",
    adjustment: "bg-orange-100 text-orange-700 border border-orange-300",
  };
  // FETCH DATA
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);

      const res = await dispatch(fetchStockMoveByIdThunk(Number(id)));
      const raw = res.payload as StockMove;

      const mapped = mapToViewStockMove(raw, warehouses);
      console.log("Mapped: ", mapped);
      setData(mapped);

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
      toast.success("Submit susscess");
    } catch (error) {
      console.log(">>> Error caught:", error);
      console.log(">>>> ERROR TYPE:", typeof error);
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
      const mapped = mapToViewStockMove(fresh, warehouses);
      setData(mapped);
      setData(mapped);
      setConfirmApprove(false);
      toast.success("Approved Success");
    } catch (err) {
      console.error(err);
      alert("Approve failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!data) return;

    if (!rejectReason.trim()) {
      toast.error("Please provide a reject reason");
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(
        rejectStockMoveThunk({ id: data.id, rejectReason: rejectReason })
      ).unwrap();

      const fresh = await dispatch(fetchStockMoveByIdThunk(data.id)).unwrap();
      const mapped = mapToViewStockMove(fresh, warehouses);
      setData(mapped);
      setConfirmReject(false);
      setRejectReason("");
      toast.success("Stock Move cancelled successfully");
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-gray-500">Loading stock move…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-red-600">Stock Move not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <header className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-gray-900">
                Stock Move #{data.move_no}
              </h1>
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${statusColors[data.status]
                  }`}
                aria-hidden
              >
                <span
                  className={`w-2 h-2 rounded-full ${data.status === "draft"
                      ? "bg-gray-400"
                      : data.status === "waiting_approval"
                        ? "bg-yellow-500"
                        : data.status === "posted"
                          ? "bg-green-500"
                          : "bg-red-500"
                    }`}
                />
                {data?.status ? data.status.replace("_", " ") : ""}
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Created on{" "}
              <time dateTime={data.move_date}>
                {formatDateTime(data.move_date)}
              </time>{" "}
              • {data.type ?? "—"}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3">
            {/* Back button */}
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:shadow transition"
            >
              ← Back
            </button>

            {/* Dynamic action buttons */}
            <div className="flex gap-3">
              {data.status === "draft" &&
                currentUser?.role.code === Roles.WHSTAFF &&
                data.creator?.id === currentUser?.id &&
                stockMoveBranchId === currentUser?.branch.id && (
                  <button
                    onClick={() => setConfirmSubmit(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm shadow transition"
                  >
                    Submit for Approval
                  </button>
                )}

              {currentUser?.role.code === Roles.WHMANAGER &&
                data?.status === "waiting_approval" &&
                stockMoveBranchId === currentUser?.branch.id && (
                  <>
                    {/* Approve Button */}
                    <button
                      onClick={() => setConfirmApprove(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl shadow-sm hover:bg-emerald-700 hover:shadow-md active:scale-[0.97] transition-all"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Approve
                    </button>

                    {/* Cancel Button */}
                    <button
                      onClick={() => setConfirmReject(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl shadow-sm hover:bg-red-700 hover:shadow-md active:scale-[0.97] transition-all"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Cancel
                    </button>
                  </>
                )}
            </div>
          </div>
        </header>

        {/* GRID: left = main, right = summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <main className="lg:col-span-2 space-y-6">
            {/* Basic info card */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Basic information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem
                  label="Move No"
                  value={
                    <span className="text-sm text-gray-700">
                      {data.move_no}
                    </span>
                  }
                />
                <InfoItem
                  label="Move Date"
                  value={formatDateTime(data.move_date)}
                />
                <InfoItem
                  label="Reference Type"
                  value={
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${referenceColors[data.reference_type]
                        }`}
                    >
                      {data.reference_type.replace("_", " ")}
                    </span>
                  }
                />
                <InfoItem
                  label="Reference ID"
                  value={data.reference_id ?? "—"}
                />
                <InfoItem label="Created At" value={formatDateTime(data.created_at)} />
                <InfoItem label="Updated At" value={formatDateTime(data.updated_at)} />
              </div>
            </section>

            {/* Warehouses */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Warehouses
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem
                  label="From"
                  value={data.warehouse_from_name || "—"}
                />
                <InfoItem label="To" value={data.warehouse_to_name || "—"} />
              </div>
            </section>

            {/* Lines */}
            <section className="bg-white border border-gray-200 rounded-2xl p-0 overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="px-6 py-4 border-b border-gray-100 bg-white">
                <h3 className="text-lg font-semibold text-gray-900">
                  Stock Move Lines
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Products included in this move
                </p>
              </div>

              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-700 bg-gray-50">
                        <th className="p-3">Image</th>
                        <th className="p-3">Product</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Qty</th>
                        <th className="p-3">UOM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.lines?.map((line, idx) => (
                        <tr
                          key={line.id}
                          className={`align-top border-b ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } hover:bg-blue-50 transition-colors`}
                        >
                          <td className="p-3">
                            <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                              <img
                                src={line.product?.image_url || "/no-image.png"}
                                alt={line.product?.name || "product"}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </td>

                          <td className="p-3 font-medium text-gray-800">
                            {line.product?.name}
                          </td>
                          <td className="p-3 text-xs text-gray-500 font-mono">
                            {line.product?.sku}
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">
                              {line.quantity}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600">{line.uom}</td>
                        </tr>
                      ))}

                      {!data.lines || data.lines.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-6 text-center text-gray-500"
                          >
                            No lines found.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Note */}
            {data.note && (
              <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Note
                </h3>
                <p className="text-gray-700">{data.note}</p>
              </section>
            )}

            {/* Reject reason */}
            {data.reject_reason && (
              <section className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Reject reason
                </h3>
                <p className="text-red-700">{data.reject_reason}</p>
              </section>
            )}
          </main>

          {/* Right column: summary / approval */}
          <aside className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                Approval
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Created by</p>
                  <PersonCard user={data.creator} />
                </div>

                <div>
                  <p className="text-xs text-gray-500">Approved by</p>
                  {data.approver ? (
                    <PersonCard user={data.approver} />
                  ) : (
                    <div className="mt-2 p-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500 text-center">
                      Not approved yet
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500">Created at</div>
                  <div className="text-sm font-medium text-gray-800">
                    {formatDateTime(data.created_at)}
                  </div>

                  <div className="mt-3 text-xs text-gray-500">Updated at</div>
                  <div className="text-sm font-medium text-gray-800">
                    {formatDateTime(data.updated_at)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Summary
              </h4>

              <div className="grid grid-cols-1 gap-3 text-sm text-gray-700">
                <SummaryRow label="Lines" value={data.lines?.length ?? 0} />
                <SummaryRow label="Type" value={data.type} />
                <SummaryRow
                  label="Reference"
                  value={data.reference_type || "—"}
                />
                <SummaryRow
                  label="From"
                  value={data.warehouse_from_name || "—"}
                />
                <SummaryRow label="To" value={data.warehouse_to_name || "—"} />
              </div>
            </div>
          </aside>
        </div>
      </div>
      {confirmSubmit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-scaleIn">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Submit for Approval?
            </h2>

            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              After submitting, you will no longer be able to edit this stock
              move
            </p>

            <div className="flex justify-end gap-3">
              <Button
                className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => setConfirmSubmit(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSubmitApproval}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Yes, Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmApprove && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Approve Stock Move?</h2>

            <p className="text-gray-600 mb-6">
              Once approved, this Stock Move will be confirmed.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => setConfirmApprove(false)}
                disabled={submitting}
              >
                Cancel
              </Button>

              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleApprove}
                disabled={submitting}
              >
                {submitting ? "Approving..." : "Approve"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmReject && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          {" "}
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm">
            {" "}
            <h2 className="text-lg font-bold mb-4">Cancel Stock Move</h2>{" "}
            <p className="text-gray-600 mb-4">
              Please provide a reason for cancellation.
            </p>{" "}
            <Textarea
              placeholder="Enter reject reason..."
              value={rejectReason}
              onChange={(value) => setRejectReason(value)}
              rows={4}
              className="mb-6"
            />{" "}
            <div className="flex justify-end gap-3">
              {" "}
              <Button
                className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => setConfirmReject(false)}
                disabled={submitting}
              >
                {" "}
                Close{" "}
              </Button>{" "}
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleReject}
                disabled={submitting}
              >
                {" "}
                {submitting ? "Cancelling..." : "Cancel Order"}{" "}
              </Button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}
    </div>
  );
}

/* ---------------------------
   Small UI helpers / components
   --------------------------- */

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-white/0 p-0">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="mt-1 text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function PersonCard({ user }: { user: UserInfo | null }) {
  if (!user) return null;

  return (
    <div className="flex items-center gap-4 mt-3">
      {/* Avatar */}
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
        <img
          src={user.avatar_url || "/default-avatar.png"}
          alt={user.full_name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="text-base">
        {/* Name */}
        <div className="font-semibold text-gray-900 text-lg">
          {user.full_name}
        </div>

        {/* Email + Phone */}
        <div className="mt-2 text-sm text-gray-600 flex flex-col gap-1.5">
          {/* Email */}
          <span className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 8v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {user.email}
          </span>

          {/* Phone */}
          <span className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M22 16.92V21a1 1 0 01-1.08 1A19 19 0 013 5.08 1 1 0 014 4h4.09a1 1 0 01.95.68 11.36 11.36 0 00.7 1.81 1 1 0 01-.24 1.07L8.91 9.91a14.06 14.06 0 006.18 6.18l1.25-1.09a1 1 0 011.07-.24 11.36 11.36 0 001.81.7 1 1 0 01.68.95V21z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {user.phone}
          </span>
        </div>
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
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-base font-medium text-gray-800">{value}</div>
    </div>
  );
}
