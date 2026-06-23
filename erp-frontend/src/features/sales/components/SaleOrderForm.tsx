import { useEffect, useState } from "react";
import {
  Plus, Trash2, Calendar, User, ShoppingCart,
  Search, Building2, Phone, Mail, MapPin, CreditCard,
  Package, Inbox, AlertCircle, Edit3,
} from "lucide-react";
import ProductPickerItem from "./ProductPickerItem";
import { CreateSaleOrderDto, UpdateSaleOrderDto } from "../dto/saleOrder.dto";
import { Product } from "@/features/products/store/product.types";
import { Partner } from "@/features/partner/store/partner.types";
import { Currency } from "@/features/master-data/dto/currency.dto";
import * as currencyService from "@/features/master-data/service/currency.service";
import { Uom, UomConversion } from "@/features/master-data/dto/uom.dto";
import * as uomService from "@/features/master-data/service/uom.service";
import * as uomConversionService from "@/features/master-data/service/uomConversion.service";
import { getValidUomsForProduct, previewQtyInStockUom } from "@/features/purchase/utils/uomHelper";
import QuantityControl from "./QuantityControl";
import { NumberField } from "@/components/ui/NumberField";
import { useSaleOrderForm } from "../hook/useSaleOrderForm";
import { StandardFormLayout, FormSection } from "@/components/layout";
import { SearchSelectionModal } from "@/components/common/SearchSelectionModal";
import { formatVND } from "@/utils/currency.helper";

interface SaleOrderFormDto {
  id?: number;
  customer_id: number;
  currency_id?: number | null;
  exchange_rate?: number;
  order_date: string;
  lines: any[];
  deletedLineIds?: number[];
}

interface Props {
  mode: "create" | "edit";
  defaultValue?: SaleOrderFormDto;
  onSubmit: (data: CreateSaleOrderDto | UpdateSaleOrderDto) => Promise<void>;
  onCancel?: () => void;
  customers: Partner[];
  products: Product[];
  loading?: boolean;
}

