import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { SaleOrderLineDto, CreateSaleOrderDto, UpdateSaleOrderDto , CreateSaleOrderLineDto} from '../dto/saleOrder.dto';
import { Product } from '@/features/products/store/product.types';
import { Partner } from '@/features/partner/store/partner.types';
import QuantityControl from './QuantityControl';
import { formatVND } from '@/utils/currency.helper';
import { useSaleOrderCalculation } from '../hook/useSaleOrderCalculation';

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
  customers: Partner[];
  products: Product[];
  loading?: boolean;
}

type LineFieldValue = number | string | undefined;

export default function SaleOrderForm({
  mode = 'create',
  defaultValue,
  onSubmit,
  customers,
  products,
  loading = false,
}: Props) {

  // ================= STATE =================
  const [customerId, setCustomerId] = useState<number>(
    defaultValue?.customer_id ?? 0
  );

  const [orderDate, setOrderDate] = useState<string>(
    defaultValue?.order_date
      ? defaultValue.order_date.split('T')[0]
      : new Date().toISOString().split('T')[0]
  );

  const [lines, setLines] = useState<SaleOrderLineDto[]>(
    defaultValue?.lines ?? []
  );

  const selectedCustomer = customers.find(c => c.id === customerId);
  const { calcLine, calcTotals } = useSaleOrderCalculation(products);
  const totals = calcTotals(lines);

  // ================= HANDLERS =================

  // ✔ Add line (index-based)
  const handleAddLine = (): void => {
    setLines(prev => [
      ...prev,
      {
        id: undefined,     // để BE tự generate id
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

  // ✔ Chọn product theo index
  const handleSelectProduct = (index: number, productId: number): void => {
    const product = products.find(p => p.id === productId);

    setLines(prev => {
      const updated = [...prev];
      if (product) {
        updated[index] = {
          ...updated[index],
          product_id: productId,
          unit_price: product.sale_price ?? 0,
          tax_rate_id: product.tax_rate_id ?? undefined,
        };
      }
      return updated;
    });
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
      deletedLineIds: defaultValue?.deletedLineIds ?? [],
    };

    onSubmit(payload);
  };

  // ================= RENDER =================
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>Dashboard</span>
            <span>›</span>
            <span className="text-gray-900 font-medium">
              {mode === 'create' ? 'Create Sale Order' : 'Edit Sale Order'}
            </span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">
            {mode === 'create' ? 'Create Sale Order' : 'Edit Sale Order'}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* MAIN AREA */}
            <div className="lg:col-span-2 space-y-6">

              {/* ORDER INFO */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-5">Order Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* CUSTOMER */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>

                    {mode === 'edit' ? (
                      <div className="px-4 py-2.5 border bg-gray-50 rounded-lg font-medium">
                        {selectedCustomer?.name || 'N/A'}
                      </div>
                    ) : (
                      <select
                        value={customerId}
                        onChange={(e) => setCustomerId(Number(e.target.value))}
                        className="w-full px-4 py-2.5 border rounded-lg bg-white"
                      >
                        <option value={0}>Select customer...</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* ORDER DATE */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Date *</label>
                    <input
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-lg"
                    />
                  </div>

                </div>
              </div>

              {/* CUSTOMER DETAILS */}
              {selectedCustomer && (
                <div className="bg-white rounded-lg border border-orange-200 p-6">
                  <h2 className="text-base font-semibold mb-5">Customer Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <Info label="Company Name" value={selectedCustomer.name} />
                    <Info label="Tax Code" value={selectedCustomer.tax_code} />
                    <Info label="Contact Person" value={selectedCustomer.contact_person} />
                    <Info label="Phone" value={selectedCustomer.phone} />
                    <Info label="Email" value={selectedCustomer.email} />
                    <Info
                      label="Bank"
                      value={
                        selectedCustomer.bank_name && selectedCustomer.bank_account
                          ? `${selectedCustomer.bank_name} - ${selectedCustomer.bank_account}`
                          : '-'
                      }
                    />
                    <div className="md:col-span-2">
                      <Info label="Address" value={selectedCustomer.address} />
                    </div>

                  </div>
                </div>
              )}

              {/* ========== PRODUCTS TABLE ========== */}
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center">
                    <h2 className="text-base font-semibold">Line Items</h2>

                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg"
                    >
                      <Plus size={18} /> Add Line
                    </button>
                  </div>
                </div>

                {lines.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">

                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <Th>Image</Th>
                          <Th>Product</Th>
                          <Th>SKU</Th>
                          <Th>UOM</Th>
                          <Th>Qty</Th>
                          <Th className="text-right">Unit Price</Th>
                          <Th>Tax Rate</Th>
                          <Th className="text-right">Total</Th>
                          <Th className="text-center">Action</Th>
                        </tr>
                      </thead>

                      <tbody>
                        {lines.map((line, index) => {
                          const product = products.find(p => p.id === line.product_id);
                          const calc = calcLine(line);

                          return (
                            <tr key={index} className="border-b hover:bg-gray-50">

                              {/* IMAGE */}
                              <td className="px-4 py-4">
                                {product?.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-10 h-10 rounded object-cover border"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded bg-gray-200" />
                                )}
                              </td>

                              {/* PRODUCT SELECT */}
                              <td className="px-4 py-4">
                                <select
                                  value={line.product_id ?? ''}
                                  onChange={(e) => handleSelectProduct(index, Number(e.target.value))}
                                  className="w-full px-3 py-2 border rounded-lg bg-white"
                                >
                                  <option value="">Select...</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </select>
                              </td>

                              {/* SKU */}
                              <td className="px-4 py-4">{product?.sku || '-'}</td>

                              {/* UOM */}
                              <td className="px-4 py-4">{product?.uom || '-'}</td>

                              {/* QUANTITY */}
                              <td className="px-4 py-4">
                                <QuantityControl
                                  value={line.quantity ?? 1}
                                  onChange={(val) => handleUpdateLine(index, 'quantity', val)}
                                />
                              </td>

                              {/* UNIT PRICE */}
                              <td className="px-4 py-4 text-right">{formatVND(line.unit_price)}</td>

                              {/* TAX RATE */}
                              <td className="px-4 py-4">
                                {product?.taxRate ? (
                                  <div className="text-sm font-medium">
                                    {product.taxRate.name} ({product.taxRate.rate}%)
                                  </div>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </td>

                              {/* TOTAL */}
                              <td className="px-4 py-4 text-right font-semibold">
                                {formatVND(calc.total)}
                              </td>

                              {/* DELETE */}
                              <td className="px-4 py-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLine(index)}
                                  className="w-8 h-8 rounded hover:bg-red-100 text-red-600"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>

                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No line items. Click "Add Line" to start.
                  </div>
                )}

              </div>
            </div>


            {/* ================= SIDEBAR ================= */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border p-6 sticky top-6">

                <h2 className="text-base font-semibold mb-6">Order Summary</h2>

                <div className="space-y-3">
                  <SummaryRow label="Subtotal" value={totals.subtotal} />
                  <SummaryRow label="Tax" value={totals.tax} />

                  <div className="flex justify-between items-center pt-2 bg-orange-50 -mx-6 px-6 py-3">
                    <span className="font-bold">Total:</span>
                    <span className="text-2xl font-bold text-orange-600">{formatVND(totals.total)}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-orange-600 text-white rounded-lg"
                  >
                    {loading ? 'Processing...' : mode === 'create' ? 'Create Order' : 'Save Changes'}
                  </button>

                  <button
                    type="button"
                    className="w-full px-4 py-2.5 border rounded-lg"
                  >
                    Cancel
                  </button>
                </div>

              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}

/* Small helper components */

interface InfoProps {
  label: string;
  value?: string | number | null | undefined;
}

const Info: React.FC<InfoProps> = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-600 uppercase mb-1">{label}</p>
    <p className="text-base text-gray-900">{value ?? "-"}</p>
  </div>
);

interface ThProps {
  children: React.ReactNode;
  className?: string;
}

const Th: React.FC<ThProps> = ({ children, className = "" }) => (
  <th className={`px-4 py-3 text-left font-semibold text-gray-700 ${className}`}>
    {children}
  </th>
);

interface SummaryRowProps {
  label: string;
  value: number;
}

const SummaryRow: React.FC<SummaryRowProps> = ({ label, value }) => (
  <div className="flex justify-between items-center pb-3 border-b">
    <span className="text-gray-600">{label}:</span>
    <span className="font-semibold">{formatVND(value)}</span>
  </div>
);

