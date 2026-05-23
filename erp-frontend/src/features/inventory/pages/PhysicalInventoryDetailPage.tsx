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
import { ChevronLeft, ClipboardList, Info, BarChart3, ListCollapse, Play, CheckCircle, Ban, AlertTriangle } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
  in_progress: "bg-blue-50 text-blue-700 border-blue-150 hover:bg-blue-50",
  validated: "bg-emerald-50 text-emerald-700 border-emerald-150 hover:bg-emerald-50",
  cancelled: "bg-rose-50 text-rose-700 border-rose-150 hover:bg-rose-50",
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">
            {loading ? "Loading audit sheet..." : "Inventory session not found"}
          </p>
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 transition shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-sm shrink-0">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Audit Sheet #{inv.inv_no}
                </h1>
                <Badge
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-none capitalize ${
                    statusColors[inv.status] || "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  {inv.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-slate-555 text-sm mt-0.5 font-medium">
                {inv.warehouse?.name} · {inv.inv_date}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          {canStart && (
            <Button
              variant="primary"
              onClick={() => setConfirmAction("start")}
              leftIcon={<Play className="w-4 h-4" />}
            >
              Start Session
            </Button>
          )}
          {canValidate && (
            <Button
              variant="success"
              onClick={() => setConfirmAction("validate")}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Validate
            </Button>
          )}
          {canCancel && (
            <Button
              variant="danger"
              onClick={() => setConfirmAction("cancel")}
              leftIcon={<Ban className="w-4 h-4" />}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Info + Summary grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info panel */}
        <Card className="lg:col-span-2 border-slate-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
          <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/20">
            <div className="flex items-center gap-2 text-slate-800">
              <Info className="w-4 h-4 text-orange-500" />
              <CardTitle className="text-base font-semibold">Audit Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-xs">
              <InfoRow label="Audit Sheet No" value={inv.inv_no} />
              <InfoRow label="Inventory Date" value={inv.inv_date} />
              <InfoRow label="Target Warehouse" value={inv.warehouse?.name ?? "—"} />
              <InfoRow
                label="Current Status"
                value={
                  <Badge className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded capitalize shadow-none border border-slate-200">
                    {inv.status.replace("_", " ")}
                  </Badge>
                }
              />
              <InfoRow
                label="Sheet Creator"
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
          </CardContent>
        </Card>

        {/* Summary stats */}
        <Card className="border-slate-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
          <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/20">
            <div className="flex items-center gap-2 text-slate-800">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <CardTitle className="text-base font-semibold">Audit Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-3.5 text-xs">
              <SummaryRow label="Total Audit Lines" value={inv.lines?.length ?? 0} />
              <SummaryRow
                label="Lines flag with difference"
                value={
                  <Badge
                    variant={inv.lines?.filter((l) => Number(l.difference_qty) !== 0).length ? "destructive" : "default"}
                    className="font-extrabold shadow-none rounded px-2 text-[10px]"
                  >
                    {inv.lines?.filter((l) => Number(l.difference_qty) !== 0).length ?? 0}
                  </Badge>
                }
              />
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <SummaryRow
                  label="Theoretical Qty"
                  value={
                    <span className="font-mono font-bold text-slate-600">
                      {inv.lines
                        ?.reduce((s, l) => s + Number(l.theoretical_qty), 0)
                        .toLocaleString("vi-VN", { maximumFractionDigits: 2 }) ?? 0}
                    </span>
                  }
                />
                <SummaryRow
                  label="Actual Counted Qty"
                  value={
                    <span className="font-mono font-extrabold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {inv.lines
                        ?.reduce((s, l) => s + Number(l.counted_qty), 0)
                        .toLocaleString("vi-VN", { maximumFractionDigits: 2 }) ?? 0}
                    </span>
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lines Table */}
      <Card className="border-slate-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
        <CardHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/20 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ListCollapse className="w-5 h-5 text-slate-700" />
            <div>
              <CardTitle className="text-base font-semibold text-slate-800">
                Audit Record Entries
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                {inv.status === "in_progress"
                  ? "Audit session is in progress. Input actual storage stock levels below"
                  : "Finalized physical count values"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6 text-left">Product</th>
                <th className="py-3.5 px-6 text-left">SKU</th>
                <th className="py-3.5 px-6 text-left">Location</th>
                <th className="py-3.5 px-6 text-left">Lot</th>
                <th className="py-3.5 px-6 text-right">Theoretical</th>
                <th className="py-3.5 px-6 text-right">Actual Counted</th>
                <th className="py-3.5 px-6 text-right">Difference</th>
                <th className="py-3.5 px-6 text-right">Unit Cost</th>
                {inv.status === "in_progress" && (
                  <th className="py-3.5 px-6 text-center w-24">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!inv.lines || inv.lines.length === 0 ? (
                <tr>
                  <td
                    colSpan={inv.status === "in_progress" ? 9 : 8}
                    className="py-16 text-center text-slate-450 italic"
                  >
                    No lines found. Propose start session to load system stock snapshots.
                  </td>
                </tr>
              ) : (
                inv.lines.map((line) => {
                  const diff = Number(line.difference_qty);
                  const isEditing = editedQty[line.id] !== undefined;
                  return (
                    <tr
                      key={line.id}
                      className="hover:bg-slate-50/30 transition-colors"
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          {line.product?.image_url && (
                            <img
                              src={line.product.image_url}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-100 bg-slate-50 shadow-sm shrink-0"
                              alt=""
                            />
                          )}
                          <span className="font-semibold text-slate-800">
                            {line.product?.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-xs font-bold text-slate-450 uppercase tracking-wider">
                        {line.product?.sku}
                      </td>
                      <td className="py-3.5 px-6 text-xs">
                        {line.location ? (
                          <Badge variant="secondary" className="shadow-none rounded px-2 text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                            {line.location.code} · {line.location.name}
                          </Badge>
                        ) : (
                          <span className="text-slate-350 italic text-xs">
                            No location
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-xs">
                        {line.lot ? (
                          <Badge className="shadow-none rounded bg-indigo-50 border border-indigo-150 text-indigo-700 font-mono font-bold text-[10px]">
                            {line.lot.lot_no}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono font-bold text-slate-600">
                        {Number(line.theoretical_qty).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {inv.status === "in_progress" ? (
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={
                              isEditing
                                ? editedQty[line.id]
                                : Number(line.counted_qty).toString()
                            }
                            onChange={(e) =>
                              setEditedQty((prev) => ({
                                ...prev,
                                [line.id]: e.target.value,
                              }))
                            }
                            className="w-24 h-9 border border-slate-200 rounded-lg px-2.5 text-right font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
                          />
                        ) : (
                          <span className="font-mono font-extrabold text-slate-800">
                            {Number(line.counted_qty).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-3.5 px-6 text-right font-mono font-bold ${
                          diff > 0 
                            ? "text-emerald-600 bg-emerald-50/10" 
                            : diff < 0 
                              ? "text-rose-600 bg-rose-50/10" 
                              : "text-slate-500"
                        }`}
                      >
                        {diff > 0 ? "+" : ""}
                        {diff.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-6 text-right text-slate-400 font-mono text-xs font-semibold">
                        {line.unit_cost != null
                          ? Number(line.unit_cost).toLocaleString("vi-VN", { minimumFractionDigits: 2 })
                          : "—"}
                      </td>
                      {inv.status === "in_progress" && (
                        <td className="py-3.5 px-6 text-center">
                          {isEditing ? (
                            <Button
                              onClick={() => handleSaveLine(line)}
                              disabled={savingLine === line.id}
                              size="xs"
                              variant="primary"
                              className="w-full h-8"
                            >
                              {savingLine === line.id ? "..." : "Save"}
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-semibold italic">Recorded</span>
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
      </Card>

      {/* Radix Action Confirm dialog */}
      <Dialog open={confirmAction !== null} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent className="sm:max-w-md">
          {confirmAction && (
            <>
              <DialogHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 mb-4 animate-pulse">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <DialogTitle className="text-center text-lg font-bold text-slate-900 capitalize">
                  {confirmAction === "start" && "Start Count Session?"}
                  {confirmAction === "validate" && "Validate Count Results?"}
                  {confirmAction === "cancel" && "Abort Count Audit?"}
                </DialogTitle>
                <DialogDescription className="text-center text-sm text-gray-500 mt-1.5">
                  {confirmAction === "start" &&
                    "This initializes the sheet and locks down snapshot current values as theoretical safety counts."}
                  {confirmAction === "validate" &&
                    "WARNING: This finishes the counts, validates discrepancies, and adjusts inventory stock levels. This action is final."}
                  {confirmAction === "cancel" &&
                    "This cancels the session sheet. Recorded data lines will be discarded safely."}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="flex-row justify-center gap-3 mt-4 border-t border-slate-100 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setConfirmAction(null)}
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
                <Button
                  variant={confirmAction === "validate" ? "success" : confirmAction === "cancel" ? "danger" : "primary"}
                  onClick={() => handleAction(confirmAction)}
                  loading={submitting}
                  className="w-full sm:w-auto"
                >
                  Confirm
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
      <div className="font-semibold text-slate-800 text-sm mt-0.5">{value}</div>
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
    <div className="flex justify-between items-center text-xs">
      <span className="font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="font-bold text-slate-800">{value}</div>
    </div>
  );
}
