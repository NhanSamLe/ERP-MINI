import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../store/store";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProductByIdThunk } from "../../products/store/product.thunks";
import { fetchTaxRatesByIdThunk } from "../../master-data/store/master-data/tax/tax.thunks";
import { fetchAllBranchesThunk } from "../../../features/company/store/branch.thunks";
import {
  fetchPurchaseOrderByIdThunk,
  submitPurchaseOrderThunk,
} from "../store/purchaseOrder.thunks";
import { PurchaseOrderLine } from "../store";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/ErrorHelper";

interface LineItem {
  id?: number;
  temp_id?: number;
  product_id: string | number;
  product_name: string;
  product_image: string;
  sale_price?: number;
  sku?: string;
  quantity: number;
  tax_rate_id?: number;
  tax_type: string;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
}

export default function ViewPurchaseOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const purchaseOrder = useSelector(
    (state: RootState) => state.purchaseOrder.selectedPO
  );
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [, setSupplierId] = useState("");
  const [date, setDate] = useState("");
  const [reference, setReference] = useState("");
  const [totalOrderTax, setTotalOrderTax] = useState(0);
  const [, setBranch] = useState("");
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [totalBeforeTax, setTotalBeforeTax] = useState(0);
  const [totalAfterTax, setTotalAfterTax] = useState(0);
  const [description, setDescription] = useState("");

  const [lines, setLines] = useState<LineItem[]>([]);

  useEffect(() => {
    dispatch(fetchAllBranchesThunk())
      .unwrap()
      .then((data) => setBranches(data || []))
      .catch(() => setBranches([]));
  }, [dispatch]);

  useEffect(() => {
    if (id) dispatch(fetchPurchaseOrderByIdThunk(Number(id)));
  }, [dispatch, id]);

  const finalPO = purchaseOrder;
  useEffect(() => {
    if (finalPO?.branch_id && branches.length > 0) {
      setBranch(finalPO.branch_id.toString());
    }
  }, [finalPO, branches]);

  const selectedBranchName =
    branches.find((b) => b.id === finalPO?.branch_id)?.name || "";

  useEffect(() => {
    const linesToLoad = finalPO?.lines ?? [];
    if (linesToLoad.length === 0) return;

    const loadLines = async () => {
      setSupplierId(finalPO?.supplier_id?.toString() || "");
      if (finalPO?.order_date) {
        const d = new Date(finalPO.order_date);
        setDate(d.toISOString().split("T")[0]);
      }
      setReference(finalPO?.po_no || "");
      setDescription(finalPO?.description || "");
      const enrichedLines = await Promise.all(
        linesToLoad.map(async (l: PurchaseOrderLine) => {
          const product = await dispatch(
            fetchProductByIdThunk(Number(l.product_id))
          ).unwrap();

          const tax = await dispatch(
            fetchTaxRatesByIdThunk(product.tax_rate_id || 0)
          ).unwrap();
          const taxAmount =
            (Number(l.unit_price || 0) *
              Number(l.quantity || 0) *
              (tax?.rate || 0)) /
            100;

          return {
            id: l.id ?? undefined,
            temp_id: l.id ?? Date.now(),
            product_id: l.product_id,
            product_name: product.name,
            sku: product.sku,
            product_image: product.image_url ?? "",
            sale_price: Number(l.unit_price || 0),
            quantity: Number(l.quantity || 0),
            tax_rate: tax?.rate || 0,
            tax_rate_id: product.tax_rate_id,
            tax_type: tax?.type || "VAT",
            tax_amount: taxAmount,
            line_total: Number(l.line_total || 0),
          };
        })
      );

      setLines(enrichedLines);

      // tính totals
      const before = enrichedLines.reduce(
        (s, l) => s + (l.sale_price || 0) * l.quantity,
        0
      );
      const tax = enrichedLines.reduce((s, l) => s + l.tax_amount, 0);
      const after = enrichedLines.reduce((s, l) => s + l.line_total, 0);

      setTotalBeforeTax(before);
      setTotalOrderTax(tax);
      setTotalAfterTax(after);
    };

    loadLines();
  }, [finalPO, dispatch]);

  const handleSubmitApproval = async () => {
    if (!finalPO) return;

    setSubmitting(true);
    try {
      console.log(">>> Submitting PO id:", finalPO.id);
      console.log(">>> PO status:", finalPO.status);

      const result = await dispatch(
        submitPurchaseOrderThunk(finalPO.id)
      ).unwrap();

      console.log(">>> Submit result:", result);

      toast.success("Purchase order submitted for approval!");

      const refreshedPO = await dispatch(
        fetchPurchaseOrderByIdThunk(finalPO.id)
      ).unwrap();
      console.log(">>> Refreshed PO:", refreshedPO);

      setConfirmSubmit(false);
    } catch (error) {
      console.log(">>> Error caught:", error);
      console.log(">>>> ERROR TYPE:", typeof error);
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">
          Purchase Order Details
        </h1>

        {currentUser?.id === finalPO?.creator.id &&
          finalPO?.status === "draft" &&
          finalPO?.branch_id === currentUser?.branch.id && (
            <div className="flex gap-3">
              <Button
                className="bg-blue-600 hover:bg-blue-700 px-6"
                onClick={() => navigate(`/purchase-orders/edit/${id}`)}
              >
                Edit Purchase Order
              </Button>

              <Button
                className="bg-green-600 hover:bg-green-700 px-6"
                onClick={() => setConfirmSubmit(true)}
              >
                Submit for Approval
              </Button>
            </div>
          )}
      </div>

      {/* MAIN TOP CARD */}
      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        <h2 className="text-lg font-semibold text-gray-700 border-b pb-3">
          General Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* STATUS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>

            <span
              className={`
      inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold
      border shadow-sm
      ${
        finalPO?.status === "draft"
          ? "bg-gray-50 text-gray-700 border-gray-300"
          : ""
      }
      ${
        finalPO?.status === "waiting_approval"
          ? "bg-amber-50 text-amber-700 border-amber-300"
          : ""
      }
      ${
        finalPO?.status === "confirmed"
          ? "bg-blue-50 text-blue-700 border-blue-300"
          : ""
      }
      ${
        finalPO?.status === "partially_received"
          ? "bg-purple-50 text-purple-700 border-purple-300"
          : ""
      }
      ${
        finalPO?.status === "completed"
          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
          : ""
      }
      ${
        finalPO?.status === "cancelled"
          ? "bg-red-50 text-red-700 border-red-300"
          : ""
      }
    `}
            >
              ● {finalPO?.status?.replace("_", " ") || "N/A"}
            </span>
          </div>
          {/* CREATED BY */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Created By
            </label>
            <Input
              className="mt-1"
              value={finalPO?.creator.full_name || ""}
              disabled
            />
          </div>

          {/* DATE */}
          <div>
            <label className="text-sm font-medium text-gray-600">Date</label>
            <Input className="mt-1" value={date} disabled />
          </div>

          {/* BRANCH */}
          <div>
            <label className="text-sm font-medium text-gray-600">Branch</label>
            <Input className="mt-1" value={selectedBranchName} disabled />
          </div>
        </div>

        {/* TIMELINE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="p-4 bg-gray-50 border rounded">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Created At: </span>
              {finalPO?.created_at
                ? new Date(finalPO.created_at).toLocaleString()
                : "N/A"}
            </div>
            <div className="text-sm text-gray-700 mt-1">
              <span className="font-medium">Updated At: </span>
              {finalPO?.updated_at
                ? new Date(finalPO.updated_at).toLocaleString()
                : "N/A"}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">
              Reference
            </label>
            <Input className="mt-1" value={reference} disabled />
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-700 border-b pb-3 mb-4">
          Purchase Items
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="px-4 py-3 text-left w-10"></th>
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-center font-medium">Image</th>
                <th className="px-4 py-3 text-center font-medium">Price</th>
                <th className="px-4 py-3 text-center font-medium">Quantity</th>
                <th className="px-4 py-3 text-center font-medium">Tax Type</th>
                <th className="px-4 py-3 text-center font-medium">
                  Tax Rate(%)
                </th>
                <th className="px-4 py-3 text-right font-medium">Tax Amount</th>
                <th className="px-4 py-3 text-right font-medium">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-500">
                    Chưa có sản phẩm. Hãy tìm kiếm và thêm ở trên
                  </td>
                </tr>
              ) : (
                lines.map((line) => (
                  <tr key={line.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        className="text-red-500 hover:text-red-700"
                        disabled
                      ></button>
                    </td>

                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{line.product_name}</div>
                        {line.sku && (
                          <div className="text-xs text-gray-500">
                            SKU: {line.sku}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <img
                        src={line.product_image || "/placeholder.png"}
                        alt={line.product_name}
                        className="h-12 w-12 object-cover rounded-md mx-auto border"
                      />
                    </td>
                    <td className="px-4 py-3 text-center capitalize">
                      ${line.sale_price?.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Input
                        type="number"
                        className="w-20 mx-auto"
                        value={line.quantity.toString()}
                        disabled
                      />
                    </td>

                    <td className="px-4 py-3 text-center capitalize">
                      {line.tax_type}
                    </td>

                    <td className="px-4 py-3 text-center">{line.tax_rate}%</td>

                    <td className="px-4 py-3 text-right font-medium">
                      ${line.tax_amount.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-orange-600">
                      ${line.line_total.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOTALS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label className="text-sm font-medium text-gray-600">
            Total Before Tax
          </label>
          <Input className="mt-1" value={`$${totalBeforeTax}`} disabled />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">
            Order Tax Total
          </label>
          <Input className="mt-1" value={`$${totalOrderTax}`} disabled />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">
            Total After Tax
          </label>
          <Input className="mt-1" value={`$${totalAfterTax}`} disabled />
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Description
        </h2>
        <Textarea value={description} disabled rows={5} />
      </div>

      {/* FOOTER BUTTON */}
      <div className="flex justify-end">
        <Button
          className="bg-orange-500 hover:bg-orange-600 px-8"
          onClick={() => navigate("/purchase/orders")}
        >
          Back to List
        </Button>
      </div>

      {confirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Submit for Approval?</h2>
            <p className="text-gray-600 mb-6">
              After submitting for approval, you will no longer be able to edit
              this purchase order.
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
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSubmitApproval}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Yes, Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
