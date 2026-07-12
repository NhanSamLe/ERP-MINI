import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Trash2, Calendar, User, Search, Package,
  FileText, MessageSquare, Inbox, Phone, Mail,
  MapPin, CreditCard, Edit3, AlertCircle,
} from "lucide-react";
import ProductPickerItem from "./ProductPickerItem";
import { Partner } from "@/features/partner/store/partner.types";
import { Product } from "@/features/products/store/product.types";
import { QuotationDto, CreateQuotationDto, UpdateQuotationDto, QuotationLineDto } from "../dto/quotation.dto";
import { Currency } from "@/features/master-data/dto/currency.dto";
import * as currencyService from "@/features/master-data/service/currency.service";
import { StandardFormLayout, FormSection } from "@/components/layout";
import { SearchSelectionModal } from "@/components/common/SearchSelectionModal";
import { ActionConfirmModal } from "@/components/common";
import QuantityControl from "./QuantityControl";
import { NumberField } from "@/components/ui/NumberField";
import { formatVND, formatCurrency } from "@/utils/currency.helper";
import { toDateInputValue } from "@/utils/time.helper";
import { useSaleOrderCalculation } from "../hook/useSaleOrderCalculation";
import { Uom, UomConversion } from "@/features/master-data/dto/uom.dto";
import * as uomService from "@/features/master-data/service/uom.service";
import * as uomConversionService from "@/features/master-data/service/uomConversion.service";
import { getValidUomsForProduct, previewQtyInStockUom } from "@/features/purchase/utils/uomHelper";

interface Props {
  mode: "create" | "edit";
  defaultValue?: Partial<QuotationDto>;
  customers: Partner[];
  products: Product[];
  loading?: boolean;
  submitError?: string;
  onSubmit: (data: CreateQuotationDto | UpdateQuotationDto) => Promise<void>;
  onCancel?: () => void;
}

