import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import {
  fetchPhysicalInventoryByIdThunk,
  startPhysicalInventoryThunk,
  validatePhysicalInventoryThunk,
  cancelPhysicalInventoryThunk,
} from "../store";
import { physicalInventoryApi } from "../api/physicalInventory.api";
import { PhysicalInventoryLine } from "../store/stock/physicalInventory/physicalInventory.types";
import { Button } from "../../../components/ui/Button";
import { toast } from "react-toastify";
import { formatDateTime } from "@/utils/time.helper";
import { getErrorMessage } from "@/utils/ErrorHelper";
import { Roles } from "@/types/enum";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border border-gray-300",
  in_progress: "bg-blue-100 text-blue-700 border border-blue-300",
  validated: "bg-green-100 text-green-700 border border-green-300",
  cancelled: "bg-red-100 text-red-700 border border-red-300",
};

export default function PhysicalInventoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { selected: inv, loading } = useSelector(
    (state: RootState) => state.physicalInventory,
  );

  const [submitting, setSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "start" | "validate" | "cancel" | null
  >(null);
  // counted_qty edits: lineId → value
  const [editedQty, setEditedQty] = useState<Record<number, string>>({});
  const [savingLine, setSavingLine] = useState<number | null>(null);

  useEffect(() => {
    if (id) dispatch(fetchPhysicalInventoryByIdThunk(Number(id)));
  }, [id, dispatch]);

  const handleAction = async (action: "start" | "validate" | "cancel") => {
    if (!inv) return;
    setSubmitting(true);
    try {
      if (action === "start") {
        await dispatch(startPhysicalInventoryThunk(inv.id)).unwrap();
        toast.success("Inventory started");
      } else if (action === "validate") {
        await dispatch(validatePhysicalInventoryThunk(inv.id)).unwrap();
        toast.success("Inventory validated — stock balances updated");
      } else {
        await dispatch(cancelPhysicalInventoryThunk(inv.id)).unwrap();
        toast.success("Inventory cancelled");
      }
      setConfirmAction(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveLine = async (line: PhysicalInventoryLine) => {
    const raw = editedQty[line.id];
    if (raw === undefined) return;
    const qty = parseFloat(raw);
    if (isNaN(qty) || qty < 0) {
      toast.error("Invalid quantity");
      return;
    }
    setSavingLine(line.id);
    try {
      await physicalInventoryApi.updateLine(inv!.id, line.id, qty);
      await dispatch(fetchPhysicalInventoryByIdThunk(inv!.id));
      setEditedQty((prev) => {
        const n = { ...prev };
        delete n[line.id];
        return n;
      });
      toast.success("Line updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingLine(null);
    }
  };

  if (loading || !inv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">
          {loading ? "Loading..." : "Not found"}
        </div>
      </div>
    );
  }

  const isManager =
    currentUser?.role.code === Roles.WHMANAGER ||
    currentUser?.role.code === Roles.ADMIN;
  const canStart = inv.status === "draft";
  const canValidate = inv.status === "in_progress" && isManager;
  const canCancel = ["draft", "in_progress"].includes(inv.status);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-gray-900">
                Physical Inventory #{inv.inv_no}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[inv.status]}`}
              >
                {inv.status.replace("_", " ")}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {inv.warehouse?.name} · {inv.inv_date}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:shadow transition"
            >
              ← Back
            </button>

            {canStart && (
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setConfirmAction("start")}
              >
                Start Inventory
              </Button>
            )}
            {canValidate && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setConfirmAction("validate")}
              >
                Validate
              </Button>
            )}
            {canCancel && (
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => setConfirmAction("cancel")}
              >
                Cancel
              </Button>
            )}
          </div>
        </header>

        {/* Info + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Information
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow label="Inv No" value={inv.inv_no} />
              <InfoRow label="Date" value={inv.inv_date} />
              <InfoRow label="Warehouse" value={inv.warehouse?.name ?? "—"} />
              <InfoRow
                label="Status"
                value={
                  <span className="capitalize">
                    {inv.status.replace("_", " ")}
                  </span>
                }
              />
              <InfoRow
                label="Created By"
                value={inv.creator?.full_name ?? "—"}
              />
              <InfoRow
                label="Created At"
                value={formatDateTime(inv.created_at ?? "")}
              />
              {inv.validator && (
                <>
                  <InfoRow
                    label="Validated By"
                    value={inv.validator.full_name}
                  />
                  <InfoRow
                    label="Validated At"
                    value={formatDateTime(inv.validated_at ?? "")}
                  />
                </>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-3">
              Summary
            </h2>
            <div className="space-y-2 text-sm">
              <SummaryRow label="Total lines" value={inv.lines?.length ?? 0} />
              <SummaryRow
                label="Lines with diff"
                value={
                  inv.lines?.filter((l) => Number(l.difference_qty) !== 0)
                    .length ?? 0
                }
              />
              <SummaryRow
                label="Total theoretical"
                value={
                  inv.lines
                    ?.reduce((s, l) => s + Number(l.theoretical_qty), 0)
                    .toFixed(2) ?? 0
                }
              />
              <SummaryRow
                label="Total counted"
                value={
                  inv.lines
                    ?.reduce((s, l) => s + Number(l.counted_qty), 0)
                    .toFixed(2) ?? 0
                }
              />
            </div>
          </div>
        </div>

        {/* Lines table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">
              Inventory Lines
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {inv.status === "in_progress"
                ? "Enter counted quantities for each product"
                : "Stock count results"}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Lot</th>
                  <th className="p-3 text-right">Theoretical</th>
                  <th className="p-3 text-right">Counted</th>
                  <th className="p-3 text-right">Difference</th>
                  <th className="p-3 text-right">Unit Cost</th>
                  {inv.status === "in_progress" && (
                    <th className="p-3 w-20"></th>
                  )}
                </tr>
              </thead>
              <tbody>
                {!inv.lines || inv.lines.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-6 text-center text-gray-400 italic"
                    >
                      No lines. Start the inventory to load stock data.
                    </td>
                  </tr>
                ) : (
                  inv.lines.map((line, idx) => {
                    const diff = Number(line.difference_qty);
                    const isEditing = editedQty[line.id] !== undefined;
                    return (
                      <tr
                        key={line.id}
                        className={`border-t ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {line.product?.image_url && (
                              <img
                                src={line.product.image_url}
                                className="w-8 h-8 rounded object-cover border border-gray-200"
                                alt=""
                              />
                            )}
                            <span className="font-medium text-gray-800">
                              {line.product?.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-xs text-gray-500">
                          {line.product?.sku}
                        </td>
                        <td className="p-3 text-xs">
                          {line.location ? (
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                              {line.location.code} · {line.location.name}
                            </span>
                          ) : (
                            <span className="text-gray-300 italic text-xs">
                              No location
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-xs">
                          {line.lot ? (
                            <span className="text-indigo-700 font-medium">
                              {line.lot.lot_no}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {Number(line.theoretical_qty).toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          {inv.status === "in_progress" ? (
                            <input
                              type="number"
                              min={0}
                              step="1"
                              value={
                                isEditing
                                  ? editedQty[line.id]
                                  : Number(line.counted_qty).toFixed(2)
                              }
                              onChange={(e) =>
                                setEditedQty((prev) => ({
                                  ...prev,
                                  [line.id]: e.target.value,
                                }))
                              }
                              className="w-24 border rounded px-2 py-1 text-right font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />
                          ) : (
                            <span className="font-mono">
                              {Number(line.counted_qty).toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td
                          className={`p-3 text-right font-mono font-semibold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-gray-500"}`}
                        >
                          {diff > 0 ? "+" : ""}
                          {diff.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-gray-500 font-mono text-xs">
                          {line.unit_cost != null
                            ? Number(line.unit_cost).toFixed(4)
                            : "—"}
                        </td>
                        {inv.status === "in_progress" && (
                          <td className="p-3 text-right">
                            {isEditing && (
                              <button
                                onClick={() => handleSaveLine(line)}
                                disabled={savingLine === line.id}
                                className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                {savingLine === line.id ? "..." : "Save"}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirm dialogs */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-3 capitalize">
              {confirmAction === "start" && "Start Inventory?"}
              {confirmAction === "validate" && "Validate Inventory?"}
              {confirmAction === "cancel" && "Cancel Inventory?"}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {confirmAction === "start" &&
                "This will load current stock quantities as theoretical values."}
              {confirmAction === "validate" &&
                "This will update stock balances based on counted quantities. This action cannot be undone."}
              {confirmAction === "cancel" &&
                "This inventory session will be cancelled."}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setConfirmAction(null)}
                disabled={submitting}
              >
                Close
              </Button>
              <Button
                className={
                  confirmAction === "validate"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : confirmAction === "cancel"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                }
                onClick={() => handleAction(confirmAction)}
                disabled={submitting}
              >
                {submitting ? "Processing..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-800 mt-0.5">{value}</p>
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
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}
