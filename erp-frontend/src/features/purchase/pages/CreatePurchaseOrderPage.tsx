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
import {
  Search,
  Plus,
  Trash2,
  Package,
  ChevronRight,
  AlertCircle,
  Hash,
  Building2,
  CalendarDays,
  Truck,
  Receipt,
  StickyNote,
} from "lucide-react";
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
import { formatVND } from "@/utils/currency.helper";

interface LineItem {
  id: number;
  product_id: string | number;
  product_name: string;
  product_image: string;
  sale_price?: number;
  price_in_purchase_uom?: number;
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
  const [productCache, setProductCache] = useState<Record<number, Product>>({});
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

  const resolvePrice = (
    product: Product,
    currentSupplierId: string,
  ): number => {
    const allSupplierInfos =
      (product as any).supplierInfos ?? product.supplierInfo ?? [];
    const supplierPrice = allSupplierInfos.find(
      (s: any) => s.supplier_id === Number(currentSupplierId),
    )?.price;
    if (supplierPrice !== undefined && supplierPrice !== null) {
      return Number(supplierPrice);
    }
    const costPrice = Number(product.cost_price ?? 0);
    const purchaseUomId = product.purchase_uom_id ?? product.uom_id ?? null;
    const stockUomId = product.uom_id ?? null;
    return convertPrice(costPrice, stockUomId, purchaseUomId, conversions, Number(product.id));
  };

  const convertPriceToStockUom = (
    price: number,
    purchaseUomId: number | null | undefined,
    stockUomId: number | null | undefined,
    productId: number,
  ): number =>
    convertPrice(price, purchaseUomId, stockUomId, conversions, productId);

  const convertPriceFromStockUom = (
    price: number,
    purchaseUomId: number | null | undefined,
    stockUomId: number | null | undefined,
    productId: number,
  ): number =>
    convertPrice(price, stockUomId, purchaseUomId, conversions, productId);

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

