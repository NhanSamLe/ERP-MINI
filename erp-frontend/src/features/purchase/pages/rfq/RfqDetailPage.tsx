import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  FileText,
  Package,
  StickyNote,
  History,
  ArrowLeft,
} from "lucide-react";
import { RootState, AppDispatch } from "../../../../store/store";
import {
  fetchRfqByIdThunk,
  sendRfqThunk,
  markRfqReceivedThunk,
  acceptRfqThunk,
  rejectRfqThunk,
  convertRfqToPoThunk,
  createRfqVersionThunk,
  clearSelected,
} from "../../store/rfq";
import { StatusBadge } from "../../../../components/common";
import { ActionConfirmModal } from "../../../../components/common";
import { StandardFormLayout } from "../../../../components/layout/StandardFormLayout";
import { FormSection } from "../../../../components/layout/FormSection";
import { formatVND } from "@/utils/currency.helper";
import { Roles } from "@/types/enum";

export default function RfqDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const {
    selected: rfq,
    loading,
    actionLoading,
  } = useSelector((s: RootState) => s.rfq);
  const user = useSelector((s: RootState) => s.auth.user);
  const role = user?.role.code;

  const [modal, setModal] = useState<
    "send" | "receive" | "accept" | "reject" | "convert" | "version" | null
  >(null);

  useEffect(() => {
    const numId = Number(id);
    if (id && !isNaN(numId)) {
      dispatch(fetchRfqByIdThunk(numId));
    }
    // Clear selected khi unmount để tránh data cũ hiện khi navigate sang RFQ khác
    return () => {
      dispatch(clearSelected());
    };
  }, [id, dispatch]);

  const handleAction = async (action: typeof modal) => {
    if (!rfq) return;
    try {
      switch (action) {
        case "send":
          await dispatch(sendRfqThunk(rfq.id)).unwrap();
          toast.success("RFQ sent to supplier");
          break;
        case "receive":
          await dispatch(markRfqReceivedThunk(rfq.id)).unwrap();
          toast.success("Marked as received");
          break;
        case "accept":
          await dispatch(acceptRfqThunk(rfq.id)).unwrap();
          toast.success("RFQ accepted");
          break;
        case "reject":
          await dispatch(rejectRfqThunk(rfq.id)).unwrap();
          toast.success("RFQ rejected");
          break;
        case "convert": {
          const result = await dispatch(convertRfqToPoThunk(rfq.id)).unwrap();
          toast.success("Purchase Order created");
          navigate(`/purchase-orders/view/${result.po_id}`);
          break;
        }
        case "version": {
          const newRfq = await dispatch(createRfqVersionThunk(rfq.id)).unwrap();
          toast.success(`Version ${newRfq.version} created`);
          navigate(`/purchase/rfqs/${newRfq.id}`);
          break;
        }
      }
      setModal(null);
    } catch (e: any) {
      toast.error(e);
    }
  };

  const actions = () => {
    if (!rfq) return [];
    const base = [
      {
        label: "Back",
        variant: "outline" as const,
        onClick: () => navigate("/purchase/rfqs"),
      },
    ];
    if (["draft", "received"].includes(rfq.status) && role === Roles.PURCHASE) {
      base.push({
        label: "Edit",
        variant: "outline" as const,
        onClick: () => navigate(`/purchase/rfqs/${rfq.id}/edit`),
      });
    }
    if (rfq.status === "draft" && role === Roles.PURCHASE) {
      base.push({
        label: "Send RFQ",
        variant: "primary" as const,
        onClick: () => setModal("send"),
      });
    }
    if (rfq.status === "sent" && role === Roles.PURCHASE) {
      base.push({
        label: "Mark Received",
        variant: "primary" as const,
        onClick: () => setModal("receive"),
      });
    }
    if (rfq.status === "received") {
      if (role === Roles.PURCHASE || role === Roles.PURCHASEMANAGER) {
        base.push({
          label: "Create PO",
          variant: "success" as const,
          onClick: () => setModal("convert"),
        });
        base.push({
          label: "New Version",
          variant: "outline" as const,
          onClick: () => setModal("version"),
        });
        base.push({
          label: "Reject",
          variant: "danger" as const,
          onClick: () => setModal("reject"),
        });
      }
    }
    return base;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <FileText className="w-10 h-10 text-gray-300" />
        <p className="text-sm font-medium">RFQ not found</p>
        <button
          onClick={() => navigate("/purchase/rfqs")}
          className="text-sm text-orange-600 hover:underline"
        >
          Back to RFQ list
        </button>
      </div>
    );
  }

  const lines = rfq.lines ?? [];

  return (
    <>
      <StandardFormLayout
        title={rfq.rfq_no}
        statusBadge={<StatusBadge status={rfq.status} />}
        actions={actions()}
      >
        {/* General Info */}
        <FormSection
          title="RFQ Information"
          icon={<FileText className="w-4 h-4" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">RFQ No</p>
              <p className="text-sm font-semibold text-gray-900">
                {rfq.rfq_no}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Supplier</p>
              <p className="text-sm text-gray-800">
                {rfq.supplier?.name ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Buyer</p>
              <p className="text-sm text-gray-800">
                {rfq.creator?.full_name ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">RFQ Date</p>
              <p className="text-sm text-gray-800">
                {new Date(rfq.rfq_date).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Valid Until</p>
              <p
                className={`text-sm font-medium ${rfq.valid_until && new Date(rfq.valid_until) < new Date() ? "text-red-600" : "text-gray-800"}`}
              >
                {rfq.valid_until
                  ? new Date(rfq.valid_until).toLocaleDateString("vi-VN")
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Version</p>
              <p className="text-sm text-gray-800">v{rfq.version}</p>
            </div>
            {rfq.sent_at && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Sent At</p>
                <p className="text-sm text-gray-800">
                  {new Date(rfq.sent_at).toLocaleDateString("vi-VN")}
                </p>
              </div>
            )}
            {rfq.received_at && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Received At</p>
                <p className="text-sm text-gray-800">
                  {new Date(rfq.received_at).toLocaleDateString("vi-VN")}
                </p>
              </div>
            )}
          </div>
        </FormSection>

        {/* Line Items */}
        <FormSection
          title="Products"
          icon={<Package className="w-4 h-4" />}
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tax
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Lead Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lines.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-gray-400 text-sm"
                    >
                      No line items
                    </td>
                  </tr>
                ) : (
                  lines.map((line, i) => (
                    <tr key={line.id ?? i} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {line.product?.name ?? `Product #${line.product_id}`}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {line.description ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-800">
                        {line.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-800">
                        {formatVND(line.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {line.discount_percent ?? 0}%
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatVND(line.line_tax ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatVND(line.line_total_after_tax ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {line.lead_time_days != null
                          ? `${line.lead_time_days}d`
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="border-t border-gray-200 bg-gray-50/50">
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-3 text-right text-sm font-medium text-gray-600"
                  >
                    Subtotal
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatVND(rfq.total_before_tax)}
                  </td>
                  <td />
                </tr>
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-3 text-right text-sm font-medium text-gray-600"
                  >
                    Tax
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">
                    {formatVND(rfq.total_tax)}
                  </td>
                  <td />
                </tr>
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-3 text-right text-sm font-bold text-gray-800"
                  >
                    Total
                  </td>
                  <td className="px-4 py-3 text-right text-base font-bold text-orange-600">
                    {formatVND(rfq.total_after_tax)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </FormSection>

        {/* Notes */}
        {(rfq.internal_notes || rfq.supplier_notes) && (
          <FormSection title="Notes" icon={<StickyNote className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rfq.internal_notes && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Internal Notes
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {rfq.internal_notes}
                  </p>
                </div>
              )}
              {rfq.supplier_notes && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Supplier Notes
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {rfq.supplier_notes}
                  </p>
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Version history */}
        {rfq.parent_id && (
          <FormSection
            title="Version History"
            icon={<History className="w-4 h-4" />}
          >
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                This is version <strong>v{rfq.version}</strong> of the RFQ.
              </span>
              <button
                onClick={() => navigate(`/purchase/rfqs/${rfq.parent_id}`)}
                className="text-orange-600 hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                View previous version
              </button>
            </div>
          </FormSection>
        )}
      </StandardFormLayout>

      {/* Confirm modals */}
      <ActionConfirmModal
        isOpen={modal === "send"}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction("send")}
        title="Send RFQ to Supplier"
        description={`Send ${rfq.rfq_no} to ${rfq.supplier?.name ?? "supplier"}?`}
        confirmText="Send"
        variant="primary"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "receive"}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction("receive")}
        title="Mark as Received"
        description="Confirm that you have received the supplier's quotation?"
        confirmText="Mark Received"
        variant="success"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "accept"}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction("accept")}
        title="Accept RFQ"
        description="Accept this quotation?"
        confirmText="Accept"
        variant="success"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "reject"}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction("reject")}
        title="Reject RFQ"
        description="Reject this quotation?"
        confirmText="Reject"
        variant="danger"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "convert"}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction("convert")}
        title="Create Purchase Order"
        description={`Create a PO from ${rfq.rfq_no}? Lines and pricing will be copied automatically.`}
        confirmText="Create PO"
        variant="success"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "version"}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction("version")}
        title="Create New Version"
        description={`Create version ${rfq.version + 1} of ${rfq.rfq_no}?`}
        confirmText="Create Version"
        variant="primary"
        loading={actionLoading}
      />
    </>
  );
}
