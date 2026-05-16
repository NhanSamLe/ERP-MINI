import { useState, useEffect, useRef } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
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
import { fetchAllUomsThunk } from "../../master-data/store/master-data/uom/uom.thunks";
import { fetchAllConversionsThunk } from "../../master-data/store/master-data/conversion/conversion.thunks";
import {
  fetchPurchaseOrderByIdThunk,
  updatePurchaseOrderThunk,
} from "../store/purchaseOrder.thunks";
import { toast } from "react-toastify";
import { PurchaseOrderLine, PurchaseOrderUpdate } from "../store";
import { Branch, fetchBranch } from "@/features/company/branch.service";
import { loadPartners } from "@/features/partner/store/partner.thunks";
import {
  getValidUomsForProduct,
  previewQtyInStockUom,
  convertPrice,
} from "../utils/uomHelper";
import { Uom } from "@/features/master-data/dto/uom.dto";
import { PurchaseOrderStatus } from "../constants/purchaseStatus.enum";

interface LineItem {
  id?: number;
  temp_id?: number;
  product_id: string | number;
  product_name: string;
  product_image: string;
  sale_price?: number; // Price per stock UOM (for calculation)
  price_in_purchase_uom?: number; // Price per purchase UOM (what user sees & saves)
  sku?: string;
  quantity: number;
  quantity_in_stock_uom?: number;
  uom_id?: number | null;
  uom_name?: string;
  stock_uom_id?: number | null;
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
    (state: RootState) => state.purchaseOrder.selectedPO,
  );
  const partners = useSelector((state: RootState) => state.partners);
  const uoms = useSelector(
    (state: RootState) => (state as any).uom?.Uoms ?? [],
  );
  const conversions = useSelector(
    (state: RootState) => (state as any).conversion?.UomConversions ?? [],
  );

  const [supplierId, setSupplierId] = useState("");
  const [date, setDate] = useState("");
  const [reference, setReference] = useState("");
  const [totalOrderTax, setTotalOrderTax] = useState(0);
  const [totalBeforeTax, setTotalBeforeTax] = useState(0);
  const [totalAfterTax, setTotalAfterTax] = useState(0);
  const [description, setDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priceInputs, setPriceInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    if (id) dispatch(fetchPurchaseOrderByIdThunk(Number(id)));
    dispatch(loadPartners({ type: "supplier" }));
    dispatch(fetchAllUomsThunk());
    dispatch(fetchAllConversionsThunk());
  }, [dispatch, id]);

  const selectedSupplierName =
    partners.items.find((w) => w.id === Number(supplierId))?.name || "";

  useEffect(() => {
    if (!purchaseOrder) return;
    fetchBranch(purchaseOrder.branch_id!)
      .then((res) => setBranch(res))
      .catch(() => setBranch(null));
  }, [purchaseOrder]);

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

  // ── Helper: recalc totals ─────────────────────────────────────────────────
  const recalcTotals = (updatedLines: LineItem[]) => {
    const before = updatedLines.reduce(
      (s, l) =>
        s + (l.sale_price || 0) * (l.quantity_in_stock_uom || l.quantity),
      0,
    );
    const tax = updatedLines.reduce((s, l) => s + l.tax_amount, 0);
    const after = updatedLines.reduce((s, l) => s + l.line_total, 0);
    setTotalBeforeTax(before);
    setTotalOrderTax(tax);
    setTotalAfterTax(after);
  };

  // ── Add new product ───────────────────────────────────────────────────────
  const handleSelectProduct = async (product: Product) => {
    if (lines.some((l) => l.product_id === product.id)) {
      alert("Sản phẩm đã có trong danh sách!");
      return;
    }
    const tax = await dispatch(
      fetchTaxRatesByIdThunk(product.tax_rate_id || 0),
    ).unwrap();
    const rate = Number(tax?.rate || 0);
    const qty = 1;

    const allSupplierInfos =
      (product as any).supplierInfos ?? product.supplierInfo ?? [];
    const supplierPrice = allSupplierInfos.find(
      (s: any) => s.supplier_id === Number(supplierId),
    )?.price;
    const priceInPurchaseUom = Number(supplierPrice ?? product.cost_price ?? 0);

    const purchaseUomId = product.purchase_uom_id ?? product.uom_id ?? null;
    const stockUomId = product.uom_id ?? null;

    const priceInStockUom = convertPrice(
      priceInPurchaseUom,
      purchaseUomId,
      stockUomId,
      conversions,
      Number(product.id),
    );
    const qtyInStockUom = previewQtyInStockUom(
      qty,
      purchaseUomId,
      stockUomId,
      conversions,
      Number(product.id),
    );
    const taxAmount = priceInStockUom * qtyInStockUom * (rate / 100);
    const lineTotal = priceInStockUom * qtyInStockUom + taxAmount;

    const newLine: LineItem = {
      id: undefined,
      temp_id: Date.now(),
      product_id: product.id,
      product_name: product.name,
      product_image: product.image_url || "",
      sku: product.sku,
      sale_price: priceInStockUom,
      price_in_purchase_uom: priceInPurchaseUom,
      quantity: qty,
      quantity_in_stock_uom: qtyInStockUom,
      uom_id: purchaseUomId,
      uom_name: product.purchaseUom?.name ?? product.uom?.name ?? "",
      stock_uom_id: stockUomId,
      tax_rate_id: product.tax_rate_id,
      tax_type: tax?.type ?? "VAT",
      tax_rate: rate,
      tax_amount: taxAmount,
      line_total: lineTotal,
    };

    const updatedLines = [...lines, newLine];
    setLines(updatedLines);
    recalcTotals(updatedLines);
    setPriceInputs((prev) => ({
      ...prev,
      [newLine.temp_id!]: String(priceInPurchaseUom),
    }));
    setSearchTerm("");
    setShowDropdown(false);
  };

  // ── Load existing PO lines ────────────────────────────────────────────────
  const finalPO = purchaseOrder;
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
            fetchProductByIdThunk(Number(l.product_id)),
          ).unwrap();
          const tax = await dispatch(
            fetchTaxRatesByIdThunk(product.tax_rate_id || 0),
          ).unwrap();

          const purchaseUomId =
            (l as any).uom_id ??
            product.purchase_uom_id ??
            product.uom_id ??
            null;
          const stockUomId = product.uom_id ?? null;

          // unit_price in DB = price per purchase UOM (e.g. 168000/box)
          const priceInPurchaseUom = Number(l.unit_price || 0);
          // Convert to stock UOM for calculation (e.g. 168000/24 = 7000/pcs)
          const priceInStockUom = convertPrice(
            priceInPurchaseUom,
            purchaseUomId,
            stockUomId,
            conversions,
            Number(l.product_id),
          );

          const qty = Number(l.quantity || 0);
          const qtyInStockUom =
            Number((l as any).qty_in_stock_uom) ||
            previewQtyInStockUom(
              qty,
              purchaseUomId,
              stockUomId,
              conversions,
              Number(l.product_id),
            );

          const taxRate = Number(tax?.rate || 0);
          const taxAmount = priceInStockUom * qtyInStockUom * (taxRate / 100);
          const lineTotal = priceInStockUom * qtyInStockUom + taxAmount;

          return {
            id: l.id ?? undefined,
            temp_id: l.id ?? Date.now(),
            product_id: l.product_id,
            product_name: product.name,
            sku: product.sku,
            product_image: product.image_url ?? "",
            sale_price: priceInStockUom,
            price_in_purchase_uom: priceInPurchaseUom,
            quantity: qty,
            quantity_in_stock_uom: qtyInStockUom,
            uom_id: purchaseUomId,
            uom_name: product.purchaseUom?.name ?? product.uom?.name ?? "",
            stock_uom_id: stockUomId,
            tax_rate: taxRate,
            tax_rate_id: product.tax_rate_id,
            tax_type: tax?.type || "VAT",
            tax_amount: taxAmount,
            line_total: lineTotal,
          };
        }),
      );

      setLines(enrichedLines);

      const newPriceInputs: Record<number, string> = {};
      enrichedLines.forEach((l) => {
        if (l.temp_id !== undefined)
          newPriceInputs[l.temp_id] = String(l.price_in_purchase_uom ?? 0);
      });
      setPriceInputs(newPriceInputs);
      recalcTotals(enrichedLines);
    };

    loadLines();
  }, [finalPO, dispatch]);

  // ── Update line ───────────────────────────────────────────────────────────
  const updateLine = (
    temp_id: number,
    field: keyof LineItem,
    value: number,
  ) => {
    if (field === "quantity" && value <= 0) {
      removeLine(temp_id);
      return;
    }

    const updatedLines = lines.map((line) => {
      if (line.temp_id !== temp_id) return line;
      const updated = { ...line, [field]: value };

      if (field === "quantity") {
        const newQty = value || 1;
        updated.quantity_in_stock_uom =
          updated.uom_id &&
          updated.stock_uom_id &&
          updated.uom_id !== updated.stock_uom_id
            ? previewQtyInStockUom(
                newQty,
                updated.uom_id,
                updated.stock_uom_id,
                conversions,
                Number(updated.product_id),
              )
            : newQty;
      }

      if (field === "price_in_purchase_uom") {
        updated.sale_price = convertPrice(
          value,
          updated.uom_id,
          updated.stock_uom_id,
          conversions,
          Number(updated.product_id),
        );
      }

      const qtyForCalc = updated.quantity_in_stock_uom || updated.quantity;
      const taxAmount =
        (updated.sale_price || 0) * qtyForCalc * (updated.tax_rate / 100);
      const lineTotal = (updated.sale_price || 0) * qtyForCalc + taxAmount;
      return { ...updated, tax_amount: taxAmount, line_total: lineTotal };
    });

    setLines(updatedLines);
    recalcTotals(updatedLines);
  };

  const removeLine = (temp_id: number) => {
    setLines((prev) => {
      const updated = prev.filter((l) => l.temp_id !== temp_id);
      recalcTotals(updated);
      return updated;
    });
    setPriceInputs((prev) => {
      const next = { ...prev };
      delete next[temp_id];
      return next;
    });
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const checkStatusOrder = await dispatch(
        fetchPurchaseOrderByIdThunk(Number(id)),
      ).unwrap();
      if (checkStatusOrder.status !== PurchaseOrderStatus.DRAFT) {
        toast.error("This Purchase Order is no longer editable.");
        navigate("/purchase/orders");
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      if (date > today) {
        toast.error("Date cannot be in the future!");
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
        (id): id is number => id !== undefined && !currentLineIds.includes(id),
      );

      const updatedLines: PurchaseOrderLine[] = lines.map((l) => ({
        id: l.id,
        product_id: Number(l.product_id),
        quantity: Number(l.quantity),
        qty_in_stock_uom: Number(l.quantity_in_stock_uom || l.quantity),
        uom_id: l.uom_id ?? undefined,
        unit_price: Number(l.price_in_purchase_uom ?? l.sale_price ?? 0),
        tax_rate_id: l.tax_rate_id ? Number(l.tax_rate_id) : undefined,
        line_total: Number(l.line_total),
        line_tax: l.tax_amount,
        line_total_after_tax: l.line_total,
      }));

      const requestBody: PurchaseOrderUpdate & { deletedLineIds?: number[] } = {
        branch_id: branch.id ?? 0,
        po_no: reference,
        supplier_id: Number(supplierId),
        order_date: date,
        total_before_tax: totalBeforeTax,
        total_tax: totalOrderTax,
        total_after_tax: totalAfterTax,
        description,
        lines: updatedLines,
        deletedLineIds: deletedLineIds.length ? deletedLineIds : undefined,
      };

      await dispatch(
        updatePurchaseOrderThunk({ id: Number(id), body: requestBody }),
      ).unwrap();
      toast.success("Purchase Order updated!");
      navigate("/purchase/orders");
    } catch (error) {
      console.error("Failed to update Purchase Order:", error);
      toast.error("Failed to update Purchase Order");
    } finally {
      setIsSubmitting(false);
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
          <Select
            value={supplierId}
            onValueChange={(v) => setSupplierId(v)}
            defaultLabel={selectedSupplierName}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Supplier" />
            </SelectTrigger>
            <SelectContent>
              {partners.items.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
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

      {/* Product search */}
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
                        SKU: {p.sku} • Sale Price: {p.sale_price?.toFixed(0)}
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
                <th className="px-4 py-3 text-center font-medium">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-center font-medium">Quantity</th>
                <th className="px-4 py-3 text-center font-medium">UOM</th>
                <th className="px-4 py-3 text-center font-medium">
                  Qty in Stock UOM
                </th>
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
                  <td colSpan={11} className="text-center py-16 text-gray-500">
                    Chưa có sản phẩm. Hãy tìm kiếm và thêm ở trên
                  </td>
                </tr>
              ) : (
                lines.map((line) => (
                  <tr key={line.temp_id} className="border-t hover:bg-gray-50">
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
                      <div className="font-medium">{line.product_name}</div>
                      {line.sku && (
                        <div className="text-xs text-gray-500">
                          SKU: {line.sku}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <img
                        src={line.product_image || "/placeholder.png"}
                        alt={line.product_name}
                        className="h-12 w-12 object-cover rounded-md mx-auto border"
                      />
                    </td>
                    {/* Unit Price — editable, per purchase UOM */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <input
                          type="number"
                          className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:outline-none w-36 text-right"
                          value={
                            line.temp_id !== undefined
                              ? (priceInputs[line.temp_id] ??
                                String(line.price_in_purchase_uom ?? 0))
                              : String(line.price_in_purchase_uom ?? 0)
                          }
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (line.temp_id !== undefined) {
                              setPriceInputs((prev) => ({
                                ...prev,
                                [line.temp_id!]: raw,
                              }));
                              const price = parseFloat(raw);
                              if (!isNaN(price) && price >= 0) {
                                updateLine(
                                  line.temp_id,
                                  "price_in_purchase_uom",
                                  price,
                                );
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const price = Math.max(
                              parseFloat(e.target.value) || 0,
                              0,
                            );
                            if (line.temp_id !== undefined) {
                              setPriceInputs((prev) => ({
                                ...prev,
                                [line.temp_id!]: String(price),
                              }));
                              updateLine(
                                line.temp_id,
                                "price_in_purchase_uom",
                                price,
                              );
                            }
                          }}
                          min="0"
                          step="any"
                        />
                        {line.uom_name && (
                          <span className="text-xs text-gray-400">
                            per {line.uom_name}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Quantity */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:outline-none w-20 text-center"
                        value={line.quantity}
                        onChange={(e) => {
                          const qty = Math.max(Number(e.target.value) || 1, 1);
                          if (line.temp_id !== undefined)
                            updateLine(line.temp_id, "quantity", qty);
                        }}
                        min="1"
                        step="1"
                      />
                    </td>
                    {/* UOM selector */}
                    <td className="px-4 py-3 text-center">
                      {(() => {
                        const validUoms = getValidUomsForProduct(
                          uoms,
                          conversions,
                          line.stock_uom_id,
                          Number(line.product_id),
                        );
                        return (
                          <div className="flex flex-col items-center gap-1">
                            <select
                              className="border rounded px-2 py-1 text-sm w-28"
                              value={line.uom_id ?? ""}
                              onChange={(e) => {
                                const val = e.target.value
                                  ? Number(e.target.value)
                                  : null;
                                if (line.temp_id === undefined) return;
                                const selectedUom = uoms.find(
                                  (u: Uom) => u.id === val,
                                );
                                const newPriceInPurchaseUom = convertPrice(
                                  line.sale_price || 0,
                                  line.stock_uom_id,
                                  val,
                                  conversions,
                                  Number(line.product_id),
                                );
                                const newQtyInStockUom =
                                  val &&
                                  line.stock_uom_id &&
                                  val !== line.stock_uom_id
                                    ? previewQtyInStockUom(
                                        line.quantity,
                                        val,
                                        line.stock_uom_id,
                                        conversions,
                                        Number(line.product_id),
                                      )
                                    : line.quantity;
                                const taxAmount =
                                  (line.sale_price || 0) *
                                  newQtyInStockUom *
                                  (line.tax_rate / 100);
                                const lineTotal =
                                  (line.sale_price || 0) * newQtyInStockUom +
                                  taxAmount;
                                setLines((prev) =>
                                  prev.map((l) =>
                                    l.temp_id === line.temp_id
                                      ? {
                                          ...l,
                                          uom_id: val,
                                          uom_name: selectedUom?.name ?? "",
                                          price_in_purchase_uom:
                                            newPriceInPurchaseUom,
                                          quantity_in_stock_uom:
                                            newQtyInStockUom,
                                          tax_amount: taxAmount,
                                          line_total: lineTotal,
                                        }
                                      : l,
                                  ),
                                );
                                setPriceInputs((prev) => ({
                                  ...prev,
                                  [line.temp_id!]: String(
                                    newPriceInPurchaseUom,
                                  ),
                                }));
                              }}
                            >
                              <option value="">-- UOM --</option>
                              {validUoms.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium">
                      {(line.quantity_in_stock_uom || line.quantity).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center capitalize">
                      {line.tax_type}
                    </td>
                    <td className="px-4 py-3 text-center">{line.tax_rate}%</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {line.tax_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-orange-600">
                      {line.line_total.toFixed(2)}
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
          <Input value={totalOrderTax.toString()} disabled />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Branch
          </label>
          <div className="border rounded px-3 py-2 bg-gray-100 text-gray-700">
            {branch?.name}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Before Tax *
          </label>
          <Input value={totalBeforeTax.toString()} disabled />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total After Tax *
          </label>
          <Input value={totalAfterTax.toString()} disabled />
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
          className="bg-orange-500 hover:bg-orange-600 px-8 flex items-center gap-2"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Submitting...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </div>
    </div>
  );
}
