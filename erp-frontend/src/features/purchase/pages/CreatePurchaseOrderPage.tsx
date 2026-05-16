import { useState, useEffect, useRef } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import { Product } from "../../../features/products/store/product.types";
import { useNavigate } from "react-router-dom";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../components/ui/Select";
import { Calendar, Search, Plus, Trash2 } from "lucide-react";

import { searchProductsThunk } from "../../products/store/product.thunks";
import { fetchTaxRatesByIdThunk } from "../../master-data/store/master-data/tax/tax.thunks";
import { fetchAllUomsThunk } from "../../master-data/store/master-data/uom/uom.thunks";
import { fetchAllConversionsThunk } from "../../master-data/store/master-data/conversion/conversion.thunks";
import { createPurchaseOrderThunk } from "../store/purchaseOrder.thunks";
import { toast } from "react-toastify";
import { PurchaseOrderCreate } from "../store";
import { loadPartners } from "@/features/partner/store/partner.thunks";
import {
  getValidUomsForProduct,
  previewQtyInStockUom,
  convertPrice,
} from "../utils/uomHelper";
import { Uom } from "@/features/master-data/dto/uom.dto";

interface LineItem {
  id: number;
  product_id: string | number;
  product_name: string;
  product_image: string;
  sale_price?: number; // Price in stock UOM (for calculation)
  price_in_purchase_uom?: number; // Price user entered (in purchase UOM)
  sku?: string;
  quantity: number;
  quantity_in_stock_uom?: number; // Quantity converted to stock UOM
  uom_id?: number | null;
  uom_name?: string;
  stock_uom_id?: number | null;
  tax_rate_id?: number;
  tax_type: string;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
}

