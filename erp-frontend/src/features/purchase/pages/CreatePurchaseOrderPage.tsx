import { useState, useEffect, useRef } from "react";
import { Button } from "../../../components/ui/Button";
import { NumberField } from "../../../components/ui/NumberField";
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
import { purchasePriceListApi } from "../api/purchasePriceList.api";
import axiosClient from "../../../api/axiosClient";

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
  discount_percent?: number;
  discount_amount?: number;
  discount_type?: "percentage" | "fixed";
  line_total: number;
  price_source?: "price_list" | "supplier_info" | "cost_price" | "manual";
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

  const [headerDiscountType, setHeaderDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [headerDiscountPercent, setHeaderDiscountPercent] = useState(0);
  const [headerDiscountAmount, setHeaderDiscountAmount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [lines, setLines] = useState<LineItem[]>([]);
  const [productCache, setProductCache] = useState<Record<number, Product>>({});
  const [priceInputs, setPriceInputs] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState<any[]>([]);
  const [paymentTermId, setPaymentTermId] = useState("");
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [currencyId, setCurrencyId] = useState("");
  const [exchangeRate, setExchangeRate] = useState("1.0");

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
    axiosClient.get("/master-data/payment-terms")
      .then((res) => setPaymentTerms(res.data || []))
      .catch((err) => console.error("Error fetching payment terms:", err));
    axiosClient.get("/master-data/currencies")
      .then((res) => {
        const list = res.data?.currencies || [];
        setCurrencies(list);
        const vnd = list.find((c: any) => c.code === "VND");
        if (vnd) {
          setCurrencyId(String(vnd.id));
          setExchangeRate("1.0");
        }
      })
      .catch((err) => console.error("Error fetching currencies:", err));
  }, [dispatch]);

  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const randomNumber = Math.floor(Math.random() * 9000 + 1000); // 1000–9999
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
    return convertPrice(
      costPrice,
      stockUomId,
      purchaseUomId,
      conversions,
      Number(product.id),
    );
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

  const recalcTotals = (
    updatedLines: LineItem[],
    headDiscountType = headerDiscountType,
    headDiscountPct = headerDiscountPercent,
    headDiscountAmt = headerDiscountAmount
  ) => {
    const sumLineTotal = updatedLines.reduce(
      (sum, l) => {
        const qty = l.quantity_in_stock_uom || l.quantity;
        const gross = (l.sale_price || 0) * qty;
        let discountAmt = 0;
        if (l.discount_type === "fixed") {
          discountAmt = l.discount_amount || 0;
        } else {
          discountAmt = gross * ((l.discount_percent || 0) / 100);
        }
        return sum + (gross - discountAmt);
      },
      0,
    );

    let finalHeaderDiscountAmount = 0;
    if (headDiscountType === "fixed") {
      finalHeaderDiscountAmount = headDiscountAmt;
    } else {
      finalHeaderDiscountAmount = sumLineTotal * (headDiscountPct / 100);
    }

    updatedLines.forEach(l => {
      const qty = l.quantity_in_stock_uom || l.quantity;
      const gross = (l.sale_price || 0) * qty;
      let discountAmt = 0;
      if (l.discount_type === "fixed") {
        discountAmt = l.discount_amount || 0;
      } else {
        discountAmt = gross * ((l.discount_percent || 0) / 100);
      }
      const lineTotalBeforeHeader = gross - discountAmt;
      const weight = sumLineTotal > 0 ? (lineTotalBeforeHeader / sumLineTotal) : 0;
      const distributedDiscount = finalHeaderDiscountAmount * weight;
      const netLineTotal = lineTotalBeforeHeader - distributedDiscount;
      const taxAmount = netLineTotal * (l.tax_rate / 100);
      
      l.tax_amount = taxAmount;
      l.line_total = netLineTotal + taxAmount;
    });

    const finalBeforeTax = sumLineTotal - finalHeaderDiscountAmount;
    const finalTax = updatedLines.reduce((sum, l) => sum + l.tax_amount, 0);
    const finalAfterTax = finalBeforeTax + finalTax;

    setTotalBeforeTax(finalBeforeTax);
    setTotalOrderTax(finalTax);
    setTotalAfterTax(finalAfterTax);
  };

  const handleSupplierChange = async (newSupplierId: string) => {
    setSupplierId(newSupplierId);
    if (lines.length === 0) return;
    const updatedLines = await Promise.all(
      lines.map(async (line) => {
        const cached = productCache[Number(line.product_id)];
        if (!cached) return line;

        let newPriceInPurchaseUom = resolvePrice(cached, newSupplierId);
        let priceSource: any = "supplier_info";
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
            console.error("Evaluate price failed, using local fallback", e);
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
        const discountAmt = baseTotal * (discountPercent / 100);
        const taxAmount = (baseTotal - discountAmt) * (line.tax_rate / 100);
        const lineTotal = baseTotal - discountAmt + taxAmount;

        return {
          ...line,
          price_in_purchase_uom: newPriceInPurchaseUom,
          sale_price: newPriceInStockUom,
          discount_percent: discountPercent,
          discount_amount: discountAmt,
          discount_type: "percentage" as const,
          tax_amount: taxAmount,
          line_total: lineTotal,
          price_source: priceSource,
        };
      }),
    );
    setLines(updatedLines);
    recalcTotals(updatedLines);
    const newPriceInputs: Record<number, string> = {};
    updatedLines.forEach((l) => {
      newPriceInputs[l.id] = String(l.price_in_purchase_uom ?? 0);
    });
    setPriceInputs(newPriceInputs);
  };
  
  const handleCurrencyChange = async (newCurrencyId: string) => {
    setCurrencyId(newCurrencyId);
    const selected = currencies.find((c) => String(c.id) === newCurrencyId);
    if (!selected || selected.code === "VND") {
      setExchangeRate("1.0");
      return;
    }
    try {
      const res = await axiosClient.get("/master-data/currencies/rates");
      const rates = res.data?.rates || [];
      const rateObj = rates.find((r: any) => String(r.quote_currency_id) === newCurrencyId);
      if (rateObj) {
        const val = Number(rateObj.rate);
        const rateToVnd = val > 0 ? (1 / val).toFixed(2) : "1.0";
        setExchangeRate(rateToVnd);
      } else {
        setExchangeRate("1.0");
      }
    } catch (e) {
      console.error("Failed to load exchange rate", e);
      setExchangeRate("1.0");
    }
  };

  const handleSelectProduct = async (product: Product) => {
    if (lines.some((l) => l.product_id === product.id)) {
      toast.warn("Sản phẩm đã có trong danh sách!");
      return;
    }
    const tax = await dispatch(
      fetchTaxRatesByIdThunk(product.tax_rate_id || 0),
    ).unwrap();
    const rate = Number(tax?.rate || 0);
    const qty = 1;

    setProductCache((prev) => ({ ...prev, [Number(product.id)]: product }));

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
    const baseTotal = qtyInStockUom * priceInStockUom;
    const discountAmt = baseTotal * (discountPercent / 100);
    const taxAmount = (baseTotal - discountAmt) * (rate / 100);
    const lineTotal = baseTotal - discountAmt + taxAmount;

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
      discount_percent: discountPercent,
      discount_amount: discountAmt,
      discount_type: "percentage",
      line_total: lineTotal,
      price_source: priceSource,
    };
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

  const updateLine = async (
    id: number,
    field: keyof LineItem,
    value: any,
  ) => {
    if (field === "quantity" && value && Number(value) <= 0) {
      removeLine(id);
      return;
    }

    let fetchedPrice = null;
    if ((field === "quantity" || field === "uom_id") && supplierId) {
      const line = lines.find((l) => l.id === id);
      if (line) {
        const newQty = field === "quantity" ? Number(value) || 1 : line.quantity;
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
      if (line.id !== id) return line;
      const updated = { ...line, [field]: value };

      if (fetchedPrice) {
        updated.price_in_purchase_uom = fetchedPrice.unit_price;
        updated.price_source = fetchedPrice.source;
        updated.sale_price = convertPriceToStockUom(
          fetchedPrice.unit_price,
          updated.uom_id,
          updated.stock_uom_id,
          Number(updated.product_id),
        );
      }

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

        if (!fetchedPrice) {
          const newPriceInPurchaseUom = convertPriceFromStockUom(
            line.sale_price || 0,
            newUomId,
            line.stock_uom_id,
            Number(line.product_id),
          );
          updated.price_in_purchase_uom = newPriceInPurchaseUom;
        }
      }
      if (field === "price_in_purchase_uom") {
        updated.sale_price = convertPriceToStockUom(
          Number(value) || 0,
          updated.uom_id,
          updated.stock_uom_id,
          Number(updated.product_id),
        );
        updated.price_source = "manual";
      }
      if (field === "quantity") {
        const newQty = Number(value) || 1;
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
      const grossAmount = (updated.sale_price || 0) * qtyForCalc;
      let discountAmount = 0;
      let discountPercent = 0;

      if (updated.discount_type === "fixed") {
        discountAmount = Number(updated.discount_amount || 0);
        discountPercent = grossAmount > 0 ? (discountAmount / grossAmount) * 100 : 0;
      } else {
        discountPercent = Number(updated.discount_percent || 0);
        discountAmount = grossAmount * (discountPercent / 100);
      }

      updated.discount_amount = discountAmount;
      updated.discount_percent = discountPercent;

      const netAmount = grossAmount - discountAmount;
      const taxAmount = netAmount * (updated.tax_rate / 100);
      const lineTotal = netAmount + taxAmount;
      return { ...updated, tax_amount: taxAmount, line_total: lineTotal };
    });
    setLines(updatedLines);
    recalcTotals(updatedLines);
    if (field === "uom_id" || fetchedPrice) {
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
      if (date > today)
        return toast.error("Ngày đặt hàng không thể ở tương lai!");
      if (!supplierId) return toast.error("Vui lòng chọn nhà cung cấp!");
      if (!date) return toast.error("Vui lòng nhập ngày đặt hàng!");
      if (lines.length === 0)
        return toast.error("Vui lòng thêm ít nhất 1 sản phẩm!");
      const invalidLine = lines.find((l) => !l.quantity || l.quantity <= 0);
      if (invalidLine) return toast.error("Số lượng phải lớn hơn 0!");
      const requestBody: PurchaseOrderCreate = {
        branch_id: user?.branch.id ?? 0,
        po_no: reference,
        supplier_id: Number(supplierId),
        order_date: date,
        payment_term_id: paymentTermId ? Number(paymentTermId) : null,
        currency_id: currencyId ? Number(currencyId) : null,
        exchange_rate: Number(exchangeRate) || 1.0,
        total_before_tax: totalBeforeTax,
        total_tax: totalOrderTax,
        total_after_tax: totalAfterTax,
        discount_percent: headerDiscountPercent,
        discount_amount: headerDiscountAmount,
        discount_type: headerDiscountType,
        status: "draft",
        description,
        lines: lines.map((l) => {
          return {
            product_id: Number(l.product_id),
            quantity: Number(l.quantity),
            qty_in_stock_uom: Number(l.quantity_in_stock_uom || l.quantity),
            uom_id: l.uom_id ?? undefined,
            unit_price: Number(l.price_in_purchase_uom ?? l.sale_price ?? 0),
            discount_percent: Number(l.discount_percent ?? 0),
            discount_amount: Number(l.discount_amount ?? 0),
            discount_type: l.discount_type || "percentage",
            tax_rate_id: Number(l.tax_rate_id),
            line_total: Number(l.line_total),
            line_tax: l.tax_amount ?? 0,
            line_total_after_tax: l.line_total,
          };
        }),
      };
      await dispatch(createPurchaseOrderThunk(requestBody)).unwrap();
      toast.success("Tạo đơn đặt hàng thành công!");
      navigate("/purchase/orders");
    } catch (error) {
      console.error("Failed to create Purchase Order:", error);
      toast.error("Lỗi khi tạo đơn đặt hàng!");
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
            Tóm tắt đơn hàng
          </p>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Mặt hàng</span>
            <span className="font-semibold text-gray-900">{lines.length}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Tiền hàng (chưa CK)</span>
            <span className="font-medium text-gray-700">
              {formatVND(lines.reduce((s, l) => {
                const qty = l.quantity_in_stock_uom || l.quantity;
                return s + (l.sale_price || 0) * qty;
              }, 0))}
            </span>
          </div>
          {lines.some(l => (l.discount_percent ?? 0) > 0 || (l.discount_amount ?? 0) > 0) && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-orange-500">Chiết khấu dòng</span>
              <span className="font-medium text-orange-600">
                -{formatVND(lines.reduce((s, l) => {
                  const qty = l.quantity_in_stock_uom || l.quantity;
                  const gross = (l.sale_price || 0) * qty;
                  let discountAmt = 0;
                  if (l.discount_type === "fixed") {
                    discountAmt = l.discount_amount || 0;
                  } else {
                    discountAmt = gross * ((l.discount_percent || 0) / 100);
                  }
                  return s + discountAmt;
                }, 0))}
              </span>
            </div>
          )}

          {/* Header Discount Input Section */}
          <div className="pt-2 border-t border-gray-100 space-y-1.5">
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Chiết khấu tổng đơn
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                value={
                  headerDiscountType === "fixed"
                    ? (headerDiscountAmount || "")
                    : (headerDiscountPercent || "")
                }
                onChange={(e) => {
                  const val = e.target.value === "" ? 0 : Number(e.target.value);
                  if (headerDiscountType === "fixed") {
                    setHeaderDiscountAmount(val);
                    recalcTotals(lines, headerDiscountType, headerDiscountPercent, val);
                  } else {
                    setHeaderDiscountPercent(val);
                    recalcTotals(lines, headerDiscountType, val, headerDiscountAmount);
                  }
                }}
                className="w-full h-8 text-right border border-gray-300 rounded-lg px-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono"
                placeholder="0"
              />
              <select
                value={headerDiscountType}
                onChange={(e) => {
                  const type = e.target.value as "percentage" | "fixed";
                  setHeaderDiscountType(type);
                  if (type === "fixed") {
                    setHeaderDiscountPercent(0);
                    recalcTotals(lines, type, 0, headerDiscountAmount);
                  } else {
                    setHeaderDiscountAmount(0);
                    recalcTotals(lines, type, headerDiscountPercent, 0);
                  }
                }}
                className="h-8 text-xs border border-gray-300 rounded-lg px-1 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              >
                <option value="percentage">%</option>
                <option value="fixed">đ</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm pt-2">
            <span className="text-gray-500">Trước thuế</span>
            <span className="font-semibold text-gray-900">
              {formatVND(totalBeforeTax)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Thuế</span>
            <span className="font-medium text-blue-600">
              {formatVND(totalOrderTax)}
            </span>
          </div>
          <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-800">
              Tổng cộng
            </span>
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
              Thông tin nhanh
            </p>
          </div>
          <div className="p-4 space-y-2.5">
            {reference && (
              <div className="flex items-center gap-2 text-sm">
                <Hash className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-500 w-16 flex-shrink-0">Mã PO</span>
                <span className="font-medium text-gray-900 truncate">
                  {reference}
                </span>
              </div>
            )}
            {supplierId && (
              <div className="flex items-center gap-2 text-sm">
                <Truck className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-500 w-16 flex-shrink-0">
                  Nhà cung cấp
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
                <span className="text-gray-500 w-16 flex-shrink-0">
                  Ngày đặt
                </span>
                <span className="font-medium text-gray-900">{date}</span>
              </div>
            )}
            {user?.branch?.name && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-500 w-16 flex-shrink-0">
                  Chi nhánh
                </span>
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
          <span>Vui lòng thêm ít nhất một sản phẩm trước khi lưu.</span>
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
              Đang lưu…
            </>
          ) : (
            <>Tạo đơn đặt hàng</>
          )}
        </Button>
        <Button
          type="button"
          onClick={() => navigate("/purchase/orders")}
          className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors"
        >
          Hủy
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
            <span className="text-gray-400">Mua hàng</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-gray-400">Đơn hàng</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="font-semibold text-gray-900 truncate">
              Đơn đặt hàng mới
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
                  Thông tin chung
                </h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Mã tham chiếu PO
                    </label>
                    <Input
                      value={reference}
                      onChange={(value) => setReference(value)}
                      placeholder="PO-YYYYMMDD-NNNN"
                      className="h-9 text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Nhà cung cấp{" "}
                      <span className="text-red-400 normal-case font-normal">
                        *
                      </span>
                    </label>
                    <Select
                      value={supplierId}
                      onValueChange={handleSupplierChange}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Chọn nhà cung cấp…" />
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
                      Ngày đặt hàng{" "}
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
                      Chi nhánh
                    </label>
                    <Input
                      value={user?.branch?.name ?? ""}
                      disabled
                      className="h-9 text-sm bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Điều khoản thanh toán
                    </label>
                    <Select
                      value={paymentTermId}
                      onValueChange={setPaymentTermId}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Chọn điều khoản..." />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTerms.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {`${t.name} (${t.days} ngày)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Tiền tệ
                    </label>
                    <Select
                      value={currencyId}
                      onValueChange={handleCurrencyChange}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Chọn tiền tệ..." />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {`${c.code} (${c.name})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Tỷ giá (VND/Ngoại tệ)
                    </label>
                    <Input
                      type="number"
                      value={exchangeRate}
                      onChange={(val) => setExchangeRate(val)}
                      disabled={!currencyId || currencies.find(c => String(c.id) === currencyId)?.code === "VND"}
                      className="h-9 text-sm"
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
                  Thêm sản phẩm
                </h2>
                <span className="text-xs text-gray-400 ml-auto">
                  Nhập ít nhất 2 ký tự để tìm kiếm
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
                      placeholder="Tìm theo tên sản phẩm hoặc SKU…"
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
                        Không tìm thấy sản phẩm nào khớp với "{searchTerm}"
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
                  Chi tiết dòng hàng
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
                    Chưa có sản phẩm nào được thêm
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Tìm kiếm và thêm sản phẩm ở phía trên
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-[30%]">
                          Sản phẩm
                        </th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Đơn vị tính
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Đơn giá
                        </th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Số lượng
                        </th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Chiết khấu
                        </th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Thuế
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Thành tiền
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
                              <div className="flex flex-col items-end gap-1">
                                <div className="w-32">
                                  <NumberField
                                    value={line.price_in_purchase_uom ?? 0}
                                    onChange={(v) =>
                                      updateLine(
                                        line.id,
                                        "price_in_purchase_uom",
                                        v ?? 0,
                                      )
                                    }
                                  />
                                </div>
                                {line.price_source && (
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${
                                      line.price_source === "price_list"
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                        : line.price_source === "supplier_info"
                                          ? "bg-blue-50 text-blue-600 border-blue-100"
                                          : line.price_source === "cost_price"
                                            ? "bg-amber-50 text-amber-600 border-amber-100"
                                            : "bg-gray-100 text-gray-500 border-gray-200"
                                    }`}
                                  >
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

                            {/* Discount */}
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  value={
                                    line.discount_type === "fixed"
                                      ? (line.discount_amount ?? "")
                                      : (line.discount_percent ?? "")
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? 0 : Number(e.target.value);
                                    if (line.discount_type === "fixed") {
                                      updateLine(line.id, "discount_amount", val);
                                    } else {
                                      updateLine(line.id, "discount_percent", val);
                                    }
                                  }}
                                  className="w-20 text-center border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                  placeholder="0"
                                />
                                <select
                                  value={line.discount_type || "percentage"}
                                  onChange={(e) => {
                                    updateLine(line.id, "discount_type", e.target.value);
                                  }}
                                  className="text-xs border border-gray-300 rounded-lg px-1 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                                >
                                  <option value="percentage">%</option>
                                  <option value="fixed">đ</option>
                                </select>
                              </div>
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
                <h2 className="text-sm font-semibold text-gray-700">Ghi chú</h2>
                <span className="text-xs text-gray-400 ml-auto">Tùy chọn</span>
              </div>
              <div className="p-5">
                <Textarea
                  value={description}
                  onChange={(value) => setDescription(value)}
                  placeholder="Thêm ghi chú hoặc hướng dẫn cho đơn đặt hàng này..."
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