  const handleSupplierChange = (newSupplierId: string) => {
    setSupplierId(newSupplierId);
    if (lines.length === 0) return;
    const updatedLines = lines.map((line) => {
      const cached = productCache[Number(line.product_id)];
      if (!cached) return line;
      const newPriceInPurchaseUom = resolvePrice(cached, newSupplierId);
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
    const newPriceInputs: Record<number, string> = {};
    updatedLines.forEach((l) => {
      newPriceInputs[l.id] = String(l.price_in_purchase_uom ?? 0);
    });
    setPriceInputs(newPriceInputs);
  };

  const handleSelectProduct = async (product: Product) => {
    if (lines.some((l) => l.product_id === product.id)) {
      toast.warning("Product already added!");
      return;
    }
    const tax = await dispatch(
      fetchTaxRatesByIdThunk(product.tax_rate_id || 0),
    ).unwrap();
    const rate = Number(tax?.rate || 0);
    const qty = 1;
    const priceInPurchaseUom = resolvePrice(product, supplierId);
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
    setProductCache((prev) => ({ ...prev, [Number(product.id)]: product }));
    const updatedLines = [...lines, newLine];
    setLines(updatedLines);
    recalcTotals(updatedLines);
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
        const selectedUom = uoms.find((u: Uom) => u.id === newUomId);
        updated.uom_name = selectedUom?.name ?? "";
        const newPriceInPurchaseUom = convertPriceFromStockUom(
          line.sale_price || 0,
          newUomId,
          line.stock_uom_id,
          Number(line.product_id),
        );
        updated.price_in_purchase_uom = newPriceInPurchaseUom;
      }
      if (field === "price_in_purchase_uom") {
        updated.sale_price = convertPriceToStockUom(
          value || 0,
          updated.uom_id,
          updated.stock_uom_id,
          Number(updated.product_id),
        );
      }
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
      const qtyForCalc = updated.quantity_in_stock_uom || updated.quantity;
      const taxAmount =
        (updated.sale_price || 0) * qtyForCalc * (updated.tax_rate / 100);
      const lineTotal = (updated.sale_price || 0) * qtyForCalc + taxAmount;
      return { ...updated, tax_amount: taxAmount, line_total: lineTotal };
    });
    setLines(updatedLines);
    recalcTotals(updatedLines);
    if (field === "uom_id") {
      const changedLine = updatedLines.find((l) => l.id === id);
      if (changedLine)
        setPriceInputs((prev) => ({
          ...prev,
          [id]: String(changedLine.price_in_purchase_uom ?? 0),
        }));
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
          unit_price: Number(l.price_in_purchase_uom ?? l.sale_price ?? 0),
          tax_rate_id: Number(l.tax_rate_id),
          line_total: Number(l.line_total),
          line_tax: l.tax_amount ?? 0,
          line_total_after_tax: l.line_total,
        })),
      };
      await dispatch(createPurchaseOrderThunk(requestBody)).unwrap();
      toast.success("Purchase Order created successfully!");
      navigate("/purchase/orders");
    } catch (error) {
      console.error("Failed to create Purchase Order:", error);
      toast.error("Failed to create Purchase Order");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── Sidebar: Order Summary ─── */
  const SidebarSummary = (
    <div className="space-y-3">
      {/* Summary card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Order Summary
          </p>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Items</span>
            <span className="font-semibold text-gray-900">{lines.length}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-700">
              {formatVND(totalBeforeTax)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Tax</span>
            <span className="font-medium text-blue-600">
              {formatVND(totalOrderTax)}
            </span>
          </div>
          <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-800">Total</span>
            <span className="text-base font-bold text-orange-600">
              {formatVND(totalAfterTax)}
            </span>
          </div>
        </div>
      </div>

      {/* Quick info */}
      {(supplierId || date || reference) && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Quick Info
            </p>
          </div>
          <div className="p-4 space-y-2.5">
            {reference && (
              <div className="flex items-center gap-2 text-sm">
                <Hash className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-500 w-16 flex-shrink-0">Ref</span>
                <span className="font-medium text-gray-900 truncate">
                  {reference}
                </span>
              </div>
            )}
            {supplierId && (
              <div className="flex items-center gap-2 text-sm">
                <Truck className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-500 w-16 flex-shrink-0">
                  Supplier
                </span>
                <span className="font-medium text-gray-900 truncate">
                  {(partners as any)?.items?.find(
                    (p: any) => String(p.id) === supplierId,
                  )?.name ?? "—"}
                </span>
              </div>
            )}
            {date && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-500 w-16 flex-shrink-0">Date</span>
                <span className="font-medium text-gray-900">{date}</span>
              </div>
            )}
            {user?.branch?.name && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-500 w-16 flex-shrink-0">Branch</span>
                <span className="font-medium text-gray-900 truncate">
                  {user.branch.name}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Validation warning */}
      {lines.length === 0 && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>Add at least one product line before saving.</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || lines.length === 0}
          className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            <>Create Purchase Order</>
          )}
        </Button>
        <Button
          type="button"
          onClick={() => navigate("/purchase/orders")}
          className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors"
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm border-t-2 border-t-orange-500">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
            <span className="text-gray-400">Purchase</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-gray-400">Orders</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="font-semibold text-gray-900 truncate">
              New Purchase Order
            </span>
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-mono">
            {reference}
          </span>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-screen-2xl mx-auto px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
          {/* ── Left: Main Content ── */}
          <div className="space-y-4 min-w-0">
            {/* Section: General Info */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-visible">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60 rounded-t-xl">
                <Receipt className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-semibold text-gray-700">
                  General Information
                </h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      PO Reference
                    </label>
                    <Input
                      value={reference}
                      onChange={(value) => setReference(value)}
                      placeholder="PO-YYYYMMDD-XXX"
                      className="h-9 text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Supplier{" "}
                      <span className="text-red-400 normal-case font-normal">
                        *
                      </span>
                    </label>
                    <Select
                      value={supplierId}
                      onValueChange={handleSupplierChange}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select supplier…" />
                      </SelectTrigger>
                      <SelectContent>
                        {(partners as any)?.items?.map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Order Date{" "}
                      <span className="text-red-400 normal-case font-normal">
                        *
                      </span>
                    </label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(value) => setDate(value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Branch
                    </label>
                    <Input
                      value={user?.branch?.name ?? ""}
                      disabled
                      className="h-9 text-sm bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Add Products */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-visible">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60 rounded-t-xl">
                <Search className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-semibold text-gray-700">
                  Add Products
                </h2>
                <span className="text-xs text-gray-400 ml-auto">
                  Type at least 2 characters to search
                </span>
              </div>
              <div className="p-5">
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by product name or SKU…"
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
                    />
                    {searchLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
                    )}
                  </div>
                  {showDropdown && products.length > 0 && (
                    <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {products.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleSelectProduct(product)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition-colors text-left border-b border-gray-50 last:border-0"
                        >
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-gray-400 m-auto mt-2" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {product.name}
                            </p>
                            {product.sku && (
                              <p className="text-xs text-gray-400 font-mono">
                                SKU: {product.sku}
                              </p>
                            )}
                          </div>
                          <Plus className="w-4 h-4 text-orange-400 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                  {showDropdown &&
                    products.length === 0 &&
                    !searchLoading &&
                    searchTerm.length >= 2 && (
                      <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-6 text-center text-sm text-gray-400">
                        No products found for "{searchTerm}"
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Section: Order Lines */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
                <Package className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-semibold text-gray-700">
                  Order Lines
                </h2>
                {lines.length > 0 && (
                  <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-600">
                    {lines.length}
                  </span>
                )}
              </div>

              {lines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    No products added
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Search and add products above
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-[35%]">
                          Product
                        </th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          UOM
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Tax
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Line Total
                        </th>
                        <th className="px-2 py-2.5 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {lines.map((line) => {
                        const validUoms = getValidUomsForProduct(
                          uoms,
                          conversions,
                          line.stock_uom_id ?? null,
                          Number(line.product_id),
                        );
                        return (
                          <tr
                            key={line.id}
                            className="hover:bg-orange-50/40 transition-colors"
                          >
                            {/* Product */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                                  {line.product_image ? (
                                    <img
                                      src={line.product_image}
                                      alt={line.product_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package className="w-4 h-4 text-gray-400 m-auto mt-2.5" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900 truncate">
                                    {line.product_name}
                                  </p>
                                  {line.sku && (
                                    <p className="text-xs text-gray-400 font-mono">
                                      SKU: {line.sku}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* UOM */}
                            <td className="px-4 py-3 text-center">
                              {validUoms.length > 1 ? (
                                <select
                                  value={line.uom_id ?? ""}
                                  onChange={(e) =>
                                    updateLine(
                                      line.id,
                                      "uom_id",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                                >
                                  {validUoms.map((u: Uom) => (
                                    <option key={u.id} value={u.id}>
                                      {u.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                                  {line.uom_name || "—"}
                                </span>
                              )}
                            </td>

                            {/* Unit Price */}
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                min={0}
                                value={
                                  priceInputs[line.id] ??
                                  String(line.price_in_purchase_uom ?? 0)
                                }
                                onChange={(e) => {
                                  setPriceInputs((prev) => ({
                                    ...prev,
                                    [line.id]: e.target.value,
                                  }));
                                  updateLine(
                                    line.id,
                                    "price_in_purchase_uom",
                                    Number(e.target.value),
                                  );
                                }}
                                className="w-32 text-right border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                              />
                            </td>

                            {/* Qty */}
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min={1}
                                value={line.quantity}
                                onChange={(e) =>
                                  updateLine(
                                    line.id,
                                    "quantity",
                                    Number(e.target.value),
                                  )
                                }
                                className="w-20 text-center border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                              />
                            </td>

                            {/* Tax */}
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                {line.tax_rate}% {line.tax_type}
                              </span>
                            </td>

                            {/* Line Total */}
                            <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                              {formatVND(line.line_total)}
                            </td>

                            {/* Remove */}
                            <td className="px-2 py-3">
                              <button
                                type="button"
                                onClick={() => removeLine(line.id)}
                                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Section: Notes */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
                <StickyNote className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-semibold text-gray-700">Notes</h2>
                <span className="text-xs text-gray-400 ml-auto">Optional</span>
              </div>
              <div className="p-5">
                <Textarea
                  value={description}
                  onChange={(value) => setDescription(value)}
                  placeholder="Add any notes or instructions for this purchase order…"
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* ── Right: Sticky Sidebar ── */}
          <aside className="space-y-4 lg:sticky lg:top-[3.5rem]">
            {SidebarSummary}
          </aside>
        </div>
      </div>
    </div>
  );
}
