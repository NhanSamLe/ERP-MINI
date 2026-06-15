import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Plus,
  Search,
  Trash2,
  FileText,
  Package,
  ArrowLeft,
} from "lucide-react";
import { AppDispatch, RootState } from "../../../../store/store";
import {
  fetchRfqByIdThunk,
  updateRfqThunk,
  clearSelected,
} from "../../store/rfq";
import axiosClient from "../../../../api/axiosClient";
import { loadPartners } from "@/features/partner/store/partner.thunks";
import { searchProductsThunk } from "../../../products/store/product.thunks";
import { fetchTaxRatesByIdThunk } from "../../../master-data/store/master-data/tax/tax.thunks";
import { fetchAllUomsThunk } from "../../../master-data/store/master-data/uom/uom.thunks";
import { fetchAllConversionsThunk } from "../../../master-data/store/master-data/conversion/conversion.thunks";
import { StandardFormLayout } from "../../../../components/layout/StandardFormLayout";
import { FormSection } from "../../../../components/layout/FormSection";
import { Product } from "../../../products/store/product.types";
import { Uom } from "@/features/master-data/dto/uom.dto";
import {
  getValidUomsForProduct,
  previewQtyInStockUom,
  convertPrice,
} from "../../utils/uomHelper";

interface LineItem {
  tempId: number;
  product_id: number;
  product_name: string;
  stock_uom_id: number | null;
  uom_id: number | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  discount_type?: "percentage" | "fixed";
  tax_rate_id?: number | null;
  tax_rate: number;
  line_tax: number;
  line_total: number;
  line_total_after_tax: number;
  lead_time_days?: number | null;
  description?: string;
}

function calcLine(
  qty: number,
  price: number,
  discountVal: number,
  discountType: "percentage" | "fixed",
  taxRate: number,
): Pick<LineItem, "discount_amount" | "discount_percent" | "line_total" | "line_tax" | "line_total_after_tax"> {
  const gross = qty * price;
  let discount_amount = 0;
  let discount_percent = 0;
  if (discountType === "fixed") {
    discount_amount = discountVal;
    discount_percent = gross > 0 ? (discount_amount / gross) * 100 : 0;
  } else {
    discount_percent = discountVal;
    discount_amount = gross * (discount_percent / 100);
  }
  const line_total = gross - discount_amount;
  const line_tax = (line_total * taxRate) / 100;
  return {
    discount_amount,
    discount_percent,
    line_total,
    line_tax,
    line_total_after_tax: line_total + line_tax,
  };
}

