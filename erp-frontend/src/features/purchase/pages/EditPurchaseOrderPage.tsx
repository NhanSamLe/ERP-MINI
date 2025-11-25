import { useState, useEffect, useRef } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../store/store";
import { Product } from "../../../features/products/store/product.types";
import { useParams, useNavigate } from "react-router-dom";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../components/ui/Select";
import { Calendar, Search, Plus, Trash2 } from "lucide-react";

import {
  fetchProductByIdThunk,
  searchProductsThunk,
} from "../../products/store/product.thunks";
import { fetchTaxRatesByIdThunk } from "../../master-data/store/master-data/tax/tax.thunks";
import { fetchAllBranchesThunk } from "../../../features/company/store/branch.thunks";
import {
  fetchPurchaseOrderByIdThunk,
  updatePurchaseOrderThunk,
} from "../store/purchaseOrder.thunks";
import { toast } from "react-toastify";
import { PurchaseOrderLine, PurchaseOrderUpdate } from "../store";

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

export default function EditPurchaseOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const purchaseOrder = useSelector(
    (state: RootState) => state.purchaseOrder.selectedPO
  );

  const [supplierId, setSupplierId] = useState("");
  const [date, setDate] = useState("");
  const [reference, setReference] = useState("");
  const [totalOrderTax, setTotalOrderTax] = useState(0);
  const [branch, setBranch] = useState("");
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [totalBeforeTax, setTotalBeforeTax] = useState(0);
  const [totalAfterTax, setTotalAfterTax] = useState(0);
  const [description, setDescription] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [lines, setLines] = useState<LineItem[]>([]);

  useEffect(() => {
    dispatch(fetchAllBranchesThunk())
      .unwrap()
      .then((data) => setBranches(data || []))
      .catch(() => setBranches([]));
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const keyword = searchTerm.trim();

      if (!keyword || keyword.length < 2) {
        setProducts([]);
        setShowDropdown(false);
        return;
      }

      setSearchLoading(true);

      dispatch(searchProductsThunk(keyword))
        .unwrap()
        .then((data) => {
          setProducts(data || []);
          setShowDropdown(true);
        })
        .catch(() => setProducts([]))
        .finally(() => setSearchLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, dispatch]);

  const handleSelectProduct = async (product: Product) => {
    if (lines.some((l) => l.product_id === product.id)) {
      alert("Sản phẩm đã có trong danh sách!");
      return;
    }

    const tax = await dispatch(
      fetchTaxRatesByIdThunk(product.tax_rate_id || 0)
    ).unwrap();

    console.log("Selected Product Tax:", tax);

    const rate = Number(tax?.rate || 0);
    const qty = 1;
    const price = Number(product.sale_price || 0);

    const taxAmount = qty * price * (rate / 100);
    const lineTotal = qty * price + taxAmount;

    const newLine: LineItem = {
      id: undefined,
      temp_id: Date.now(),
      product_id: product.id,
      product_name: product.name,
      product_image: product.image_url || "",
      sku: product.sku,
      sale_price: price,
      quantity: qty,
      tax_rate_id: product.tax_rate_id,
      tax_type: tax?.type ?? "VAT",
      tax_rate: rate,
      tax_amount: taxAmount,
      line_total: lineTotal,
    };

    const updatedLines = [...lines, newLine];
    setLines(updatedLines);

    const totalBeforeTax = updatedLines.reduce(
      (sum, l) => sum + (l.sale_price || 0) * l.quantity,
      0
    );
    const totalTax = updatedLines.reduce((sum, l) => sum + l.tax_amount, 0);
    const totalAfterTax = updatedLines.reduce(
      (sum, l) => sum + l.line_total,
      0
    );

    setTotalBeforeTax(totalBeforeTax);
    setTotalOrderTax(totalTax);
    setTotalAfterTax(totalAfterTax);

    setSearchTerm("");
    setShowDropdown(false);
  };

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

  const updateLine = (
    temp_id: number,
    field: keyof LineItem,
    value: number
  ) => {
    if (field === "quantity" && value <= 0) {
      removeLine(temp_id);
      return;
    }
    const updatedLines = lines.map((line) => {
      if (line.temp_id !== temp_id) return line;
      const updated = { ...line, [field]: value };

      const taxAmount =
        (updated.sale_price || 0) * updated.quantity * (updated.tax_rate / 100);
      const lineTotal =
        (updated.sale_price || 0) * updated.quantity + taxAmount;

      return {
        ...updated,
        tax_amount: taxAmount,
        line_total: lineTotal,
      };
    });

    setLines(updatedLines);

    const totalBeforeTax = updatedLines.reduce(
      (sum, l) => sum + (l.sale_price || 0) * l.quantity,
      0
    );
    const totalTax = updatedLines.reduce((sum, l) => sum + l.tax_amount, 0);
    const totalAfterTax = updatedLines.reduce(
      (sum, l) => sum + l.line_total,
      0
    );

    setTotalBeforeTax(totalBeforeTax);
    setTotalOrderTax(totalTax);
    setTotalAfterTax(totalAfterTax);
  };

  const removeLine = async (temp_id: number) => {
    setLines((prev) => {
      const updated = prev.filter((l) => l.temp_id !== temp_id);

      const totalBeforeTax = updated.reduce(
        (sum, l) => sum + (l.sale_price || 0) * l.quantity,
        0
      );

      const totalTax = updated.reduce((sum, l) => sum + l.tax_amount, 0);

      const totalAfterTax = updated.reduce((sum, l) => sum + l.line_total, 0);

      setTotalBeforeTax(totalBeforeTax);
      setTotalOrderTax(totalTax);
      setTotalAfterTax(totalAfterTax);

      return updated;
    });
  };

  const handleSubmit = async () => {
    const checkStatusOrder = await dispatch(
      fetchPurchaseOrderByIdThunk(Number(id))
    ).unwrap();
    if (checkStatusOrder.status !== "draft") {
      toast.error("This Purchase Order is no longer editable.");
      navigate("/purchase/orders");
      return;
    }
    try {
      const today = new Date().toISOString().split("T")[0];

      if (date > today) {
        alert("Date cannot be in the future!");
        return;
      }
      if (!branch) return toast.error("Branch is required");
      if (!supplierId) return toast.error("Supplier is required");
      if (!date) return toast.error("Order date is required");
      if (lines.length === 0)
        return toast.error("At least 1 product is required");

      const invalidLine = lines.find((l) => !l.quantity || l.quantity <= 0);
      if (invalidLine) return toast.error("Quantity must be greater than 0");

      const existingLineIds =
        finalPO?.lines?.map((l) => l.id).filter(Boolean) ?? [];

      const currentLineIds = lines.map((l) => l.id).filter(Boolean);

      const deletedLineIds = existingLineIds.filter(
        (id): id is number => id !== undefined && !currentLineIds.includes(id)
      );

      const updatedLines: PurchaseOrderLine[] = lines.map((l) => ({
        id: l.id,
        product_id: Number(l.product_id),
        quantity: Number(l.quantity),
        unit_price: Number(l.sale_price ?? 0),
        tax_rate_id: l.tax_rate_id ? Number(l.tax_rate_id) : undefined,
        line_total: Number(l.line_total),
      }));

      const requestBody: PurchaseOrderUpdate & { deletedLineIds?: number[] } = {
        branch_id: Number(branch),
        po_no: reference,
        supplier_id: Number(supplierId),
        order_date: date,
        total_before_tax: lines.reduce(
          (sum, l) => sum + (l.sale_price ?? 0) * l.quantity,
          0
        ),
        total_tax: lines.reduce((sum, l) => sum + l.tax_amount, 0),
        total_after_tax: lines.reduce((sum, l) => sum + l.line_total, 0),
        description: description,
        lines: updatedLines,
        deletedLineIds: deletedLineIds.length ? deletedLineIds : undefined,
      };

      console.log("➡️ UPDATE BODY:", requestBody);

      await dispatch(
        updatePurchaseOrderThunk({ id: Number(id), body: requestBody })
      ).unwrap();

      toast.success("Purchase Order updated!");
      navigate("/purchase/orders");
    } catch (error) {
      console.error("Failed to update Purchase Order:", error);
      toast.error("Failed to update Purchase Order");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">Edit Purchase Order</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supplier Name <span className="text-red-500">*</span>
          </label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">ABC Supplies Ltd</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              type="date"
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
            value={reference}
            onChange={setReference}
            placeholder="PO-2025-XXXX"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1" ref={dropdownRef}>
            <Input
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={setSearchTerm}
              onFocus={() =>
                searchTerm && products.length > 0 && setShowDropdown(true)
              }
              className="pr-10"
            />
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-64 overflow-auto">
                {searchLoading ? (
                  <div className="px-4 py-3 text-center text-sm text-gray-500">
                    Đang tìm...
                  </div>
                ) : products.length === 0 ? (
                  <div className="px-4 py-3 text-center text-sm text-gray-500">
                    {searchTerm
                      ? "Không tìm thấy sản phẩm"
                      : "Gõ ít nhất 2 ký tự để tìm"}
                  </div>
                ) : (
                  products.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className="px-4 py-3 hover:bg-orange-50 cursor-pointer border-b last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-gray-500">
                        SKU: {p.sku} • Sale Price: ${p.sale_price?.toFixed(0)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
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
                        onClick={() =>
                          line.temp_id !== undefined && removeLine(line.temp_id)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
                        onChange={(v) => {
                          const qty = Math.max(Number(v) || 1, 1);
                          if (line.temp_id !== undefined)
                            updateLine(line.temp_id, "quantity", qty);
                        }}
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
            <Select
              value={branch}
              onValueChange={setBranch}
              defaultLabel={selectedBranchName}
            >
              {" "}
              <SelectTrigger>
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id.toString()}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        />
      </div>

      <div className="flex justify-end gap-4 pt-6">
        <Button
          variant="outline"
          className="px-6"
          onClick={() => navigate("/purchase/orders")}
        >
          Cancel
        </Button>
        <Button
          className="bg-orange-500 hover:bg-orange-600 px-8"
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
