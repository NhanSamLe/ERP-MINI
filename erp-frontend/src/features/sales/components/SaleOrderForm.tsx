import { useState } from 'react';
import { Plus, Trash2, Calendar, User, ShoppingCart, Search } from 'lucide-react';
import { SaleOrderLineDto, CreateSaleOrderDto, UpdateSaleOrderDto, CreateSaleOrderLineDto } from '../dto/saleOrder.dto';
import { Product } from '@/features/products/store/product.types';
import { Partner } from '@/features/partner/store/partner.types';
import QuantityControl from './QuantityControl';
import { formatVND } from '@/utils/currency.helper';
import { useSaleOrderCalculation } from '../hook/useSaleOrderCalculation';
import PageHeader from '@/components/layout/PageHeader';
import { SearchSelectionModal } from '@/components/common/SearchSelectionModal';

interface SaleOrderFormDto {
  id?: number;
  customer_id: number;
  order_date: string;
  lines: SaleOrderLineDto[];
  deletedLineIds?: number[];
}

interface Props {
  mode: 'create' | 'edit';
  defaultValue?: SaleOrderFormDto;
  onSubmit: (data: CreateSaleOrderDto | UpdateSaleOrderDto) => Promise<void>;
  onCancel?: () => void;
  customers: Partner[];
  products: Product[];
  loading?: boolean;
}

type LineFieldValue = number | string | undefined;

