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
import {
  Search,
  Plus,
  Trash2,
  Package,
  ChevronRight,
  Hash,
  CalendarDays,
  Truck,
  Receipt,
  StickyNote,
  AlertCircle,
} from "lucide-react";
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
import { formatVND } from "@/utils/currency.helper";
import { StatusBadge } from "../components/Common";
import { purchasePriceListApi } from "../api/purchasePriceList.api";

interface LineItem {
  id?: number;
  temp_id?: number;
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
  price_source?: "price_list" | "supplier_info" | "cost_price" | "manual";
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
      )
        setShowDropdown(false);
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
    
    let priceInPurchaseUom = resolvePrice(product, supplierId);
    let priceSource: any = "supplier_info";
    let discountPercent = 0;

    if (supplierId) {
      try {
        const pRes = await purchasePriceListApi.evaluatePrice({
          product_id: Number(product.id),
          supplier_id: Number(supplierId),
          quantity: qty,
        });
        priceInPurchaseUom = pRes.unit_price;
        discountPercent = pRes.discount_percent;
        priceSource = pRes.source;
      } catch (e) {
        console.error("Evaluate price failed, using local fallback", e);
      }
    }

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
    const baseTotal = priceInStockUom * qtyInStockUom;
    const discountedTotal = baseTotal * (1 - discountPercent / 100);
    const taxAmount = discountedTotal * (rate / 100);
    const lineTotal = discountedTotal + taxAmount;

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
      price_source: priceSource,
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
          const priceInPurchaseUom = Number(l.unit_price || 0);
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
            price_source: ((finalPO as any)?.price_list_id ? "price_list" : "supplier_info") as "price_list" | "supplier_info",
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

  const handleSupplierChange = async (newSupplierId: string) => {
    setSupplierId(newSupplierId);
    if (lines.length === 0) return;
    const updatedLines = await Promise.all(
      lines.map(async (line) => {
        let newPriceInPurchaseUom = Number(line.price_in_purchase_uom ?? 0);
        let priceSource: any = line.price_source ?? "supplier_info";
        let discountPercent = 0;

        if (newSupplierId) {
          try {
            const pRes = await purchasePriceListApi.evaluatePrice({
              product_id: Number(line.product_id),
              supplier_id: Number(newSupplierId),
              quantity: line.quantity,
            });
            newPriceInPurchaseUom = pRes.unit_price;
            discountPercent = pRes.discount_percent;
            priceSource = pRes.source;
          } catch (e) {
            console.error("Evaluate price failed on Supplier change", e);
          }
        }

        const newPriceInStockUom = convertPriceToStockUom(
          newPriceInPurchaseUom,
          line.uom_id,
          line.stock_uom_id,
          Number(line.product_id),
        );
        const qtyForCalc = line.quantity_in_stock_uom || line.quantity;
        const baseTotal = qtyForCalc * newPriceInStockUom;
        const discountedTotal = baseTotal * (1 - discountPercent / 100);
        const taxAmount = discountedTotal * (line.tax_rate / 100);
        const lineTotal = discountedTotal + taxAmount;

        return {
          ...line,
          price_in_purchase_uom: newPriceInPurchaseUom,
          sale_price: newPriceInStockUom,
          tax_amount: taxAmount,
          line_total: lineTotal,
          price_source: priceSource,
        };
      })
    );
    setLines(updatedLines);
    recalcTotals(updatedLines);
    const newPriceInputs: Record<number, string> = {};
    updatedLines.forEach((l) => {
      if (l.temp_id !== undefined)
        newPriceInputs[l.temp_id] = String(l.price_in_purchase_uom ?? 0);
    });
    setPriceInputs(newPriceInputs);
  };

  const updateLine = async (
    temp_id: number,
    field: keyof LineItem,
    value: number,
  ) => {
    if (field === "quantity" && value <= 0) {
      removeLine(temp_id);
      return;
    }

    let fetchedPrice = null;
    if ((field === "quantity" || field === "uom_id") && supplierId) {
      const line = lines.find((l) => l.temp_id === temp_id);
      if (line) {
        const newQty = field === "quantity" ? (value || 1) : line.quantity;
        try {
          const pRes = await purchasePriceListApi.evaluatePrice({
            product_id: Number(line.product_id),
            supplier_id: Number(supplierId),
            quantity: newQty,
          });
          fetchedPrice = pRes;
        } catch (e) {
          console.error("Evaluate price failed on updateLine", e);
        }
      }
    }

    const updatedLines = lines.map((line) => {
      if (line.temp_id !== temp_id) return line;
      const updated = { ...line, [field]: value };

      if (fetchedPrice) {
        updated.price_in_purchase_uom = fetchedPrice.unit_price;
        updated.price_source = fetchedPrice.source;
        updated.sale_price = convertPriceToStockUom(
          fetchedPrice.unit_price,
          updated.uom_id,
          updated.stock_uom_id,
          Number(updated.product_id)
        );
      }

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
        updated.price_source = "manual";
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

  const selectedSupplierName =
    partners.items.find((w) => w.id === Number(supplierId))?.name || "";

  /* ─── Sidebar ─── */
  const SidebarSummary = (
    <div className="space-y-3">
      {/* Status */}
      {finalPO?.status && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Status
          </span>
          <StatusBadge status={finalPO.status} />
        </div>
      )}

      {/* Summary */}
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Details
          </p>
        </div>
        <div className="p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-sm">
            <Hash className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-500 w-16 flex-shrink-0">Ref</span>
            <span className="font-mono text-xs font-medium text-gray-900 truncate">
              {reference || "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Truck className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-500 w-16 flex-shrink-0">Supplier</span>
            <span className="font-medium text-gray-900 truncate">
              {selectedSupplierName || "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-500 w-16 flex-shrink-0">Date</span>
            <span className="font-medium text-gray-900">{date || "—"}</span>
          </div>
        </div>
      </div>

      {lines.length === 0 && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>Add at least one product line before saving.</span>
        </div>
      )}

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
            "Save Changes"
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
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-gray-400">Purchase</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-gray-400">Orders</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="font-semibold text-gray-900 truncate">
              Edit — {reference || `#${id}`}
            </span>
          </div>
          {finalPO?.status && <StatusBadge status={finalPO.status} />}
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
          {/* ── Main Content ── */}
          <div className="space-y-4 min-w-0">
            {/* General Info */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-visible">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60 rounded-t-xl">
                <Receipt className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-semibold text-gray-700">
                  General Information
                </h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      defaultLabel={selectedSupplierName}
                    >
                      <SelectTrigger className="h-9 text-sm">
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
                      onChange={setDate}
                      max={new Date().toISOString().split("T")[0]}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Reference{" "}
                      <span className="text-red-400 normal-case font-normal">
                        *
                      </span>
                    </label>
                    <Input
                      value={reference}
                      onChange={setReference}
                      placeholder="PO-2025-XXXX"
                      className="h-9 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Add Products */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-visible">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60 rounded-t-xl">
                <Search className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-semibold text-gray-700">
                  Add Products
                </h2>
                <span className="text-xs text-gray-400 ml-auto">
                  Type at least 2 characters
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
                      onFocus={() =>
                        searchTerm &&
                        products.length > 0 &&
                        setShowDropdown(true)
                      }
                      placeholder="Search by name or SKU…"
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
                    />
                    {searchLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
                    )}
                  </div>
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-auto">
                      {searchLoading ? (
                        <div className="px-4 py-3 text-center text-sm text-gray-400">
                          Searching…
                        </div>
                      ) : products.length === 0 ? (
                        <div className="px-4 py-3 text-center text-sm text-gray-400">
                          {searchTerm
                            ? "No products found"
                            : "Type at least 2 characters"}
                        </div>
                      ) : (
                        products.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectProduct(p)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                          >
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                              {(p as any).image_url ? (
                                <img
                                  src={(p as any).image_url}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-4 h-4 text-gray-400 m-auto mt-2" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm text-gray-900 truncate">
                                {p.name}
                              </div>
                              <div className="text-xs text-gray-400 font-mono">
                                SKU: {p.sku}
                              </div>
                            </div>
                            <Plus className="w-4 h-4 text-orange-400 flex-shrink-0" />
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Lines */}
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-[30%]">
                        Product
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        UOM
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Stock Qty
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
                    {lines.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-14 text-center">
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                            <Package className="w-8 h-8 text-gray-300" />
                            <span className="text-sm">
                              No products added yet
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      lines.map((line) => {
                        const validUoms = getValidUomsForProduct(
                          uoms,
                          conversions,
                          line.stock_uom_id,
                          Number(line.product_id),
                        );
                        return (
                          <tr
                            key={line.temp_id}
                            className="hover:bg-orange-50/40 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0">
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
                            <td className="px-4 py-3 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  step="any"
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
                                      if (!isNaN(price) && price >= 0)
                                        updateLine(
                                          line.temp_id,
                                          "price_in_purchase_uom",
                                          price,
                                        );
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
                                  className="w-32 text-right border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono"
                                />
                                {line.price_source && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${
                                    line.price_source === "price_list"
                                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                      : line.price_source === "supplier_info"
                                      ? "bg-blue-50 text-blue-600 border-blue-100"
                                      : line.price_source === "cost_price"
                                      ? "bg-amber-50 text-amber-600 border-amber-100"
                                      : "bg-gray-100 text-gray-500 border-gray-200"
                                  }`}>
                                    {line.price_source === "price_list"
                                      ? "Bảng giá mua"
                                      : line.price_source === "supplier_info"
                                      ? "Giá mặc định NCC"
                                      : line.price_source === "cost_price"
                                      ? "Giá vốn"
                                      : "Nhập tay"}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min={1}
                                step={1}
                                value={line.quantity}
                                onChange={(e) => {
                                  const qty = Math.max(
                                    Number(e.target.value) || 1,
                                    1,
                                  );
                                  if (line.temp_id !== undefined)
                                    updateLine(line.temp_id, "quantity", qty);
                                }}
                                className="w-20 text-center border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <select
                                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
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
                                <option value="">— UOM —</option>
                                {validUoms.map((u: Uom) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                {(
                                  line.quantity_in_stock_uom || line.quantity
                                ).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                {line.tax_rate}% {line.tax_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                              {formatVND(line.line_total)}
                            </td>
                            <td className="px-2 py-3">
                              <button
                                type="button"
                                onClick={() =>
                                  line.temp_id !== undefined &&
                                  removeLine(line.temp_id)
                                }
                                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
                <StickyNote className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-semibold text-gray-700">Notes</h2>
                <span className="text-xs text-gray-400 ml-auto">Optional</span>
              </div>
              <div className="p-5">
                <Textarea
                  value={description}
                  onChange={setDescription}
                  rows={3}
                  className="text-sm resize-none"
                  placeholder="Enter notes or instructions…"
                />
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-4 lg:sticky lg:top-[3.5rem]">
            {SidebarSummary}
          </aside>
        </div>
      </div>
    </div>
  );
}