export default function CreatePurchaseOrderPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [lines, setLines] = useState<LineItem[]>([]);
  // ← Cache product objects để recalculate giá khi đổi NCC
  const [productCache, setProductCache] = useState<Record<number, Product>>({});
  // ← Local string state cho price inputs (tránh cursor reset khi gõ số lớn)
  const [priceInputs, setPriceInputs] = useState<Record<number, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);
  const partners = useSelector((state: RootState) => state.partners);
  const uoms = useSelector(
    (state: RootState) => (state as any).uom?.Uoms ?? [],
  );
  const conversions = useSelector(
    (state: RootState) => (state as any).conversion?.UomConversions ?? [],
  );

  useEffect(() => {
    dispatch(loadPartners({ type: "supplier" }));
    dispatch(fetchAllUomsThunk());
    dispatch(fetchAllConversionsThunk());
  }, [dispatch]);

  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const randomNumber = Math.floor(Math.random() * 900 + 100);
    setReference(`PO-${y}${m}${d}-${randomNumber}`);
  }, []);

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

  // ── Helper: tính giá từ product + supplierId ──────────────────────────────
  const resolvePrice = (
    product: Product,
    currentSupplierId: string,
  ): number => {
    const allSupplierInfos =
      (product as any).supplierInfos ?? product.supplierInfo ?? [];
    const supplierPrice = allSupplierInfos.find(
      (s: any) => s.supplier_id === Number(currentSupplierId),
    )?.price;
    return Number(supplierPrice ?? product.cost_price ?? 0);
  };

  // ── Helper: convert price từ stock UOM sang purchase UOM (để hiển thị) ──────
  // Dùng convertPrice từ uomHelper (xử lý đúng product_id=0 và null)
  const convertPriceFromStockUom = (
    priceInStockUom: number,
    purchaseUomId: number | null | undefined,
    stockUomId: number | null | undefined,
    productId: number,
  ): number => {
    // stock → purchase: factor = stockUom per purchaseUom
    // price per purchaseUom = price per stockUom * factor
    // = convertPrice(price, stockUom, purchaseUom) * factor²? No —
    // findFactor(stock→purchase) = 1/24 (nếu box→pcs=24)
    // price/box = price/pcs * 24 = price/pcs / (1/24)
    // Dùng convertPrice(price, purchaseUom→stockUom) ngược lại:
    // convertPrice(price, stockUom, purchaseUom) = price / findFactor(stock→purchase)
    // findFactor(pcs→box) = 1/24 → price / (1/24) = price * 24 ✓
    return convertPrice(
      priceInStockUom,
      stockUomId,
      purchaseUomId,
      conversions,
      productId,
    );
  };

  // ── Helper: convert price từ purchase UOM sang stock UOM ──────────────────
  // Dùng convertPrice từ uomHelper (xử lý đúng product_id=0 và null)
  const convertPriceToStockUom = (
    priceInPurchaseUom: number,
    purchaseUomId: number | null | undefined,
    stockUomId: number | null | undefined,
    productId: number,
  ): number => {
    // purchase → stock: findFactor(box→pcs)=24
    // price/pcs = price/box / 24
    return convertPrice(
      priceInPurchaseUom,
      purchaseUomId,
      stockUomId,
      conversions,
      productId,
    );
  };

  // ── Helper: recalculate totals từ danh sách lines ─────────────────────────
  const recalcTotals = (updatedLines: LineItem[]) => {
    const beforeTax = updatedLines.reduce(
      (sum, l) =>
        sum + (l.sale_price || 0) * (l.quantity_in_stock_uom || l.quantity),
      0,
    );
    const tax = updatedLines.reduce((sum, l) => sum + l.tax_amount, 0);
    const afterTax = updatedLines.reduce((sum, l) => sum + l.line_total, 0);
    setTotalBeforeTax(beforeTax);
    setTotalOrderTax(tax);
    setTotalAfterTax(afterTax);
  };

  // ── Chọn NCC: recalculate giá tất cả lines theo NCC mới ──────────────────
  const handleSupplierChange = (newSupplierId: string) => {
    setSupplierId(newSupplierId);

    if (lines.length === 0) return;

    const updatedLines = lines.map((line) => {
      const cached = productCache[Number(line.product_id)];
      if (!cached) return line;

      // Get new price in purchase UOM
      const newPriceInPurchaseUom = resolvePrice(cached, newSupplierId);

      // Convert to stock UOM
      const newPriceInStockUom = convertPriceToStockUom(
        newPriceInPurchaseUom,
        line.uom_id,
        line.stock_uom_id,
        Number(line.product_id),
      );

      const qtyForCalc = line.quantity_in_stock_uom || line.quantity;
      const taxAmount = qtyForCalc * newPriceInStockUom * (line.tax_rate / 100);
      const lineTotal = qtyForCalc * newPriceInStockUom + taxAmount;

      return {
        ...line,
        price_in_purchase_uom: newPriceInPurchaseUom,
        sale_price: newPriceInStockUom,
        tax_amount: taxAmount,
        line_total: lineTotal,
      };
    });

    setLines(updatedLines);
    recalcTotals(updatedLines);
    // Sync price input strings khi đổi NCC
    const newPriceInputs: Record<number, string> = {};
    updatedLines.forEach((l) => {
      newPriceInputs[l.id] = String(l.price_in_purchase_uom ?? 0);
    });
    setPriceInputs(newPriceInputs);
  };

  // ── Chọn product: dùng supplierId hiện tại (đã fix stale closure) ─────────
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

    // Get price in purchase UOM (from supplier or cost_price)
    const priceInPurchaseUom = resolvePrice(product, supplierId);

    // Calculate quantity in stock UOM
    const purchaseUomId = product.purchase_uom_id ?? product.uom_id ?? null;
    const stockUomId = product.uom_id ?? null;
    let qtyInStockUom = qty;

    if (purchaseUomId && stockUomId && purchaseUomId !== stockUomId) {
      qtyInStockUom = previewQtyInStockUom(
        qty,
        purchaseUomId,
        stockUomId,
        conversions,
        Number(product.id),
      );
    }

    // Convert price to stock UOM for calculation
    const priceInStockUom = convertPriceToStockUom(
      priceInPurchaseUom,
      purchaseUomId,
      stockUomId,
      Number(product.id),
    );

    const taxAmount = qtyInStockUom * priceInStockUom * (rate / 100);
    const lineTotal = qtyInStockUom * priceInStockUom + taxAmount;

    const newLine: LineItem = {
      id: Date.now(),
      product_id: product.id,
      product_name: product.name,
      product_image: product.image_url || "",
      sku: product.sku,
      sale_price: priceInStockUom, // Price in stock UOM (for calculation)
      price_in_purchase_uom: priceInPurchaseUom, // Price user sees (in purchase UOM)
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

    // Cache lại product để dùng khi đổi NCC sau
    setProductCache((prev) => ({ ...prev, [Number(product.id)]: product }));

    const updatedLines = [...lines, newLine];
    setLines(updatedLines);
    recalcTotals(updatedLines);
    // Init price input string cho line mới
    setPriceInputs((prev) => ({
      ...prev,
      [newLine.id]: String(priceInPurchaseUom),
    }));

    setSearchTerm("");
    setShowDropdown(false);
  };

  const updateLine = (
    id: number,
    field: keyof LineItem,
    value: number | null,
  ) => {
    if (field === "quantity" && value && value <= 0) {
      removeLine(id);
      return;
    }
    const updatedLines = lines.map((line) => {
      if (line.id !== id) return line;
      const updated = { ...line, [field]: value };

      // If UOM changed, recalculate quantity_in_stock_uom and price conversion
      if (field === "uom_id") {
        const newUomId = value as number | null;
        const qtyInStockUom =
          newUomId && line.stock_uom_id && newUomId !== line.stock_uom_id
            ? previewQtyInStockUom(
                line.quantity,
                newUomId,
                line.stock_uom_id,
                conversions,
                Number(line.product_id),
              )
            : line.quantity;
        updated.quantity_in_stock_uom = qtyInStockUom;

        // Update uom_name
        const selectedUom = uoms.find((u: Uom) => u.id === newUomId);
        updated.uom_name = selectedUom?.name ?? "";

        // sale_price (per stock UOM) không đổi — chỉ cần recalc price_in_purchase_uom
        // để hiển thị đúng giá per new UOM cho user
        // Ví dụ: sale_price = 291.67/pcs, đổi sang Box (1 box=24pcs)
        //        → price_in_purchase_uom = 291.67 * 24 = 7000/box ✓
        const newPriceInPurchaseUom = convertPriceFromStockUom(
          line.sale_price || 0,
          newUomId,
          line.stock_uom_id,
          Number(line.product_id),
        );
        updated.price_in_purchase_uom = newPriceInPurchaseUom;
        // sale_price stays the same (it's always per stock UOM)
      }

      // If price_in_purchase_uom changed, convert to stock UOM
      if (field === "price_in_purchase_uom") {
        const newPriceInStockUom = convertPriceToStockUom(
          value || 0,
          updated.uom_id,
          updated.stock_uom_id,
          Number(updated.product_id),
        );
        updated.sale_price = newPriceInStockUom;
      }

      // If quantity changed, recalculate quantity_in_stock_uom
      if (field === "quantity") {
        const newQty = value || 1;
        const qtyInStockUom =
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
        updated.quantity_in_stock_uom = qtyInStockUom;
      }

      // Recalculate tax and line total
      const qtyForCalc = updated.quantity_in_stock_uom || updated.quantity;
      const taxAmount =
        (updated.sale_price || 0) * qtyForCalc * (updated.tax_rate / 100);
      const lineTotal = (updated.sale_price || 0) * qtyForCalc + taxAmount;

      return { ...updated, tax_amount: taxAmount, line_total: lineTotal };
    });
    setLines(updatedLines);
    recalcTotals(updatedLines);

    // Sync priceInputs khi UOM thay đổi (để input hiển thị đúng giá per new UOM)
    if (field === "uom_id") {
      const changedLine = updatedLines.find((l) => l.id === id);
      if (changedLine) {
        setPriceInputs((prev) => ({
          ...prev,
          [id]: String(changedLine.price_in_purchase_uom ?? 0),
        }));
      }
    }
  };

  const removeLine = (id: number) => {
    setLines((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      recalcTotals(updated);
      return updated;
    });
    setPriceInputs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const today = new Date().toISOString().split("T")[0];
      if (date > today) return toast.error("Date cannot be in the future!");
      if (!supplierId) return toast.error("Supplier is required");
      if (!date) return toast.error("Order date is required");
      if (lines.length === 0)
        return toast.error("At least 1 product is required");
      const invalidLine = lines.find((l) => !l.quantity || l.quantity <= 0);
      if (invalidLine) return toast.error("Quantity must be greater than 0");

      const requestBody: PurchaseOrderCreate = {
        branch_id: user?.branch.id ?? 0,
        po_no: reference,
        supplier_id: Number(supplierId),
        order_date: date,
        total_before_tax: totalBeforeTax,
        total_tax: totalOrderTax,
        total_after_tax: totalAfterTax,
        status: "draft",
        description,
        lines: lines.map((l) => ({
          product_id: Number(l.product_id),
          quantity: Number(l.quantity),
          qty_in_stock_uom: Number(l.quantity_in_stock_uom || l.quantity),
          uom_id: l.uom_id ?? undefined,
          unit_price: Number(l.price_in_purchase_uom ?? l.sale_price ?? 0), // giá per purchase UOM (168000/box)
          tax_rate_id: Number(l.tax_rate_id),
          line_total: Number(l.line_total),
          line_tax: l.tax_amount ?? 0,
          line_total_after_tax: l.line_total,
        })),
      };
      await dispatch(createPurchaseOrderThunk(requestBody)).unwrap();
      toast.success("Purchase Order created!");
      navigate("/purchase/orders");
    } catch (error) {
      console.error("Failed to create Purchase Order:", error);
      toast.error("Failed to create Purchase Order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">
        Create Purchase Order
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supplier Name <span className="text-red-500">*</span>
          </label>
          {/* ← onValueChange dùng handleSupplierChange thay vì setSupplierId */}
          <Select value={supplierId} onValueChange={handleSupplierChange}>
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
                  <tr key={line.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeLine(line.id)}
                        className="text-red-500 hover:text-red-700"
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
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <input
                          type="number"
                          className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:outline-none w-36 text-right"
                          value={
                            priceInputs[line.id] ??
                            String(line.price_in_purchase_uom ?? 0)
                          }
                          onChange={(e) => {
                            const raw = e.target.value;
                            // Update local string state (không format, giữ nguyên để gõ thoải mái)
                            setPriceInputs((prev) => ({
                              ...prev,
                              [line.id]: raw,
                            }));
                            // Chỉ update line khi có giá trị hợp lệ
                            const price = parseFloat(raw);
                            if (!isNaN(price) && price >= 0) {
                              updateLine(
                                line.id,
                                "price_in_purchase_uom",
                                price,
                              );
                            }
                          }}
                          onBlur={(e) => {
                            // Khi blur: normalize về số hợp lệ
                            const price = Math.max(
                              parseFloat(e.target.value) || 0,
                              0,
                            );
                            setPriceInputs((prev) => ({
                              ...prev,
                              [line.id]: String(price),
                            }));
                            updateLine(line.id, "price_in_purchase_uom", price);
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
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:outline-none w-20 text-center"
                        value={line.quantity}
                        onChange={(e) => {
                          const qty = Math.max(Number(e.target.value) || 1, 1);
                          updateLine(line.id, "quantity", qty);
                        }}
                        min="1"
                        step="1"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(() => {
                        const validUoms = getValidUomsForProduct(
                          uoms,
                          conversions,
                          line.stock_uom_id,
                          Number(line.product_id),
                        );
                        const stockUomName =
                          uoms.find((u: Uom) => u.id === line.stock_uom_id)
                            ?.name ?? "";
                        return (
                          <div className="flex flex-col items-center gap-1">
                            <select
                              className="border rounded px-2 py-1 text-sm w-28"
                              value={line.uom_id ?? ""}
                              onChange={(e) => {
                                const val = e.target.value
                                  ? Number(e.target.value)
                                  : null;
                                updateLine(line.id, "uom_id", val);
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
            {user?.branch.name}
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