export default function RfqEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const partners = useSelector((s: RootState) => s.partners);
  const user = useSelector((s: RootState) => s.auth.user);
  const { selected: rfq, loading } = useSelector((s: RootState) => s.rfq);
  const uoms = useSelector((s: RootState) => (s as any).uom?.Uoms ?? []);
  const conversions = useSelector(
    (s: RootState) => (s as any).conversion?.UomConversions ?? [],
  );

  // Header fields
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [rfqDate, setRfqDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [supplierNotes, setSupplierNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState<any[]>([]);
  const [paymentTermId, setPaymentTermId] = useState("");
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [currencyId, setCurrencyId] = useState("");
  const [exchangeRate, setExchangeRate] = useState("1.0");

  // Header discount
  const [headerDiscountType, setHeaderDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [headerDiscountPercent, setHeaderDiscountPercent] = useState(0);
  const [headerDiscountAmount, setHeaderDiscountAmount] = useState(0);

  // Line items
  const [lines, setLines] = useState<LineItem[]>([]);

  // Product search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Load RFQ data
  useEffect(() => {
    const numId = Number(id);
    if (id && !isNaN(numId)) {
      dispatch(fetchRfqByIdThunk(numId))
        .unwrap()
        .then((data) => {
          if (!data) {
            setPageLoading(false);
            return;
          }
          setSupplierId(data.supplier_id ?? "");
          setRfqDate(data.rfq_date?.split("T")[0] ?? "");
          setValidUntil(data.valid_until?.split("T")[0] ?? "");
          setInternalNotes(data.internal_notes ?? "");
          setSupplierNotes(data.supplier_notes ?? "");
          setPaymentTermId(data.payment_term_id ? String(data.payment_term_id) : "");
          setCurrencyId(data.currency_id ? String(data.currency_id) : "");
          setExchangeRate(data.exchange_rate ? String(data.exchange_rate) : "1.0");

          // Load header discount
          setHeaderDiscountType(data.discount_type || "percentage");
          setHeaderDiscountPercent(Number(data.discount_percent || 0));
          setHeaderDiscountAmount(Number(data.discount_amount || 0));

          // Load header discount
          setHeaderDiscountType(data.discount_type || "percentage");
          setHeaderDiscountPercent(Number(data.discount_percent || 0));
          setHeaderDiscountAmount(Number(data.discount_amount || 0));

          // Load lines asynchronously to fetch actual tax rates and product details
          const loadLines = async () => {
            const loadedLines = await Promise.all(
              (data.lines ?? []).map(async (line: any, idx: number) => {
                let product: any = null;
                let taxRate = line.taxRate ? Number(line.taxRate.rate ?? 0) : 0;
                let taxRateId = line.tax_rate_id ?? null;
                try {
                  const res = await axiosClient.get(`/product/${line.product_id}`);
                  product = res.data;
                  if (!taxRateId && product?.tax_rate_id) {
                    taxRateId = product.tax_rate_id;
                    const taxRes = await axiosClient.get(`/master-data/tax-rates/${product.tax_rate_id}`);
                    taxRate = Number(taxRes.data?.rate ?? 0);
                  }
                } catch (e) {
                  console.error("Failed to load product/tax for line", e);
                }

                const qty = Number(line.quantity);
                const price = Number(line.unit_price);
                const discPct = Number(line.discount_percent ?? 0);
                const discType = line.discount_type || "percentage";
                
                // Calculate line total before header discount using calcLine
                const calc = calcLine(qty, price, discPct, discType, taxRate);

                return {
                  tempId: idx,
                  product_id: line.product_id,
                  product_name: product?.name ?? line.product?.name ?? `Product ${line.product_id}`,
                  stock_uom_id: product?.uom_id ?? line.product?.uom_id ?? null,
                  uom_id: line.uom_id,
                  quantity: qty,
                  unit_price: price,
                  discount_percent: discPct,
                  discount_amount: calc.discount_amount,
                  discount_type: discType,
                  tax_rate_id: taxRateId,
                  tax_rate: taxRate,
                  line_tax: calc.line_tax,
                  line_total: calc.line_total,
                  line_total_after_tax: calc.line_total_after_tax,
                  lead_time_days: line.lead_time_days ?? null,
                  description: line.description ?? "",
                };
              })
            );
            setLines(loadedLines);
            setPageLoading(false);
          };
          loadLines();
        })
        .catch(() => {
          setPageLoading(false);
        });
    } else {
      setPageLoading(false);
    }
    return () => {
      dispatch(clearSelected());
    };
  }, [id, dispatch]);

  useEffect(() => {
    dispatch(loadPartners({ type: "supplier" }));
    dispatch(fetchAllUomsThunk());
    dispatch(fetchAllConversionsThunk());
    axiosClient.get("/master-data/payment-terms")
      .then((res) => setPaymentTerms(res.data || []))
      .catch((err) => console.error("Error fetching payment terms:", err));
    axiosClient.get("/master-data/currencies")
      .then((res) => {
        setCurrencies(res.data?.currencies || []);
      })
      .catch((err) => console.error("Error fetching currencies:", err));
  }, [dispatch]);

  const handleCurrencyChange = async (val: string) => {
    setCurrencyId(val);
    const curr = currencies.find((c) => String(c.id) === val);
    if (!curr || curr.code === "VND") {
      setExchangeRate("1.0");
      return;
    }
    try {
      const res = await axiosClient.get("/master-data/currencies/rates");
      const rates = res.data?.rates || [];
      const rateObj = rates.find((r: any) => String(r.quote_currency_id) === val);
      if (rateObj) {
        const valueNum = Number(rateObj.rate);
        const rateToVnd = valueNum > 0 ? (1 / valueNum).toFixed(2) : "1.0";
        setExchangeRate(rateToVnd);
      } else {
        setExchangeRate("1.0");
      }
    } catch (e) {
      console.error("Failed to load exchange rate", e);
      setExchangeRate("1.0");
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced product search
  useEffect(() => {
    const timer = setTimeout(() => {
      const kw = searchTerm.trim();
      if (kw.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }
      setSearchLoading(true);
      dispatch(searchProductsThunk(kw))
        .unwrap()
        .then((data) => {
          setSearchResults(data ?? []);
          setShowDropdown(true);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, dispatch]);

  const handleAddProduct = async (product: Product) => {
    if (lines.some((l) => l.product_id === product.id)) {
      toast.warning("Sản phẩm đã được thêm vào danh sách");
      return;
    }
    const tax = await dispatch(
      fetchTaxRatesByIdThunk(product.tax_rate_id || 0),
    ).unwrap();
    const taxRate = Number(tax?.rate ?? 0);
    const stockUomId = product.uom_id ?? null;
    const purchaseUomId = (product as any).purchase_uom_id ?? stockUomId;
    const price = convertPrice(
      Number(product.cost_price ?? 0),
      stockUomId,
      purchaseUomId,
      conversions,
      Number(product.id),
    );
    const calc = calcLine(1, price, 0, "percentage", taxRate);
    setLines((prev) => [
      ...prev,
      {
        tempId: Date.now(),
        product_id: product.id,
        product_name: product.name,
        stock_uom_id: stockUomId,
        uom_id: purchaseUomId,
        quantity: 1,
        unit_price: price,
        discount_percent: 0,
        discount_amount: 0,
        discount_type: "percentage",
        tax_rate_id: product.tax_rate_id ?? null,
        tax_rate: taxRate,
        ...calc,
        lead_time_days: null,
        description: "",
      },
    ]);
    setSearchTerm("");
    setShowDropdown(false);
  };

  const updateLine = (
    tempId: number,
    field: string,
    value: number | string | null,
  ) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.tempId !== tempId) return l;
        const updated = { ...l, [field]: value };
        const discountType = updated.discount_type || "percentage";
        const discountVal = discountType === "fixed" ? Number(updated.discount_amount || 0) : Number(updated.discount_percent || 0);
        const calc = calcLine(
          Number(updated.quantity),
          Number(updated.unit_price),
          discountVal,
          discountType,
          updated.tax_rate,
        );
        return { ...updated, ...calc };
      }),
    );
  };

  const removeLine = (tempId: number) =>
    setLines((prev) => prev.filter((l) => l.tempId !== tempId));

  // Totals calculations with pro-rata distribution of header discount
  const sumLineTotalBeforeHeaderDiscount = lines.reduce((s, l) => s + l.line_total, 0);
  const evaluatedHeaderDiscountAmount = headerDiscountType === "fixed"
    ? headerDiscountAmount
    : sumLineTotalBeforeHeaderDiscount * (headerDiscountPercent / 100);

  const processedLines = lines.map((l) => {
    const weight = sumLineTotalBeforeHeaderDiscount > 0 ? (l.line_total / sumLineTotalBeforeHeaderDiscount) : 0;
    const distributedDiscount = evaluatedHeaderDiscountAmount * weight;
    const netLineTotal = l.line_total - distributedDiscount;
    const netLineTax = l.line_total > 0 ? l.line_tax * (netLineTotal / l.line_total) : 0;
    const netLineTotalAfterTax = netLineTotal + netLineTax;
    return {
      ...l,
      net_line_total: netLineTotal,
      net_line_tax: netLineTax,
      net_line_total_after_tax: netLineTotalAfterTax,
    };
  });

  const totalGross = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const totalDiscount = lines.reduce((s, l) => s + l.discount_amount, 0);
  const totalBeforeTax = sumLineTotalBeforeHeaderDiscount - evaluatedHeaderDiscountAmount;
  const totalTax = processedLines.reduce((s, l) => s + l.net_line_tax, 0);
  const totalAfterTax = totalBeforeTax + totalTax;

  const handleSubmit = async () => {
    if (!rfq) {
      toast.error("Không thể tải thông tin RFQ");
      return;
    }
    if (!rfqDate) {
      toast.error("Vui lòng nhập Ngày yêu cầu báo giá");
      return;
    }
    if (lines.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm");
      return;
    }
    for (const l of lines) {
      if (l.quantity <= 0) {
        toast.error(`Số lượng sản phẩm ${l.product_name} phải lớn hơn 0`);
        return;
      }
      if (l.unit_price <= 0) {
        toast.error(`Đơn giá sản phẩm ${l.product_name} phải lớn hơn 0`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await dispatch(
        updateRfqThunk({
          id: rfq.id,
          body: {
            supplier_id: supplierId || null,
            rfq_date: rfqDate,
            valid_until: validUntil || null,
            currency_id: currencyId ? Number(currencyId) : null,
            exchange_rate: Number(exchangeRate || 1.0),
            payment_term_id: paymentTermId ? Number(paymentTermId) : null,
            internal_notes: internalNotes || null,
            supplier_notes: supplierNotes || null,
            discount_type: headerDiscountType,
            discount_percent: headerDiscountPercent,
            discount_amount: headerDiscountAmount,
            lines: processedLines.map((l) => ({
              product_id: l.product_id,
              description: l.description || null,
              quantity: l.quantity,
              uom_id: l.uom_id ?? null,
              unit_price: l.unit_price,
              discount_percent: l.discount_percent,
              discount_amount: l.discount_amount,
              discount_type: l.discount_type || "percentage",
              tax_rate_id: l.tax_rate_id ?? null,
              line_total: l.net_line_total,
              line_tax: l.net_line_tax,
              line_total_after_tax: l.net_line_total_after_tax,
              lead_time_days: l.lead_time_days ?? null,
            })),
          },
        }),
      ).unwrap();
      toast.success("Đã cập nhật yêu cầu báo giá RFQ");
      navigate(`/purchase/rfqs/${rfq.id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Cập nhật yêu cầu báo giá thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading || loading) {
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
        <p className="text-sm font-medium">Không tìm thấy yêu cầu báo giá RFQ</p>
        <button
          onClick={() => navigate("/purchase/rfqs")}
          className="text-sm text-orange-600 hover:underline"
        >
          Quay lại danh sách RFQ
        </button>
      </div>
    );
  }

  // Check if RFQ can be edited
  if (!["draft", "received"].includes(rfq.status)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <ArrowLeft className="w-10 h-10 text-gray-300" />
        <p className="text-sm font-medium">
          Chỉ yêu cầu báo giá Nháp hoặc Đã nhận mới có thể chỉnh sửa
        </p>
        <button
          onClick={() => navigate(`/purchase/rfqs/${rfq.id}`)}
          className="text-sm text-orange-600 hover:underline"
        >
          Quay lại RFQ
        </button>
      </div>
    );
  }

  // Safe to render form now that rfq is loaded and valid
  return (
    <StandardFormLayout
      title={`Chỉnh sửa RFQ: ${rfq.rfq_no}`}
      actions={[
        {
          label: "Hủy bỏ",
          variant: "outline",
          onClick: () => navigate(`/purchase/rfqs/${rfq.id}`),
        },
        {
          label: "Lưu thay đổi",
          variant: "primary",
          onClick: handleSubmit,
          isLoading: submitting,
        },
      ]}
    >
      {/* ── Header Info ── */}
      <FormSection
        title="Thông tin yêu cầu báo giá (RFQ)"
        icon={<FileText className="w-4 h-4" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Supplier */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nhà cung cấp
            </label>
            <select
              value={supplierId}
              onChange={(e) =>
                setSupplierId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">— Chọn nhà cung cấp —</option>
              {partners.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* RFQ Date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Ngày RFQ <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={rfqDate}
              onChange={(e) => setRfqDate(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Valid Until */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Hiệu lực đến
            </label>
            <input
              type="date"
              value={validUntil}
              min={rfqDate}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Branch (read-only) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Chi nhánh
            </label>
            <div className="h-9 px-3 flex items-center text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-600">
              {user?.branch?.name ?? "—"}
            </div>
          </div>

          {/* Payment Term */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Điều khoản thanh toán
            </label>
            <select
              value={paymentTermId}
              onChange={(e) => setPaymentTermId(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">— Chọn điều khoản —</option>
              {paymentTerms.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {`${t.name} (${t.days} ngày)`}
                </option>
              ))}
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tiền tệ
            </label>
            <select
              value={currencyId}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">— Chọn tiền tệ —</option>
              {currencies.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {`${c.code} (${c.name})`}
                </option>
              ))}
            </select>
          </div>

          {/* Exchange Rate */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tỷ giá (VND/Ngoại tệ)
            </label>
            <input
              type="number"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              disabled={!currencyId || currencies.find(c => String(c.id) === currencyId)?.code === "VND"}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Header Discount */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
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
                  } else {
                    setHeaderDiscountPercent(val);
                  }
                }}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-right"
                placeholder="0"
              />
              <select
                value={headerDiscountType}
                onChange={(e) => {
                  const type = e.target.value as "percentage" | "fixed";
                  setHeaderDiscountType(type);
                  if (type === "fixed") {
                    setHeaderDiscountPercent(0);
                  } else {
                    setHeaderDiscountAmount(0);
                  }
                }}
                className="h-9 text-xs border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="percentage">%</option>
                <option value="fixed">đ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Ghi chú nội bộ
            </label>
            <textarea
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Ghi chú chỉ hiển thị nội bộ..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Ghi chú nhà cung cấp
            </label>
            <textarea
              rows={3}
              value={supplierNotes}
              onChange={(e) => setSupplierNotes(e.target.value)}
              placeholder="Ghi chú gửi cho nhà cung cấp..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </FormSection>

      {/* ── Products ── */}
      <FormSection
        title="Sản phẩm"
        icon={<Package className="w-4 h-4" />}
        noPadding
        action={
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-2 px-5 py-3">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() =>
                    searchResults.length > 0 && setShowDropdown(true)
                  }
                  className="w-full h-8 pl-8 pr-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 h-8 px-3 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm
              </button>
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-5 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {searchLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    Đang tìm kiếm...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400 text-center">
                    Không tìm thấy sản phẩm
                  </div>
                ) : (
                  searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleAddProduct(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {p.name}
                      </div>
                      <div className="text-xs text-gray-500">SKU: {p.sku}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        }
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-orange-100 bg-orange-50/60">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Sản phẩm
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Số lượng
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                ĐVT
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Đơn giá
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-28">
                Chiết khấu
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Thuế %
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Tiền thuế
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Thành tiền
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                T.gian giao (ngày)
              </th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-10 text-center text-sm text-gray-400"
                >
                  Tìm kiếm và thêm sản phẩm ở trên
                </td>
              </tr>
            ) : (
              processedLines.map((line, i) => (
                <tr key={line.tempId} className="hover:bg-gray-50/60">
                  <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {line.product_name}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(
                          line.tempId,
                          "quantity",
                          Math.max(1, Number(e.target.value)),
                        )
                      }
                      className="w-20 h-7 px-2 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 ml-auto block"
                    />
                  </td>
                  {/* UOM selector */}
                  <td className="px-4 py-2">
                    {(() => {
                      const validUoms = getValidUomsForProduct(
                        uoms,
                        conversions,
                        line.stock_uom_id,
                        line.product_id,
                      );
                      const qtyPreview = previewQtyInStockUom(
                        line.quantity,
                        line.uom_id,
                        line.stock_uom_id,
                        conversions,
                        line.product_id,
                      );
                      const stockUomName =
                        uoms.find((u: Uom) => u.id === line.stock_uom_id)
                          ?.name ?? "";
                      return (
                        <div className="flex flex-col gap-0.5">
                          <select
                            value={line.uom_id ?? ""}
                            onChange={(e) =>
                              updateLine(
                                line.tempId,
                                "uom_id",
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                            className="h-7 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 w-28"
                          >
                            <option value="">— ĐVT —</option>
                            {validUoms.map((u: Uom) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                          {line.uom_id &&
                            line.stock_uom_id &&
                            line.uom_id !== line.stock_uom_id && (
                              <span className="text-xs text-gray-400">
                                ≈ {qtyPreview.toFixed(2)} {stockUomName}
                              </span>
                            )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      value={line.unit_price}
                      onChange={(e) =>
                        updateLine(
                          line.tempId,
                          "unit_price",
                          Number(e.target.value),
                        )
                      }
                      className="w-28 h-7 px-2 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 ml-auto block"
                    />
                  </td>
                  <td className="px-4 py-2">
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
                            updateLine(line.tempId, "discount_amount", val);
                          } else {
                            updateLine(line.tempId, "discount_percent", val);
                          }
                        }}
                        className="w-16 h-7 px-2 text-sm text-right border border-orange-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-orange-50/50"
                        placeholder="0"
                      />
                      <select
                        value={line.discount_type || "percentage"}
                        onChange={(e) => {
                          updateLine(line.tempId, "discount_type", e.target.value);
                        }}
                        className="h-7 text-xs border border-orange-200 rounded px-1 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                      >
                        <option value="percentage">%</option>
                        <option value="fixed">đ</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600">
                    {line.tax_rate}%
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600">
                    {line.line_tax.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">
                    {line.line_total_after_tax.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      placeholder="—"
                      value={line.lead_time_days ?? ""}
                      onChange={(e) =>
                        updateLine(
                          line.tempId,
                          "lead_time_days",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      className="w-16 h-7 px-2 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 ml-auto block"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(line.tempId)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {lines.length > 0 && (
            <tfoot className="border-t border-gray-200 bg-gray-50/50">
              {totalDiscount > 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-2 text-right text-xs font-medium text-gray-500"
                  >
                    Tổng tiền hàng gốc
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-gray-500 line-through">
                    {totalGross.toLocaleString("vi-VN")}
                  </td>
                  <td colSpan={2} />
                </tr>
              )}
              {totalDiscount > 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-2 text-right text-xs font-medium text-orange-500"
                  >
                    Chiết khấu dòng
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-orange-600">
                    -{totalDiscount.toLocaleString("vi-VN")}
                  </td>
                  <td colSpan={2} />
                </tr>
              )}
              {evaluatedHeaderDiscountAmount > 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-2 text-right text-xs font-medium text-orange-500"
                  >
                    Chiết khấu tổng đơn
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-orange-600">
                    -{evaluatedHeaderDiscountAmount.toLocaleString("vi-VN")}
                  </td>
                  <td colSpan={2} />
                </tr>
              )}
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-2 text-right text-xs font-medium text-gray-500"
                >
                  Tổng tiền trước thuế
                </td>
                <td className="px-4 py-2 text-right text-sm font-semibold text-gray-800">
                  {totalBeforeTax.toLocaleString("vi-VN")}
                </td>
                <td colSpan={2} />
              </tr>
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-2 text-right text-xs font-medium text-gray-500"
                >
                  Thuế
                </td>
                <td className="px-4 py-2 text-right text-sm text-gray-700">
                  {totalTax.toLocaleString("vi-VN")}
                </td>
                <td colSpan={2} />
              </tr>
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-2 text-right text-sm font-bold text-gray-800"
                >
                  Tổng cộng
                </td>
                <td className="px-4 py-2 text-right text-base font-bold text-orange-600">
                  {totalAfterTax.toLocaleString("vi-VN")}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </FormSection>
    </StandardFormLayout>
  );
}