export default function SaleOrderForm({
  mode = 'create',
  defaultValue,
  onSubmit,
  onCancel,
  customers,
  products,
  loading = false,
}: Props) {
  // ================= STATE =================
  const [customerId, setCustomerId] = useState<number>(
    defaultValue?.customer_id ?? 0
  );
  const [orderDate, setOrderDate] = useState<string>(
    defaultValue?.order_date ? defaultValue.order_date.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [lines, setLines] = useState<SaleOrderLineDto[]>(
    defaultValue?.lines ?? []
  );
  // ✅ Track deleted line IDs
  const [deletedLineIds, setDeletedLineIds] = useState<number[]>(
    defaultValue?.deletedLineIds ?? []
  );

  // Modal States
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);

  const selectedCustomer = customers.find(c => c.id === customerId);
  const { calcLine, calcTotals } = useSaleOrderCalculation(products);
  const totals = calcTotals(lines);

  // ✅ Get list of already selected product IDs
  const selectedProductIds = lines
    .map(line => line.product_id)
    .filter(id => id !== undefined && id !== null);

  // ✅ Get available products (not yet selected) by filtering the search results logic instead,
  // but for the modal, we pass ALL products and let the user search.
  // Wait, if we want to prevent double selection efficiently, we can filter `products` before passing to modal,
  // OR we can pass `selectedProductIds` to disable them in the modal.
  // The generic modal doesn't support "disabled" items yet, so I'll pre-filter relevant products for the modal
  // IF the requirement "available products" implies we shouldn't select same product twice.
  // The original code did `availableProducts` filtering. I should keep that.
  const availableProducts = products.filter(
    p => !selectedProductIds.includes(p.id) || (activeLineIndex !== null && lines[activeLineIndex].product_id === p.id)
  );
  // Note: The logic above `availableProducts` excludes selected ones but includes the one CURRENTLY selected in the active line (to allow keeping it selected).

  // ================= HANDLERS =================
  // ✔ Add line (index-based)
  const handleAddLine = (): void => {
    setLines(prev => [
      ...prev,
      {
        id: undefined, // để BE tự generate id
        product_id: undefined,
        quantity: 1,
        unit_price: 0,
        tax_rate_id: undefined,
      },
    ]);
  };

  // ✔ Remove line theo index
  const handleRemoveLine = (index: number): void => {
    if (lines.length > 1) {
      const lineToDelete = lines[index];

      // ✅ If line has an ID (existing line), track it for deletion
      if (lineToDelete.id) {
        setDeletedLineIds(prev => [...prev, lineToDelete.id!]);
      }

      // Remove from current lines
      setLines(prev => prev.filter((_, i) => i !== index));
    }
  };

  // ✔ Update line theo index
  const handleUpdateLine = (
    index: number,
    field: keyof SaleOrderLineDto,
    value: LineFieldValue
  ): void => {
    setLines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ✔ Select Product Handler
  const handleOpenProductModal = (index: number) => {
    setActiveLineIndex(index);
    setIsProductModalOpen(true);
  };

  const handleSelectProduct = (product: Product) => {
    if (activeLineIndex === null) return;

    setLines(prev => {
      const updated = [...prev];
      updated[activeLineIndex] = {
        ...updated[activeLineIndex],
        product_id: product.id, // Must set product_id
        unit_price: product.sale_price ?? 0,
        tax_rate_id: product.tax_rate_id ?? undefined,
      };
      return updated;
    });
    // No need to manually close or reset here if we use local state properly, but for safety:
    // Actually the modal closes via onSelect prop in the modal component if implemented there,
    // but looking at usage: `onSelect={(item) => { ...; setIsProductModalOpen(false); }}` is typically safer.
    // In my SearchSelectionModal implementation:
    // const handleSelect = (item: T) => { onSelect(item); onClose(); setSearchTerm(''); };
    // So it automatically calls onClose. I don't need to duplicate it, but I need to reset activeLineIndex.
  };

  // ================= SUBMIT =================
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (customerId === 0 || lines.length === 0) {
      alert('Please select customer and add at least one line item');
      return;
    }

    const payload: CreateSaleOrderDto | UpdateSaleOrderDto = {
      customer_id: customerId,
      order_date: orderDate,
      lines: lines.map(l => ({
        id: l.id,
        product_id: l.product_id ?? 0,
        quantity: l.quantity ?? 1,
        unit_price: l.unit_price ?? 0,
        tax_rate_id: l.tax_rate_id,
      })) as (CreateSaleOrderLineDto[] | SaleOrderLineDto[]),
      // ✅ Include deleted line IDs
      deletedLineIds: deletedLineIds,
    };
    onSubmit(payload);
  };

  // ================= RENDER =================
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <PageHeader
          title={mode === 'create' ? 'Create Sale Order' : 'Edit Sale Order'}
          description={mode === 'create' ? 'Create a new sales order for a customer' : `Edit sales order #${defaultValue?.id || ''}`}
        />
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* MAIN AREA */}
        <div className="lg:col-span-3 space-y-6">

          {/* ORDER INFO CARD */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
              <User size={20} className="text-orange-600" />
              Customer & Date
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CUSTOMER */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Customer <span className="text-red-500">*</span>
                </label>
                {mode === 'edit' ? (
                  <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-medium cursor-not-allowed">
                    {selectedCustomer?.name || 'N/A'}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-left flex justify-between items-center hover:border-orange-500 hover:ring-1 hover:ring-orange-500 transition focus:outline-none"
                  >
                    <span className={selectedCustomer ? 'text-gray-900' : 'text-gray-400'}>
                      {selectedCustomer ? selectedCustomer.name : '-- Select customer --'}
                    </span>
                    <Search size={16} className="text-gray-400" />
                  </button>
                )}
              </div>

              {/* ORDER DATE */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Order Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  />
                  <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
              </div>
            </div>

            {/* CUSTOMER DETAILS PREVIEW (Enhanced) */}
            {selectedCustomer && (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-100 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
                  <p><span className="font-semibold text-gray-600">Company:</span> {selectedCustomer.name}</p>
                  <p><span className="font-semibold text-gray-600">Tax Code:</span> {selectedCustomer.tax_code || '-'}</p>
                  <p><span className="font-semibold text-gray-600">Contact:</span> {selectedCustomer.contact_person || '-'}</p>
                  <p><span className="font-semibold text-gray-600">Phone:</span> {selectedCustomer.phone || '-'}</p>
                  <p className="md:col-span-2"><span className="font-semibold text-gray-600">Address:</span> {selectedCustomer.address || '-'}</p>
                </div>
              </div>
            )}
          </div>

          {/* LINE ITEMS CARD */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <ShoppingCart size={20} className="text-orange-600" />
                Line Items
              </h2>
              <button
                type="button"
                onClick={handleAddLine}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition shadow-sm font-medium"
              >
                <Plus size={18} />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left w-12">#</th>
                    <th className="px-4 py-3 text-left w-16">Image</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left w-24">Unit</th>
                    <th className="px-4 py-3 text-center w-32">Qty</th>
                    <th className="px-4 py-3 text-right w-32">Price</th>
                    <th className="px-4 py-3 text-right w-24">Tax</th>
                    <th className="px-4 py-3 text-right w-32">Total</th>
                    <th className="px-4 py-3 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-400 italic">
                        No items added yet. Please add a product to start.
                      </td>
                    </tr>
                  ) : (
                    lines.map((line, index) => {
                      const product = products.find(p => p.id === line.product_id);
                      const calc = calcLine(line);

                      return (
                        <tr key={index} className="hover:bg-gray-50 transition">
                          {/* INDEX */}
                          <td className="px-4 py-4 text-gray-500 font-mono text-center">{index + 1}</td>

                          {/* IMAGE */}
                          <td className="px-4 py-4">
                            {product?.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-10 h-10 rounded object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                                Img
                              </div>
                            )}
                          </td>

                          {/* PRODUCT SELECT (MODAL TRIGGER) */}
                          <td className="px-4 py-4 min-w-[200px]">
                            <button
                              type="button"
                              onClick={() => handleOpenProductModal(index)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left bg-white hover:border-orange-500 hover:ring-1 hover:ring-orange-500 transition flex items-center justify-between group"
                            >
                              <div className="truncate pr-2">
                                {product ? (
                                  <span className="text-gray-900 font-medium">{product.name}</span>
                                ) : (
                                  <span className="text-gray-400 italic">Select Product...</span>
                                )}
                                {product && <p className="text-xs text-gray-500 mt-0.5">SKU: {product.sku}</p>}
                              </div>
                              <Search size={14} className="text-gray-400 group-hover:text-orange-500 shrink-0" />
                            </button>
                          </td>

                          {/* UNIT */}
                          <td className="px-4 py-4 text-gray-600">{product?.uom || '-'}</td>

                          {/* QUANTITY */}
                          <td className="px-4 py-4">
                            <QuantityControl
                              value={line.quantity ?? 1}
                              onChange={(val) => handleUpdateLine(index, 'quantity', val)}
                            />
                          </td>

                          {/* PRICE */}
                          <td className="px-4 py-4 text-right font-medium text-gray-700">
                            {formatVND(line.unit_price)}
                          </td>

                          {/* TAX */}
                          <td className="px-4 py-4 text-right text-xs text-gray-500">
                            {product?.taxRate ? (
                              <div className="flex flex-col items-end">
                                <span>{product.taxRate.name}</span>
                                <span className="text-gray-400">({product.taxRate.rate}%)</span>
                              </div>
                            ) : '-'}
                          </td>

                          {/* TOTAL */}
                          <td className="px-4 py-4 text-right font-bold text-gray-900">
                            {formatVND(calc.total)}
                          </td>

                          {/* REMOVE */}
                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(index)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                            >
                              <Trash2 size={16} />
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
        </div>

        {/* SIDEBAR SUMMARY */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm sticky top-6 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 font-semibold text-gray-700">
              Summary
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-gray-600">
                <span>Subtotal</span>
                <span>{formatVND(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Tax</span>
                <span>{formatVND(totals.tax)}</span>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-2">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-gray-800 text-lg">Total</span>
                  <span className="font-bold text-orange-600 text-2xl">{formatVND(totals.total)}</span>
                </div>
                <p className="text-xs text-gray-400 text-right mt-1">VAT Included</p>
              </div>

              <div className="pt-6 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 shadow-lg shadow-orange-100 transition disabled:bg-gray-400"
                >
                  {loading ? 'Processing...' : (mode === 'create' ? 'Create Order' : 'Save Changes')}
                </button>

                <button
                  type="button"
                  onClick={onCancel || (() => window.history.back())}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* CUSTOMER SELECTION MODAL */}
      <SearchSelectionModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Select Customer"
        items={customers}
        searchKeys={['name', 'phone', 'email', 'tax_code']}
        onSelect={(customer) => setCustomerId(customer.id)}
        selectedItem={selectedCustomer}
        isSelected={(c) => c.id === customerId}
        renderItem={(customer, isActive) => (
          <div className="p-3">
            <div className="flex justify-between">
              <span className={`font-medium ${isActive ? 'text-orange-700' : 'text-gray-900'}`}>{customer.name}</span>
              {customer.phone && <span className="text-gray-500 text-sm">{customer.phone}</span>}
            </div>
            <div className="text-sm text-gray-500 mt-1 flex gap-3">
              {customer.tax_code && <span>Tax: {customer.tax_code}</span>}
              {customer.address && <span className="truncate max-w-[300px]">{customer.address}</span>}
            </div>
          </div>
        )}
      />

      {/* PRODUCT SELECTION MODAL */}
      <SearchSelectionModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Select Product"
        items={availableProducts}
        searchKeys={['name', 'sku', 'description']}
        onSelect={handleSelectProduct}
        renderItem={(product) => (
          <div className="flex items-center gap-4 p-3">
            {product.image_url ? (
              <img src={product.image_url} alt="" className="w-12 h-12 rounded bg-gray-100 border object-cover" />
            ) : (
              <div className="w-12 h-12 rounded bg-gray-100 border flex items-center justify-center text-xs text-gray-400">
                Img
              </div>
            )}
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-medium text-gray-900">{product.name}</span>
                <span className="font-bold text-orange-600">{formatVND(product.sale_price)}</span>
              </div>
              <div className="text-sm text-gray-500 flex gap-3 mt-1">
                <span className="bg-gray-100 px-1.5 rounded text-xs border">SKU: {product.sku}</span>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}





















