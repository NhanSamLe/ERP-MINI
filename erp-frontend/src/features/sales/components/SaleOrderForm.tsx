import { useState } from "react";
import {
  Plus, Trash2, Calendar, User, ShoppingCart,
  Search, Building2, Phone, Mail, MapPin, CreditCard,
  Package, Inbox, AlertCircle, Edit3,
} from "lucide-react";
import { CreateSaleOrderDto, UpdateSaleOrderDto } from "../dto/saleOrder.dto";
import { Product } from "@/features/products/store/product.types";
import { Partner } from "@/features/partner/store/partner.types";
import QuantityControl from "./QuantityControl";
import { useSaleOrderForm } from "../hook/useSaleOrderForm";
import { StandardFormLayout, FormSection } from "@/components/layout";
import { SearchSelectionModal } from "@/components/common/SearchSelectionModal";
import ProductPickerModal from "./ProductPickerModal";
import { formatVND } from "@/utils/currency.helper";

interface SaleOrderFormDto {
  id?: number;
  customer_id: number;
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
    lines, removeLine, addLine,
    selectProductForLine, updateLine,
    totals, calcLine,
    selectedProductIds, deletedLineIds,
  } = useSaleOrderForm(defaultValue as any, products);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const availableProducts = products.filter(
    (p) => !selectedProductIds.includes(p.id) || (activeLineIndex !== null && lines[activeLineIndex].product_id === p.id)
  );

  const handleOpenProductModal = (index: number) => {
    setActiveLineIndex(index);
    setIsProductModalOpen(true);
  };

  const handleSubmit = () => {
    if (!customerId || customerId === 0) {
      setValidationError("Please select a customer.");
      return;
    }
    if (lines.length === 0) {
      setValidationError("Please add at least one product line.");
      return;
    }
    if (lines.some((l) => !l.product_id)) {
      setValidationError("All line items must have a product selected.");
      return;
    }
    setValidationError(null);

    const payload: any = {
      customer_id: customerId,
      order_date: orderDate,
      lines: lines.map((l) => ({
        id: l.id,
        product_id: l.product_id ?? 0,
        quantity: l.quantity ?? 1,
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
        title={mode === "create" ? "New Sale Order" : `Edit Order #${defaultValue?.id}`}
        actions={[
          { label: "Discard", variant: "outline", onClick: onCancel || (() => window.history.back()) },
          {
            label: mode === "create" ? "Save Draft" : "Save Changes",
            variant: "primary",
            onClick: handleSubmit,
            isLoading: loading,
          },
        ]}
        sidebarContent={
          <div className="space-y-4">
            {/* Financial Summary */}
            <FormSection title="Order Summary" icon={<CreditCard className="w-4 h-4" />}>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Lines</span>
                  <span className="font-semibold text-gray-800">{lines.filter((l) => l.product_id).length} item(s)</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-800">{formatVND(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-semibold text-gray-800">{formatVND(totals.tax)}</span>
                </div>
                <div className="pt-3 mt-1 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">Total (incl. tax)</span>
                    <span className="text-base font-bold text-orange-600">{formatVND(totals.total)}</span>
                  </div>
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
              <FormSection title="Customer" icon={<User className="w-4 h-4" />}>
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
                      <span>Tax: {selectedCustomer.tax_code}</span>
                    </div>
                  )}
                </div>
              </FormSection>
            )}
          </div>
        }
      >
        {/* ─── SECTION 1: Order Info ─── */}
        <FormSection title="Order Information" icon={<Building2 className="w-4 h-4" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer selector */}
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
                      {selectedCustomer ? selectedCustomer.name : "Search and select customer..."}
                    </span>
                  </div>
                  <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </button>
              )}
            </div>

            {/* Order date */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Order Date <span className="text-red-500">*</span>
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
          </div>

          {/* Customer details card — shows when customer selected */}
          {selectedCustomer && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-orange-50/60 border border-orange-100 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                <p className="text-sm font-medium text-gray-800">{selectedCustomer.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Email</p>
                <p className="text-sm font-medium text-gray-800 truncate">{selectedCustomer.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Tax Code</p>
                <p className="text-sm font-medium text-gray-800">{selectedCustomer.tax_code || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Contact Person</p>
                <p className="text-sm font-medium text-gray-800">{selectedCustomer.contact_person || "—"}</p>
              </div>
              {selectedCustomer.address && (
                <div className="col-span-2 md:col-span-4">
                  <p className="text-xs text-gray-500 mb-0.5">Address</p>
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
                    <Edit3 className="w-3 h-3" /> Change customer
                  </button>
                </div>
              )}
            </div>
          )}
        </FormSection>

        {/* ─── SECTION 2: Line Items ─── */}
        <FormSection
          title="Order Lines"
          icon={<ShoppingCart className="w-4 h-4" />}
          description={`${lines.filter((l) => l.product_id).length} product(s) added`}
          noPadding
          action={
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Line
            </button>
          }
        >
          {/* Table — 7 cols: # | Product (name+SKU+UoM) | Qty | Unit Price | Tax | Amount | × */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col style={{ width: "36px" }} />    {/* # */}
                <col />                               {/* Product — flex */}
                <col style={{ width: "112px" }} />   {/* Qty */}
                <col style={{ width: "192px" }} />   {/* Unit Price */}
                <col style={{ width: "80px" }} />    {/* Tax % */}
                <col style={{ width: "148px" }} />   {/* Amount */}
                <col style={{ width: "40px" }} />    {/* Remove */}
              </colgroup>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Tax</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Inbox className="w-8 h-8" />
                        <p className="text-sm">No products added. Click "Add Line" to start.</p>
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
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-xs text-gray-400">SKU: {product.sku}</span>
                                    {product.uom?.code && (
                                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500">
                                        {product.uom.code}
                                      </span>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <span className="text-sm text-gray-400 italic flex items-center gap-1">
                                  <Search className="w-3.5 h-3.5" />
                                  Click to select product...
                                </span>
                              )}
                            </div>
                          </button>
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

                        {/* Unit Price — wide column with ₫ suffix */}
                        <td className="px-4 py-3.5">
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              step={1000}
                              value={line.unit_price ?? 0}
                              onChange={(e) => updateLine(index, "unit_price", parseFloat(e.target.value) || 0)}
                              className="w-full h-8 pl-3 pr-6 text-right text-sm font-medium border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none select-none">₫</span>
                          </div>
                          {product?.sale_price && product.sale_price !== line.unit_price && (
                            <p className="text-[10px] text-gray-400 text-right mt-0.5">
                              List: {formatVND(product.sale_price)}
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
                          <p className="text-sm font-semibold text-gray-900">{formatVND(calc.total)}</p>
                          {calc.taxAmount > 0 && (
                            <p className="text-[10px] text-gray-400 mt-0.5">Tax: {formatVND(calc.taxAmount)}</p>
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
        title="Select Customer"
        description="Search by name, phone, email or tax code"
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
      <ProductPickerModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setActiveLineIndex(null);
        }}
        products={availableProducts}
        selectedProductIds={selectedProductIds}
        onSelect={(p) => {
          if (activeLineIndex !== null) selectProductForLine(activeLineIndex, p);
        }}
      />
    </>
  );
}