export default function SaleOrderForm({
  mode = "create",
  defaultValue,
  onSubmit,
  onCancel,
  customers,
  products,
  loading = false,
}: Props) {
  const {
    customerId, setCustomerId,
    orderDate, setOrderDate,
    lines, setLines, removeLine, addLine,
    selectProductForLine, updateLine,
    totals, calcLine,
    selectedProductIds, deletedLineIds,
  } = useSaleOrderForm(defaultValue as any, products);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currencyId, setCurrencyId] = useState<number | null>(defaultValue?.currency_id ?? null);
  const [exchangeRate, setExchangeRate] = useState<number>(defaultValue?.exchange_rate ?? 1);
  const [uoms, setUoms] = useState<Uom[]>([]);
  const [uomConversions, setUomConversions] = useState<UomConversion[]>([]);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedCurrency = currencies.find((c) => c.id === currencyId);
  const currencyCode = selectedCurrency?.code || "VND";
  const currencySymbol = selectedCurrency?.symbol || "VND";
  const formatDocMoney = (value: number | null | undefined) =>
    `${Number(value || 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} ${currencySymbol}`;
  const formatQty = (value: number) =>
    Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 4 });
  const getUomConversionHint = (line: any) => {
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
  const availableProducts = products.filter(
    (p) => !selectedProductIds.includes(p.id) || (activeLineIndex !== null && lines[activeLineIndex].product_id === p.id)
  );

  useEffect(() => {
    setCurrencyId(defaultValue?.currency_id ?? null);
    setExchangeRate(defaultValue?.exchange_rate ?? 1);
  }, [defaultValue?.currency_id, defaultValue?.exchange_rate]);

  useEffect(() => {
    currencyService.getCurrencies()
      .then((data) => setCurrencies(data || []))
      .catch(() => setCurrencies([]));
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

  const selectProductForDocumentCurrency = (index: number, product: Product) => {
    selectProductForLine(index, {
      ...product,
      sale_price: Number((Number(product.sale_price ?? 0) / Number(exchangeRate || 1)).toFixed(2)),
    });
  };

  const handleOpenProductModal = (index: number) => {
    setActiveLineIndex(index);
    setIsProductModalOpen(true);
  };

  const handleSubmit = () => {
    if (!customerId || customerId === 0) {
      setValidationError("Vui lòng chọn khách hàng.");
      return;
    }
    if (lines.length === 0) {
      setValidationError("Vui lòng thêm ít nhất một dòng sản phẩm.");
      return;
    }
    if (lines.some((l) => !l.product_id)) {
      setValidationError("Tất cả dòng phải có sản phẩm được chọn.");
      return;
    }
    setValidationError(null);

    const payload: any = {
      customer_id: customerId,
      currency_id: currencyId,
      exchange_rate: exchangeRate,
      order_date: orderDate,
      lines: lines.map((l) => ({
        id: l.id,
        product_id: l.product_id ?? 0,
        quantity: l.quantity ?? 1,
        uom_id: l.uom_id ?? null,
        unit_price: l.unit_price ?? 0,
        tax_rate_id: l.tax_rate_id ?? null,
      })),
      deletedLineIds,
    };
    onSubmit(payload);
  };

  return (
    <>
      <StandardFormLayout
        title={mode === "create" ? "Tạo Đơn hàng mới" : `Chỉnh sửa Đơn hàng #${defaultValue?.id}`}
        actions={[
          { label: "Huỷ", variant: "outline", onClick: onCancel || (() => window.history.back()) },
          {
            label: mode === "create" ? "Lưu nháp" : "Lưu thay đổi",
            variant: "primary",
            onClick: handleSubmit,
            isLoading: loading,
          },
        ]}
        sidebarContent={
          <div className="space-y-4">
            {/* Financial Summary */}
            <FormSection title="Tóm tắt" icon={<CreditCard className="w-4 h-4" />}>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Số dòng</span>
                  <span className="font-semibold text-gray-800">{lines.filter((l) => l.product_id).length} sản phẩm</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Tạm tính</span>
                  <span className="font-semibold text-gray-800">{formatDocMoney(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Thuế VAT</span>
                  <span className="font-semibold text-gray-800">{formatDocMoney(totals.tax)}</span>
                </div>
                <div className="pt-3 mt-1 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">Tổng cộng</span>
                    <span className="text-base font-bold text-orange-600">{formatDocMoney(totals.total)}</span>
                  </div>
                  {currencyCode !== "VND" && (
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      ≈ {formatVND(totals.total * Number(exchangeRate || 1))}
                    </p>
                  )}
                </div>
              </div>
            </FormSection>

            {/* Validation hint */}
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
                      <Phone className="w-3 h-3 shrink-0" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  )}
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.tax_code && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <CreditCard className="w-3 h-3 shrink-0" />
                      <span>MST: {selectedCustomer.tax_code}</span>
                    </div>
                  )}
                </div>
              </FormSection>
            )}
          </div>
        }
      >
        {/* ─── SECTION 1: Order Info ─── */}
        <FormSection title="Thông tin Đơn hàng" icon={<Building2 className="w-4 h-4" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer selector */}
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
                  onClick={() => setIsCustomerModalOpen(true)}
                  className={[
                    "w-full h-9 px-3 flex items-center justify-between gap-2 rounded-md border text-sm text-left",
                    "transition-colors duration-150",
                    "focus:outline-none focus:ring-2 focus:ring-orange-500",
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

            {/* Order date */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Ngày đặt hàng <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
                />
              </div>
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
              <label className="block text-sm font-medium text-gray-700">Tỷ giá</label>
              <div className="flex items-center h-9 px-3 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-700 select-none">
                {currencyCode === "VND"
                  ? <span className="text-gray-400">1 (mặc định VND)</span>
                  : <span>1 {currencyCode} = {exchangeRate.toLocaleString("vi-VN", { maximumFractionDigits: 6 })} VND</span>
                }
              </div>
            </div>
          </div>

          {/* Customer details card — shows when customer selected */}
          {selectedCustomer && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-orange-50/60 border border-orange-100 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Điện thoại</p>
                <p className="text-sm font-medium text-gray-800">{selectedCustomer.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Email</p>
                <p className="text-sm font-medium text-gray-800 truncate">{selectedCustomer.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Mã số thuế</p>
                <p className="text-sm font-medium text-gray-800">{selectedCustomer.tax_code || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Người liên hệ</p>
                <p className="text-sm font-medium text-gray-800">{selectedCustomer.contact_person || "—"}</p>
              </div>
              {selectedCustomer.address && (
                <div className="col-span-2 md:col-span-4">
                  <p className="text-xs text-gray-500 mb-0.5">Địa chỉ</p>
                  <p className="text-sm text-gray-700 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                    {selectedCustomer.address}
                  </p>
                </div>
              )}
              {mode === "create" && (
                <div className="col-span-2 md:col-span-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700"
                  >
                    <Edit3 className="w-3 h-3" /> Đổi khách hàng
                  </button>
                </div>
              )}
            </div>
          )}
        </FormSection>

        {/* ─── SECTION 2: Line Items ─── */}
        <FormSection
          title="Dòng đơn hàng"
          icon={<ShoppingCart className="w-4 h-4" />}
          description={`${lines.filter((l) => l.product_id).length} sản phẩm`}
          noPadding
          action={
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm dòng
            </button>
          }
        >
          {/* Table — 8 cols: # | Product | UoM | Qty | Unit Price | Tax | Amount | × */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup><col style={{width:"36px"}} /><col /><col style={{width:"108px"}} /><col style={{width:"112px"}} /><col style={{width:"180px"}} /><col style={{width:"72px"}} /><col style={{width:"140px"}} /><col style={{width:"40px"}} /></colgroup>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ĐVT</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">SL</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Đơn giá ({currencyCode})</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Thuế</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Thành tiền ({currencyCode})</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Inbox className="w-8 h-8" />
                        <p className="text-sm">Chưa có sản phẩm. Nhấn "Thêm dòng" để bắt đầu.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  lines.map((line, index) => {
                    const product = products.find((p) => p.id === line.product_id);
                    const calc    = calcLine(line);

                    return (
                      <tr key={index} className="group hover:bg-orange-50/30 transition-colors">
                        {/* # */}
                        <td className="px-3 py-3.5 text-xs text-gray-400 font-medium">{index + 1}</td>

                        {/* Product — name + SKU + UoM badge inline */}
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleOpenProductModal(index)}
                            className={[
                              "flex items-center gap-2.5 text-left w-full group/btn",
                              "rounded-md px-2 py-1.5 -ml-2 transition-colors",
                              product ? "hover:bg-orange-50" : "hover:bg-gray-50",
                            ].join(" ")}
                          >
                            <div className="w-9 h-9 rounded bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {product?.image_url ? (
                                <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-4 h-4 text-gray-300" />
                              )}
                            </div>
                            <div className="min-w-0">
                              {product ? (
                                <>
                                  <p className="text-sm font-medium text-gray-800 truncate group-hover/btn:text-orange-600 transition-colors">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-0.5">SKU: {product.sku}</p>
                                </>
                              ) : (
                                <span className="text-sm text-gray-400 italic flex items-center gap-1">
                                  <Search className="w-3.5 h-3.5" />
                                  Nhấn để chọn sản phẩm...
                                </span>
                              )}
                            </div>
                          </button>
                        </td>

                        {/* UoM */}
                        <td className="px-4 py-3.5">
                          {uoms.length > 0 ? (
                            <div className="space-y-1">
                              <select
                                value={line.uom_id ?? product?.uom_id ?? ""}
                                onChange={(e) => handleUomChange(index, e.target.value ? Number(e.target.value) : null)}
                                disabled={!product}
                                className="h-8 px-2 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700 w-full disabled:bg-gray-50 disabled:text-gray-400"
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
                        <td className="px-4 py-3.5">
                          <div className="flex justify-center">
                            <QuantityControl
                              value={line.quantity ?? 1}
                              onChange={(v) => updateLine(index, "quantity", v)}
                              min={1}
                            />
                          </div>
                        </td>

                        {/* Unit Price */}
                        <td className="px-4 py-3.5">
                          <div className="relative">
                            <NumberField
                              value={line.unit_price ?? 0}
                              onChange={(v) => updateLine(index, "unit_price", v ?? 0)}
                              className="h-8 pr-10"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none select-none">{currencyCode}</span>
                          </div>
                          {product?.sale_price && product.sale_price !== line.unit_price && (
                            <p className="text-[10px] text-gray-400 text-right mt-0.5">
                              Niêm yết: {Number(product.sale_price).toLocaleString("vi-VN")} ₫
                            </p>
                          )}
                        </td>

                        {/* Tax % */}
                        <td className="px-4 py-3.5 text-center">
                          {product?.taxRate ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                              {product.taxRate.rate}%
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3.5 text-right">
                          <p className="text-sm font-semibold text-gray-900">{formatDocMoney(calc.total)}</p>
                          {calc.taxAmount > 0 && (
                            <p className="text-[10px] text-gray-400 mt-0.5">Thuế: {formatDocMoney(calc.taxAmount)}</p>
                          )}
                        </td>

                        {/* Remove */}
                        <td className="px-3 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeLine(index)}
                            className="p-1.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
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
        </FormSection>
      </StandardFormLayout>

      {/* ─── Customer Search Modal ─── */}
      <SearchSelectionModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Chọn khách hàng"
        description="Tìm theo tên, điện thoại, email hoặc mã số thuế"
        items={customers}
        searchKeys={["name", "phone", "email", "tax_code"]}
        onSelect={(c) => setCustomerId(c.id)}
        isSelected={(c) => c.id === customerId}
        renderItem={(c, isActive) => (
          <div className="flex items-center gap-3">
            <div className={[
              "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
              isActive ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600",
            ].join(" ")}>
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
              <div className="flex items-center gap-3 mt-0.5">
                {c.phone && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />{c.phone}
                  </span>
                )}
                {c.tax_code && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />MST: {c.tax_code}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      />

      {/* ─── Product Picker Modal ─── */}
      <SearchSelectionModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setActiveLineIndex(null);
        }}
        title="Chọn sản phẩm"
        description="Tìm theo tên sản phẩm hoặc mã SKU"
        items={availableProducts}
        searchKeys={["name", "sku"]}
        onSelect={(p) => {
          if (activeLineIndex !== null) selectProductForDocumentCurrency(activeLineIndex, p);
        }}
        renderItem={(p) => <ProductPickerItem p={p} />}
      />
    </>
  );
}
