import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { CornerUpLeft, Package } from "lucide-react";
import { RootState, AppDispatch } from "../../../../store/store";
import {
  fetchReturnByIdThunk,
  shipReturnThunk,
  completeReturnThunk,
  clearSelectedReturn,
  createDebitNoteFromReturnThunk,
} from "../../store/purchaseReturn";
import { StatusBadge } from "../../../../components/common";
import { ActionConfirmModal } from "../../../../components/common";
import { StandardFormLayout } from "../../../../components/layout/StandardFormLayout";
import { FormSection } from "../../../../components/layout/FormSection";
import { formatVND } from "@/utils/currency.helper";
import { Roles } from "@/types/enum";

export default function PurchaseReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const {
    selectedReturn: ret,
    loading,
    actionLoading,
  } = useSelector((s: RootState) => s.purchaseReturn);
  const user = useSelector((s: RootState) => s.auth.user);
  const role = user?.role.code;
  const [modal, setModal] = useState<"ship" | "complete" | "debit_note" | null>(
    null,
  );

  useEffect(() => {
    const numId = Number(id);
    if (id && !isNaN(numId)) dispatch(fetchReturnByIdThunk(numId));
    return () => {
      dispatch(clearSelectedReturn());
    };
  }, [id, dispatch]);

  const handleAction = async () => {
    if (!ret) return;
    try {
      if (modal === "ship") {
        await dispatch(shipReturnThunk(ret.id)).unwrap();
        toast.success("Return shipped");
      } else if (modal === "complete") {
        await dispatch(completeReturnThunk(ret.id)).unwrap();
        toast.success("Return completed");
      } else if (modal === "debit_note") {
        const dn = await dispatch(
          createDebitNoteFromReturnThunk(ret.id),
        ).unwrap();
        toast.success(`Debit Note ${dn.debit_note_no} created`);
        navigate(`/purchase/debit-notes/${dn.id}`);
      }
      setModal(null);
    } catch (e: any) {
      toast.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!ret) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <CornerUpLeft className="w-10 h-10 text-gray-300" />
        <p className="text-sm font-medium">Purchase Return not found</p>
        <button
          onClick={() => navigate("/purchase/returns")}
          className="text-sm text-orange-600 hover:underline"
        >
          Back to list
        </button>
      </div>
    );
  }

  const isPurchase = role === Roles.PURCHASE || role === Roles.PURCHASEMANAGER;
  const isAccountant = role === Roles.ACCOUNT || role === Roles.CHACC;

  const actions = [
    {
      label: "Back",
      variant: "outline" as const,
      onClick: () => navigate("/purchase/returns"),
    },
    ...(ret.status === "draft" && isPurchase
      ? [
          {
            label: "Edit",
            variant: "outline" as const,
            onClick: () => navigate(`/purchase/returns/${ret.id}/edit`),
          },
          {
            label: "Ship Return",
            variant: "primary" as const,
            onClick: () => setModal("ship"),
          },
        ]
      : []),
    ...(ret.status === "confirmed" && isPurchase
      ? [
          {
            label: "Complete",
            variant: "success" as const,
            onClick: () => setModal("complete"),
          },
        ]
      : []),
    ...(["confirmed", "completed"].includes(ret.status) && isAccountant
      ? [
          {
            label: "Create Debit Note",
            variant: "primary" as const,
            onClick: () => setModal("debit_note"),
          },
        ]
      : []),
  ];

  const lines = ret.lines ?? [];

  return (
    <>
      <StandardFormLayout
        title={ret.return_no}
        statusBadge={<StatusBadge status={ret.status} />}
        actions={actions}
      >
        <FormSection
          title="Return Details"
          icon={<CornerUpLeft className="w-4 h-4" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Return No</p>
              <p className="text-sm font-semibold">{ret.return_no}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Supplier</p>
              <p className="text-sm">{ret.supplier?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Return Date</p>
              <p className="text-sm">
                {new Date(ret.return_date).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Return Amount</p>
              <p className="text-sm font-bold text-orange-600">
                {formatVND(ret.total_return_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Created By</p>
              <p className="text-sm">{ret.creator?.full_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Created At</p>
              <p className="text-sm">
                {new Date(ret.created_at).toLocaleDateString("vi-VN")}
              </p>
            </div>
            {ret.pra_id && (
              <div>
                <p className="text-xs text-gray-500 mb-1">From PRA</p>
                <button
                  onClick={() =>
                    navigate(`/purchase/return-authorizations/${ret.pra_id}`)
                  }
                  className="text-sm text-orange-600 hover:underline"
                >
                  View PRA →
                </button>
              </div>
            )}
          </div>
          {ret.notes && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {ret.notes}
              </p>
            </div>
          )}
        </FormSection>

        {/* Lines */}
        <FormSection
          title="Return Items"
          icon={<Package className="w-4 h-4" />}
          noPadding
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                {[
                  "#",
                  "Product",
                  "Qty Returned",
                  "Qty Confirmed",
                  "Qty Rejected",
                  "Unit Price",
                  "Condition",
                  "Line Total",
                ].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${["Qty Returned", "Qty Confirmed", "Qty Rejected", "Unit Price", "Line Total"].includes(h) ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-gray-400"
                  >
                    No line items
                  </td>
                </tr>
              ) : (
                lines.map((line, i) => (
                  <tr key={line.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {line.product?.name ?? `Product #${line.product_id}`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {line.quantity_returned}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-medium">
                      {line.quantity_confirmed}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium">
                      {line.quantity_rejected}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatVND(line.unit_price)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          line.condition === "good"
                            ? "bg-green-100 text-green-700"
                            : line.condition === "damaged"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {line.condition}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-orange-600">
                      {formatVND(line.line_total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </FormSection>
      </StandardFormLayout>

      <ActionConfirmModal
        isOpen={modal === "ship"}
        onClose={() => setModal(null)}
        onConfirm={handleAction}
        title="Ship Return"
        description={`Mark ${ret.return_no} as shipped to supplier?`}
        confirmText="Ship"
        variant="primary"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "complete"}
        onClose={() => setModal(null)}
        onConfirm={handleAction}
        title="Complete Return"
        description={`Mark ${ret.return_no} as completed?`}
        confirmText="Complete"
        variant="success"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "debit_note"}
        onClose={() => setModal(null)}
        onConfirm={handleAction}
        title="Create Debit Note"
        description={`Create an AP Debit Note from ${ret.return_no}? Only confirmed quantities will be included.`}
        confirmText="Create Debit Note"
        variant="primary"
        loading={actionLoading}
      />
    </>
  );
}
