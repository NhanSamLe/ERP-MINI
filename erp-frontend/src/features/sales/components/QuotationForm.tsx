import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Trash2, Calendar, User, Search, Package,
  Link2, FileText, MessageSquare, Inbox, Phone, Mail,
  MapPin, CreditCard, Edit3, AlertCircle,
} from "lucide-react";
import { Partner } from "@/features/partner/store/partner.types";
import { Product } from "@/features/products/store/product.types";
import { QuotationDto, CreateQuotationDto, UpdateQuotationDto, QuotationLineDto } from "../dto/quotation.dto";
import { StandardFormLayout, FormSection } from "@/components/layout";
import { SearchSelectionModal } from "@/components/common/SearchSelectionModal";
import { ActionConfirmModal } from "@/components/common";
import QuantityControl from "./QuantityControl";
import { formatVND } from "@/utils/currency.helper";
import { useSaleOrderCalculation } from "../hook/useSaleOrderCalculation";

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
    defaultValue?.quotation_date?.split("T")[0] ?? new Date().toISOString().split("T")[0]
  );
  const [validUntil, setValidUntil]       = useState(
    defaultValue?.valid_until?.split("T")[0] ?? ""
  );
  const [discountPercent, setDiscountPercent] = useState<number>(defaultValue?.discount_percent ?? 0);
  const [customerNotes, setCustomerNotes] = useState(defaultValue?.customer_notes ?? "");
  const [internalNotes, setInternalNotes] = useState(defaultValue?.internal_notes ?? "");
  const [lines, setLines]                 = useState<QuotationLineDto[]>(defaultValue?.lines ?? []);
  const [deletedLineIds, setDeletedLineIds] = useState<number[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen]     = useState(false);

  // ── modals ─────────────────────────────────────────
  const [customerModal, setCustomerModal]   = useState(false);
  const [productModal, setProductModal]     = useState(false);
  const [activeLineIdx, setActiveLineIdx]   = useState<number | null>(null);

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
    updateLine(i, "product_id", p.id);
    updateLine(i, "unit_price",  p.sale_price ?? 0);
    updateLine(i, "tax_rate_id", p.tax_rate_id ?? null);
  };

  // ── totals ─────────────────────────────────────────
  const lineSubtotal = lines.reduce((acc, l) => acc + calcLine(l).lineTotal, 0);
  const lineTax      = lines.reduce((acc, l) => acc + calcLine(l).taxAmount, 0);
  const discountAmt  = lineSubtotal * (discountPercent / 100);
  const grandTotal   = lineSubtotal + lineTax - discountAmt;

  // ── submit ─────────────────────────────────────────
  const handleSubmit = async () => {
    if (!customerId) { setValidationError("Please select a customer."); return; }
    if (!validUntil) { setValidationError("Please set a valid-until date."); return; }
    if (lines.length === 0) { setValidationError("Please add at least one product line."); return; }
    if (lines.some((l) => !l.product_id)) { setValidationError("All lines must have a product selected."); return; }
    setValidationError(null);

    const payload: CreateQuotationDto | UpdateQuotationDto = {
      customer_id:      customerId,
      quotation_date:   quotationDate,
      valid_until:      validUntil,
      discount_percent: discountPercent || undefined,
      customer_notes:   customerNotes   || undefined,
      internal_notes:   internalNotes   || undefined,
      lines: lines.map((l) => ({
        id:               l.id,
        product_id:       l.product_id!,
        quantity:         l.quantity,
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
        title={mode === "create" ? "New Quotation" : `Edit ${defaultValue?.quotation_no ?? "Quotation"}`}
        description={
          mode === "create"
            ? "Create a quotation to send to the customer"
            : "Modify quotation details below"
        }
        breadcrumb={[
          { label: "Quotations", onClick: () => navigate("/sales/quotations") },
          { label: mode === "create" ? "New Quotation" : defaultValue?.quotation_no ?? "Edit" },
        ]}
        actions={[
          { label: "Discard", variant: "outline", onClick: () => setDiscardOpen(true) },
          { label: mode === "create" ? "Save Draft" : "Save Changes", variant: "primary", onClick: handleSubmit, isLoading: loading },
        ]}
        sidebarContent={
          <div className="space-y-4">
            {/* Order summary */}
            <FormSection title="Quote Summary" icon={<CreditCard className="w-4 h-4" />}>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Lines</span>
                  <span className="font-semibold text-gray-800">{lines.filter((l) => l.product_id).length} item(s)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-800">{formatVND(lineSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">VAT / Tax</span>
                  <span className="font-semibold text-gray-800">{formatVND(lineTax)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount ({discountPercent}%)</span>
                    <span className="font-semibold text-emerald-600">-{formatVND(discountAmt)}</span>
                  </div>
                )}
                <div className="pt-2.5 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">Total</span>
                    <span className="text-base font-bold text-orange-600">{formatVND(grandTotal)}</span>
                  </div>
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
              <FormSection title="Customer" icon={<User className="w-4 h-4" />}>
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
        <FormSection title="Quotation Information" icon={<FileText className="w-4 h-4" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Customer <span className="text-red-500">*</span>
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
                      {selectedCustomer ? selectedCustomer.name : "Search and select customer..."}
                    </span>
                  </div>
                  <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </button>
              )}
            </div>

            {/* Quotation Date */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Quotation Date <span className="text-red-500">*</span>
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

            {/* Valid Until */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Valid Until <span className="text-red-500">*</span>
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

            {/* Global Discount */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Global Discount (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0} max={100} step={0.5}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </div>
            </div>
          </div>

          {/* Customer info card */}
          {selectedCustomer && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-orange-50/60 border border-orange-100 rounded-lg">
              <div><p className="text-xs text-gray-500 mb-0.5">Phone</p><p className="text-sm font-medium text-gray-800">{selectedCustomer.phone || "—"}</p></div>
              <div><p className="text-xs text-gray-500 mb-0.5">Email</p><p className="text-sm font-medium text-gray-800 truncate">{selectedCustomer.email || "—"}</p></div>
              <div><p className="text-xs text-gray-500 mb-0.5">Tax Code</p><p className="text-sm font-medium text-gray-800">{selectedCustomer.tax_code || "—"}</p></div>
              <div><p className="text-xs text-gray-500 mb-0.5">Contact Person</p><p className="text-sm font-medium text-gray-800">{selectedCustomer.contact_person || "—"}</p></div>
              {selectedCustomer.address && (
                <div className="col-span-2 md:col-span-4">
                  <p className="text-xs text-gray-500 mb-0.5">Address</p>
                  <p className="text-sm text-gray-700 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />{selectedCustomer.address}
                  </p>
                </div>
              )}
              {mode === "create" && (
                <div className="col-span-2 md:col-span-4 flex justify-end">
                  <button type="button" onClick={() => setCustomerModal(true)} className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700">
                    <Edit3 className="w-3 h-3" /> Change customer
                  </button>
                </div>
              )}
            </div>
          )}
        </FormSection>

        {/* ── SECTION 2: Line Items ── */}
        <FormSection
          title="Quotation Lines"
          icon={<Package className="w-4 h-4" />}
          description={`${lines.filter((l) => l.product_id).length} product(s)`}
          noPadding
          action={
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Line
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  {["#", "Product", "UoM", "Qty", "Unit Price (₫)", "Disc. %", "Tax (%)", "Amount (₫)", ""].map((h) => (
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
                        <p className="text-sm">No products added. Click "Add Line" to start.</p>
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
                            <div className="min-w-0">
                              {product ? (
                                <>
                                  <p className="text-sm font-medium text-gray-800 truncate group-hover/btn:text-orange-600 transition-colors">{product.name}</p>
                                  <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                                </>
                              ) : (
                                <span className="text-sm text-gray-400 italic flex items-center gap-1">
                                  <Search className="w-3.5 h-3.5" /> Click to select...
                                </span>
                              )}
                            </div>
                          </button>
                        </td>

                        {/* UoM */}
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            {product?.uom?.code || "—"}
                          </span>
                        </td>

                        {/* Qty */}
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <QuantityControl value={line.quantity} onChange={(v) => updateLine(i, "quantity", v)} min={1} />
                          </div>
                        </td>

                        {/* Unit Price */}
                        <td className="px-4 py-3">
                          <input
                            type="number" min={0} step={1000}
                            value={line.unit_price}
                            onChange={(e) => updateLine(i, "unit_price", parseFloat(e.target.value) || 0)}
                            className="w-32 h-8 px-2 text-right text-sm font-medium border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          {product?.sale_price && product.sale_price !== line.unit_price && (
                            <p className="text-[10px] text-gray-400 text-right mt-0.5">List: {formatVND(product.sale_price)}</p>
                          )}
                        </td>

                        {/* Discount % */}
                        <td className="px-4 py-3">
                          <div className="relative w-20">
                            <input
                              type="number" min={0} max={100} step={0.5}
                              value={line.discount_percent ?? 0}
                              onChange={(e) => updateLine(i, "discount_percent", parseFloat(e.target.value) || 0)}
                              className="w-full h-8 pl-2 pr-5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
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
                          <p className="text-sm font-semibold text-gray-800">{formatVND(lineTotal)}</p>
                          {lineDisc > 0 && (
                            <p className="text-xs text-emerald-600">-{lineDisc}% disc.</p>
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
        <FormSection title="Notes" icon={<MessageSquare className="w-4 h-4" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Customer Notes</label>
              <p className="text-xs text-gray-400">Visible on the quotation document sent to customer</p>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Payment terms: 30 days net..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Internal Notes</label>
              <p className="text-xs text-gray-400">Internal only — not printed on documents</p>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Customer requested express delivery..."
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
        title="Discard Changes"
        description="Are you sure you want to discard all unsaved changes?"
        confirmText="Discard"
        variant="danger"
        onConfirm={() => onCancel ? onCancel() : navigate("/sales/quotations")}
      />

      {/* ── Customer modal ── */}
      <SearchSelectionModal
        isOpen={customerModal}
        onClose={() => setCustomerModal(false)}
        title="Select Customer"
        description="Search by name, phone, email or tax code"
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
        title="Select Product"
        description="Search by product name or SKU"
        items={availableProducts}
        searchKeys={["name", "sku"]}
        onSelect={(p) => { if (activeLineIdx !== null) selectProduct(activeLineIdx, p); }}
        renderItem={(p) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
              {p.image_url
                ? <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                : <Package className="w-5 h-5 text-gray-300" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">SKU: {p.sku}</span>
                    {p.uom?.code && <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500">{p.uom.code}</span>}
                    {p.taxRate && <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600">Tax {p.taxRate.rate}%</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-orange-600">{formatVND(p.sale_price ?? 0)}</p>
                  {p.min_stock_qty != null && <p className="text-[10px] text-gray-400">Stock: {p.min_stock_qty}</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      />
    </>
  );
}
