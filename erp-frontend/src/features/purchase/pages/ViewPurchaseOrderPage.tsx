import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../store/store";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";

import { fetchProductByIdThunk } from "../../products/store/product.thunks";
import { fetchTaxRatesByIdThunk } from "../../master-data/store/master-data/tax/tax.thunks";
import { fetchAllBranchesThunk } from "../../../features/company/store/branch.thunks";
import { fetchPurchaseOrderByIdThunk } from "../store/purchaseOrder.thunks";
import { PurchaseOrderLine } from "../store";

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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">Edit Purchase Order</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supplier Name <span className="text-red-500">*</span>
          </label>
          <Input
            value="ABC Supplies Ltd"
            disabled
            placeholder="Select Supplier"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              type="date"
              disabled
              value={date}
              onChange={setDate}
              max={new Date().toISOString().split("T")[0]}
            />
            <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference <span className="text-red-500">*</span>
          </label>
          <Input
            disabled
            value={reference}
            onChange={setReference}
            placeholder="PO-2025-XXXX"
          />
        </div>
      </div>
      {/* Product Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Order Tax
          </label>
          <Input
            value={"$" + totalOrderTax.toString()}
            onChange={(v) => setTotalOrderTax(Number(v) || 0)}
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Branch
          </label>
          {branches.length > 0 && (
            <Input
              value={selectedBranchName}
              disabled
              placeholder="Select Branch"
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Before Tax *
          </label>
          <Input
            value={"$" + totalBeforeTax.toString()}
            onChange={(v) => setTotalBeforeTax(Number(v) || 0)}
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total After Tax *
          </label>
          <Input
            value={"$" + totalAfterTax.toString()}
            onChange={(v) => setTotalAfterTax(Number(v) || 0)}
            disabled
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <Textarea
          value={description}
          onChange={setDescription}
          rows={6}
          className="resize-none"
          placeholder="Enter description..."
          disabled
        />
      </div>

      <div className="flex justify-end gap-4 pt-6">
        <Button
          className="bg-orange-500 hover:bg-orange-600 px-8"
          onClick={() => navigate("/purchase/orders")}
        >
          Back to List
        </Button>
      </div>
    </div>
  );
}