export default function QuotationForm({
  mode, defaultValue, customers, products, loading = false, submitError, onSubmit, onCancel,
}: Props) {
  const navigate = useNavigate();

  // ── form state ─────────────────────────────────────
  const [customerId, setCustomerId]       = useState<number>(defaultValue?.customer_id ?? 0);
  const [quotationDate, setQuotationDate] = useState(
    toDateInputValue(defaultValue?.quotation_date) || new Date().toISOString().split("T")[0]
  );
  const [validUntil, setValidUntil]       = useState(
    toDateInputValue(defaultValue?.valid_until)
  );
  const [discountPercent, setDiscountPercent] = useState<number>(Number(defaultValue?.discount_percent ?? 0));
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currencyId, setCurrencyId] = useState<number | null>(defaultValue?.currency_id ?? null);
  const [exchangeRate, setExchangeRate] = useState<number>(Number(defaultValue?.exchange_rate ?? 1));
  const [customerNotes, setCustomerNotes] = useState(defaultValue?.customer_notes ?? "");
  const [internalNotes, setInternalNotes] = useState(defaultValue?.internal_notes ?? "");
  const [lines, setLines]                 = useState<QuotationLineDto[]>(() => {
    const defaultLines = defaultValue?.lines ?? [];
    return defaultLines.map((line: any) => ({
      ...line,
      quantity: Number(line.quantity ?? 1),
      unit_price: Number(line.unit_price ?? 0),
      discount_percent: Number(line.discount_percent ?? 0),
      discount_amount: Number(line.discount_amount ?? 0),
    }));
  });
  const [deletedLineIds, setDeletedLineIds] = useState<number[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen]     = useState(false);
  const [uoms, setUoms]                   = useState<Uom[]>([]);
  const [uomConversions, setUomConversions] = useState<UomConversion[]>([]);

  // ── modals ─────────────────────────────────────────
  const [customerModal, setCustomerModal]   = useState(false);
  const [productModal, setProductModal]     = useState(false);
  const [activeLineIdx, setActiveLineIdx]   = useState<number | null>(null);

  // ── Update state when defaultValue changes (for pre-fill from opportunity) ───
  useEffect(() => {
    if (defaultValue?.customer_id && defaultValue.customer_id !== customerId) {
      setCustomerId(defaultValue.customer_id);
    }
  }, [defaultValue?.customer_id]);

  useEffect(() => {
    if (defaultValue) {
      setCurrencyId(defaultValue.currency_id ?? null);
      setExchangeRate(Number(defaultValue.exchange_rate ?? 1));
      setDiscountPercent(Number(defaultValue.discount_percent ?? 0));
      if (defaultValue.lines) {
        setLines(defaultValue.lines.map((l: any) => ({
          ...l,
          quantity: Number(l.quantity ?? 1),
          unit_price: Number(l.unit_price ?? 0),
          discount_percent: Number(l.discount_percent ?? 0),
          discount_amount: Number(l.discount_amount ?? 0),
        })));
      }
    }
  }, [defaultValue]);

  useEffect(() => {
    currencyService.getCurrencies()
      .then((data) => setCurrencies(data || []))
      .catch(() => setCurrencies([]));
  }, []);

  useEffect(() => {
    uomService.getAllUoms()
      .then((data) => setUoms(data || []))
      .catch(() => setUoms([]));
    uomConversionService.getAllUomConversions()
      .then((data) => setUomConversions(data || []))
      .catch(() => setUomConversions([]));
  }, []);

  const fetchExchangeRate = async (cid: number | null, list = currencies) => {
    if (!cid) return 1;
    const selected = list.find((c) => c.id === cid);
    if (!selected || selected.code === "VND") return 1;
    try {
      const data = await currencyService.getExchangeRates();
      const rates: Array<{ quoteCurrency: { code: string }; rate: number }> = data?.rates || [];
      const match = rates.find((r) => r.quoteCurrency.code === selected.code);
      return match?.rate ? 1 / Number(match.rate) : 1;
    } catch {
      return 1;
    }
  };

  const selectedCurrency = currencies.find((c) => c.id === currencyId);
  const currencyCode = selectedCurrency?.code || "VND";
  const currencySymbol = selectedCurrency?.symbol || "VND";
  const formatDocMoney = (value: number | null | undefined) =>
    formatCurrency(value, currencySymbol);

  const formatQty = (value: number) =>
    Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 4 });

  const getUomConversionHint = (line: QuotationLineDto) => {
    const product = products.find((p) => p.id === line.product_id);
    const selectedUomId = line.uom_id ?? product?.uom_id ?? null;
    const stockUomId = product?.uom_id ?? null;
    if (!product || !selectedUomId || !stockUomId) return null;

    const selectedUom = uoms.find((u) => u.id === selectedUomId) || product.uom;
    const stockUom = uoms.find((u) => u.id === stockUomId) || product.uom;
    if (!selectedUom || !stockUom) return null;

    if (selectedUomId === stockUomId) {
      return `ĐVT gốc của sản phẩm: ${stockUom.name} (${stockUom.code})`;
    }

    const factor = previewQtyInStockUom(1, selectedUomId, stockUomId, uomConversions, product.id);
    return `1 ${selectedUom.name} (${selectedUom.code}) = ${formatQty(factor)} ${stockUom.name} (${stockUom.code})`;
  };

  const handleCurrencyChange = async (nextCurrencyId: number | null) => {
    const oldRate = Number(exchangeRate || 1);
    const nextRate = await fetchExchangeRate(nextCurrencyId);
    setCurrencyId(nextCurrencyId);
    setExchangeRate(nextRate);
    setLines((prev) =>
      prev.map((line) => ({
        ...line,
        unit_price: Number(((Number(line.unit_price || 0) * oldRate) / nextRate).toFixed(2)),
      }))
    );
  };

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const { calcLine } = useSaleOrderCalculation(products);

  const selectedProductIds = lines.map((l) => l.product_id).filter((id): id is number => !!id);
  const availableProducts  = products.filter(
    (p) => !selectedProductIds.includes(p.id) ||
      (activeLineIdx !== null && lines[activeLineIdx]?.product_id === p.id)
  );

  // ── line helpers ───────────────────────────────────
  const addLine = () => setLines((prev) => [...prev, {
    product_id: undefined, quantity: 1, unit_price: 0,
    discount_percent: 0, tax_rate_id: undefined,
  } as any]);

  const removeLine = (i: number) => {
    const l = lines[i];
    if (l.id) setDeletedLineIds((prev) => [...prev, l.id!]);
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateLine = (i: number, field: keyof QuotationLineDto, value: any) =>
    setLines((prev) => { const next = [...prev]; next[i] = { ...next[i], [field]: value }; return next; });

  const selectProduct = (i: number, p: Product) => {
    setLines((prev) => {
      const next = [...prev];
      next[i] = {
        ...next[i],
        product_id:  p.id,
        uom_id:      p.uom_id ?? null,
        unit_price:  Number((Number(p.sale_price ?? 0) / Number(exchangeRate || 1)).toFixed(2)),
        tax_rate_id: p.tax_rate_id ?? null,
      };
      return next;
    });
  };

  const handleUomChange = (lineIdx: number, newUomId: number | null) => {
    const line = lines[lineIdx];
    const product = products.find((p) => p.id === line.product_id);
    setLines((prev) => {
      const next = [...prev];
      const updated = { ...next[lineIdx], uom_id: newUomId };
      if (product && newUomId && product.uom_id && uomConversions.length > 0) {
        const factor = previewQtyInStockUom(1, newUomId, product.uom_id, uomConversions, product.id);
        updated.unit_price = Number((Number(product.sale_price ?? 0) * factor / Number(exchangeRate || 1)).toFixed(2));
      }
      next[lineIdx] = updated;
      return next;
    });
  };

  // ── totals ─────────────────────────────────────────
  // Chiết khấu cấp đơn giảm trừ doanh thu chịu thuế TRƯỚC khi tính VAT (chuẩn
  // thuế GTGT VN). Áp cùng hệ số lên subtotal và tax để khớp backend.
  const lineSubtotal  = lines.reduce((acc, l) => acc + calcLine(l).lineTotal, 0);
  const lineTax       = lines.reduce((acc, l) => acc + calcLine(l).taxAmount, 0);
  const discountFactor = discountPercent > 0 ? 1 - discountPercent / 100 : 1;
  const discountAmt   = lineSubtotal * (discountPercent / 100);
  const grandTotal    = lineSubtotal * discountFactor + lineTax * discountFactor;

  // ── submit ─────────────────────────────────────────
  const handleSubmit = async () => {
    if (!customerId) { setValidationError("Vui lòng chọn khách hàng."); return; }
    if (!validUntil) { setValidationError("Vui lòng nhập ngày hiệu lực."); return; }
    if (lines.length === 0) { setValidationError("Vui lòng thêm ít nhất một dòng sản phẩm."); return; }
    if (lines.some((l) => !l.product_id)) { setValidationError("Tất cả dòng phải có sản phẩm được chọn."); return; }
    setValidationError(null);

    const payload: CreateQuotationDto | UpdateQuotationDto = {
      customer_id:      customerId,
      currency_id:      currencyId,
      exchange_rate:    exchangeRate,
      quotation_date:   quotationDate,
      valid_until:      validUntil,
      discount_percent: discountPercent || undefined,
      customer_notes:   customerNotes   || undefined,
      internal_notes:   internalNotes   || undefined,
      lines: lines.map((l) => ({
        id:               l.id,
        product_id:       l.product_id!,
        quantity:         l.quantity,
        uom_id:           l.uom_id ?? null,
        unit_price:       l.unit_price,
        discount_percent: l.discount_percent ?? 0,
        tax_rate_id:      l.tax_rate_id ?? null,
      })),
      ...(mode === "edit" ? { deletedLineIds } : {}),
    };
    await onSubmit(payload as any);
  };

  return (
    <>
      <StandardFormLayout
        title={mode === "create" ? "Tạo Báo giá mới" : `Chỉnh sửa ${defaultValue?.quotation_no ?? "Báo giá"}`}
        actions={[
          { label: "Huỷ", variant: "outline", onClick: () => setDiscardOpen(true) },
          { label: mode === "create" ? "Lưu nháp" : "Lưu thay đổi", variant: "primary", onClick: handleSubmit, isLoading: loading },
        ]}
        sidebarContent={
          <div className="space-y-4">
            {/* Order summary */}
            <FormSection title="Tóm tắt" icon={<CreditCard className="w-4 h-4" />}>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Số dòng</span>
                  <span className="font-semibold text-gray-800">{lines.filter((l) => l.product_id).length} sản phẩm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tạm tính</span>
                  <span className="font-semibold text-gray-800">{formatDocMoney(lineSubtotal)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Giảm giá ({discountPercent}%)</span>
                    <span className="font-semibold text-emerald-600">-{formatDocMoney(discountAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Thuế VAT</span>
                  <span className="font-semibold text-gray-800">{formatDocMoney(lineTax * discountFactor)}</span>
                </div>
                <div className="pt-2.5 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">Tổng cộng</span>
                    <span className="text-base font-bold text-orange-600">{formatDocMoney(grandTotal)}</span>
                  </div>
                  {currencyCode !== "VND" && (
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      ≈ {formatVND(grandTotal * Number(exchangeRate || 1))}
                    </p>
                  )}
                </div>
              </div>
            </FormSection>

            {/* API submit error */}
            {submitError && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-600">{submitError}</p>
              </div>
            )}

            {/* Validation error */}
            {validationError && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-600">{validationError}</p>
              </div>
            )}

            {/* Customer quick info */}
            {selectedCustomer && (
              <FormSection title="Khách hàng" icon={<User className="w-4 h-4" />}>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Phone className="w-3 h-3" />{selectedCustomer.phone}
                    </div>
                  )}
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.tax_code && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <CreditCard className="w-3 h-3" />MST: {selectedCustomer.tax_code}
                    </div>
                  )}
                </div>
              </FormSection>
            )}
          </div>
        }
      >
        {/* ── SECTION 1: Quotation Info ── */}
        <FormSection title="Thông tin Báo giá" icon={<FileText className="w-4 h-4" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Khách hàng */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Khách hàng <span className="text-red-500">*</span>
              </label>
              {mode === "edit" ? (
                <div className="flex items-center gap-2.5 h-9 px-3 bg-gray-50 border border-gray-200 rounded-md">
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {selectedCustomer?.name ?? "—"}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCustomerModal(true)}
                  className={[
                    "w-full h-9 px-3 flex items-center justify-between gap-2 rounded-md border text-sm",
                    "transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500",
                    selectedCustomer
                      ? "border-gray-300 bg-white text-gray-800 hover:border-orange-400"
                      : "border-gray-300 bg-white text-gray-400 hover:border-gray-400",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">
                      {selectedCustomer ? selectedCustomer.name : "Tìm và chọn khách hàng..."}
                    </span>
                  </div>
                  <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </button>
              )}
            </div>

            {/* Ngày báo giá */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Ngày báo giá <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={quotationDate}
                  onChange={(e) => setQuotationDate(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
                />
              </div>
            </div>

            {/* Hiệu lực đến */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Hiệu lực đến <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={validUntil}
                  min={quotationDate}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
                />
              </div>
            </div>

            {/* Chiết khấu tổng */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Chiết khấu tổng (%)
              </label>
              <NumberField
                variant="percent"
                value={discountPercent}
                onChange={(v) => setDiscountPercent(v ?? 0)}
                placeholder="0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Tiền tệ</label>
              <select
                value={currencyId ?? ""}
                onChange={(e) => handleCurrencyChange(e.target.value ? Number(e.target.value) : null)}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
              >
                <option value="">VND</option>
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} ({c.symbol})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Tỉ giá</label>
              <input
                type="number"
                min={0}
                step={0.000001}
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value) || 1)}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Customer info card */}
          {selectedCustomer && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-orange-50/60 border border-orange-100 rounded-lg">
              <div><p className="text-xs text-gray-500 mb-0.5">Điện thoại</p><p className="text-sm font-medium text-gray-800">{selectedCustomer.phone || "—"}</p></div>
              <div><p className="text-xs text-gray-500 mb-0.5">Email</p><p className="text-sm font-medium text-gray-800 truncate">{selectedCustomer.email || "—"}</p></div>
              <div><p className="text-xs text-gray-500 mb-0.5">Mã số thuế</p><p className="text-sm font-medium text-gray-800">{selectedCustomer.tax_code || "—"}</p></div>
              <div><p className="text-xs text-gray-500 mb-0.5">Người liên hệ</p><p className="text-sm font-medium text-gray-800">{selectedCustomer.contact_person || "—"}</p></div>
              {selectedCustomer.address && (
                <div className="col-span-2 md:col-span-4">
                  <p className="text-xs text-gray-500 mb-0.5">Địa chỉ</p>
                  <p className="text-sm text-gray-700 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />{selectedCustomer.address}
                  </p>
                </div>
              )}
              {mode === "create" && (
                <div className="col-span-2 md:col-span-4 flex justify-end">
                  <button type="button" onClick={() => setCustomerModal(true)} className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700">
                    <Edit3 className="w-3 h-3" /> Đổi khách hàng
                  </button>
                </div>
              )}
            </div>
          )}
        </FormSection>

        {/* ── SECTION 2: Line Items ── */}
        <FormSection
          title="Dòng báo giá"
          icon={<Package className="w-4 h-4" />}
          description={`${lines.filter((l) => l.product_id).length} sản phẩm`}
          noPadding
          action={
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm dòng
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <colgroup><col style={{ width: "36px" }} /><col style={{ width: "220px" }} /><col style={{ width: "130px" }} /><col style={{ width: "130px" }} /><col style={{ width: "170px" }} /><col style={{ width: "90px" }} /><col style={{ width: "80px" }} /><col /><col style={{ width: "40px" }} /></colgroup>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  {["#", "Sản phẩm", "ĐVT", "SL", `Đơn giá (${currencyCode})`, "CK%", "Thuế", `Thành tiền (${currencyCode})`, ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Inbox className="w-8 h-8" />
                        <p className="text-sm">Chưa có sản phẩm. Nhấn "Thêm dòng" để bắt đầu.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  lines.map((line, i) => {
                    const product = products.find((p) => p.id === line.product_id);
                    const calc    = calcLine(line);
                    const lineDisc = (line.discount_percent ?? 0);
                    const afterDisc = calc.lineTotal * (1 - lineDisc / 100);
                    const lineTotal = afterDisc + calc.taxAmount;

                    return (
                      <tr key={i} className="group hover:bg-orange-50/30 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>

                        {/* Product */}
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => { setActiveLineIdx(i); setProductModal(true); }}
                            className="flex items-center gap-2 text-left rounded px-2 py-1.5 -ml-2 hover:bg-orange-50 transition-colors group/btn w-full"
                          >
                            <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {product?.image_url
                                ? <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                : <Package className="w-4 h-4 text-gray-300" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              {product ? (
                                <>
                                  <p className="text-sm font-medium text-gray-800 whitespace-normal break-words leading-snug group-hover/btn:text-orange-600 transition-colors">{product.name}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">SKU: {product.sku}</p>
                                </>
                              ) : (
                                <span className="text-sm text-gray-400 italic flex items-center gap-1">
                                  <Search className="w-3.5 h-3.5" /> Nhấn để chọn...
                                </span>
                              )}
                            </div>
                          </button>
                        </td>

                        {/* UoM */}
                        <td className="px-4 py-3">
                          {uoms.length > 0 ? (
                            <div className="space-y-1">
                              <select
                                value={line.uom_id ?? product?.uom_id ?? ""}
                                onChange={(e) => handleUomChange(i, e.target.value ? Number(e.target.value) : null)}
                                disabled={!product}
                                className="h-8 px-2 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700 min-w-[72px] disabled:bg-gray-50 disabled:text-gray-400"
                              >
                                {(uomConversions.length > 0 && product?.uom_id
                                  ? getValidUomsForProduct(uoms, uomConversions, product.uom_id, product.id)
                                  : uoms
                                ).map((u) => (
                                  <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                                ))}
                              </select>
                              {getUomConversionHint(line) && (
                                <p className="max-w-[150px] text-[11px] leading-snug text-gray-500">
                                  {getUomConversionHint(line)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                              {product?.uom?.code || "—"}
                            </span>
                          )}
                        </td>

                        {/* Qty */}
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <QuantityControl value={line.quantity} onChange={(v) => updateLine(i, "quantity", v)} min={1} />
                          </div>
                        </td>

                        {/* Unit Price */}
                        <td className="px-4 py-3">
                          <div className="w-32">
                            <NumberField
                              value={line.unit_price}
                              onChange={(v) => updateLine(i, "unit_price", v ?? 0)}
                              className="h-8"
                            />
                          </div>
                          {product?.sale_price && product.sale_price !== line.unit_price && (
                            <p className="text-[10px] text-gray-400 text-right mt-0.5">
                              Niêm yết: {Number(product.sale_price).toLocaleString("vi-VN")} ₫
                            </p>
                          )}
                        </td>

                        {/* Discount % */}
                        <td className="px-4 py-3">
                          <div className="w-20">
                            <NumberField
                              variant="percent"
                              value={line.discount_percent ?? 0}
                              onChange={(v) => updateLine(i, "discount_percent", v ?? 0)}
                              className="h-8"
                            />
                          </div>
                        </td>

                        {/* Tax % */}
                        <td className="px-4 py-3 text-center">
                          {product?.taxRate ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                              {product.taxRate.rate}%
                            </span>
                          ) : <span className="text-xs text-gray-400">0%</span>}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 text-right">
                          <p className="text-sm font-semibold text-gray-800">{formatDocMoney(lineTotal)}</p>
                          {lineDisc > 0 && (
                            <p className="text-xs text-emerald-600">-{lineDisc}% CK</p>
                          )}
                        </td>

                        {/* Remove */}
                        <td className="px-4 py-3 text-center">
                          <button type="button" onClick={() => removeLine(i)}
                            className="p-1.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
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
        </FormSection>

        {/* ── SECTION 3: Notes ── */}
        <FormSection title="Ghi chú" icon={<MessageSquare className="w-4 h-4" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Ghi chú khách hàng</label>
              <p className="text-xs text-gray-400">Hiển thị trên tài liệu báo giá gửi cho khách hàng</p>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                rows={3}
                placeholder="VD: Điều khoản thanh toán: 30 ngày..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Ghi chú nội bộ</label>
              <p className="text-xs text-gray-400">Chỉ dùng nội bộ — không in trên tài liệu</p>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
                placeholder="VD: Khách hàng yêu cầu giao hàng nhanh..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none placeholder:text-gray-400"
              />
            </div>
          </div>
        </FormSection>
      </StandardFormLayout>

      {/* ── Discard confirm ── */}
      <ActionConfirmModal
        isOpen={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Huỷ thay đổi"
        description="Bạn có chắc muốn huỷ tất cả các thay đổi chưa lưu?"
        confirmText="Huỷ bỏ"
        variant="danger"
        onConfirm={() => onCancel ? onCancel() : navigate("/sales/quotations")}
      />

      {/* ── Customer modal ── */}
      <SearchSelectionModal
        isOpen={customerModal}
        onClose={() => setCustomerModal(false)}
        title="Chọn khách hàng"
        description="Tìm theo tên, điện thoại, email hoặc mã số thuế"
        items={customers}
        searchKeys={["name", "phone", "email", "tax_code"]}
        onSelect={(c) => setCustomerId(c.id)}
        isSelected={(c) => c.id === customerId}
        renderItem={(c, isActive) => (
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${isActive ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"}`}>
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
              <div className="flex items-center gap-3 mt-0.5">
                {c.phone && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                {c.tax_code && <span className="text-xs text-gray-500 flex items-center gap-1"><CreditCard className="w-3 h-3" />MST: {c.tax_code}</span>}
              </div>
            </div>
          </div>
        )}
      />

      {/* ── Product modal ── */}
      <SearchSelectionModal
        isOpen={productModal}
        onClose={() => { setProductModal(false); setActiveLineIdx(null); }}
        title="Chọn sản phẩm"
        description="Tìm theo tên sản phẩm hoặc mã SKU"
        items={availableProducts}
        searchKeys={["name", "sku"]}
        onSelect={(p) => { if (activeLineIdx !== null) selectProduct(activeLineIdx, p); }}
        renderItem={(p) => <ProductPickerItem p={p} />}
      />
    </>
  );
}
