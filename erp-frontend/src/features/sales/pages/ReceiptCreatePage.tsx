import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createReceipt, fetchCustomersWithDebt, fetchUnpaidInvoices } from "../store/receipt.slice";
import { CreateReceiptDto } from "../dto/receipt.dto";
import PageHeader from "@/components/layout/PageHeader";
import { formatVND } from "@/utils/currency.helper";
import { AlertCircle, Calendar, CheckSquare, Search, Wallet } from "lucide-react";
import { SearchSelectionModal } from "@/components/common/SearchSelectionModal";
import { Partner } from "@/features/partner/store/partner.types";

export default function ReceiptCreatePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  // We need customers list for modal - assuming we can get it from partner slice or use customersWithDebt as base
  // But customersWithDebt only has {id, name, total}. We might want full partner info?
  // consistently customersWithDebt is what we have for now in this slice.
  const { customersWithDebt, unpaidInvoices, loading } = useAppSelector((s) => s.receipt);

  // Local state
  const [form, setForm] = useState<{
    customer_id: number;
    receipt_date: string;
    amount: string;
    method: "cash" | "bank" | "transfer";
  }>({
    customer_id: 0,
    receipt_date: new Date().toISOString().split("T")[0],
    amount: "",
    method: "cash",
  });

  const [error, setError] = useState<string | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Selected invoices for "Allocation" simulation (Auto-calculation)
  // Store as Set of IDs for O(1) lookup
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<number>>(new Set());

  // Fetch customers on mount
  useEffect(() => {
    dispatch(fetchCustomersWithDebt());
  }, [dispatch]);

  // Fetch unpaid invoices when customer changes
  useEffect(() => {
    if (form.customer_id) {
      dispatch(fetchUnpaidInvoices(form.customer_id));
      setSelectedInvoiceIds(new Set()); // Reset selections
    }
  }, [dispatch, form.customer_id]);

  const selectedCustomer = useMemo(() =>
    customersWithDebt.find((c) => c.id === form.customer_id),
    [customersWithDebt, form.customer_id]);

  // Handle Invoice Selection
  const toggleInvoice = (invoiceId: number, unpaidAmount: number) => {
    const newSet = new Set(selectedInvoiceIds);
    let currentAmount = Number(form.amount.replace(/\D/g, "") || 0);

    if (newSet.has(invoiceId)) {
      newSet.delete(invoiceId);
      // Optional: Subtract amount? 
      // Better UX: If checking boxes, Amount = Sum of checked.
      // If typing Amount, checkboxes might deselect? 
      // Let's stick to: "Checking invoice adds to Amount".
      currentAmount -= unpaidAmount;
    } else {
      newSet.add(invoiceId);
      currentAmount += unpaidAmount;
    }

    // Ensure amount doesn't go negative (floating point safety)
    if (currentAmount < 0) currentAmount = 0;

    setSelectedInvoiceIds(newSet);
    setForm(prev => ({ ...prev, amount: currentAmount.toString() }));
  };

  const handleAmountChange = (value: string) => {
    const clean = value.replace(/\D/g, "");
    setForm({ ...form, amount: clean });
    // If user manually types, we could optionally clear selections or keep them?
    // Let's keep selections but maybe show a warning if they don't match? 
    // For simplicity, just update amount.
  };

  const handleSubmit = async () => {
    if (!form.customer_id) return setError("Customer is required");
    if (!form.receipt_date) return setError("Receipt date is required");

    const amountNum = Number(form.amount);
    if (amountNum <= 0) return setError("Amount must be > 0");

    try {
      const payload: CreateReceiptDto = {
        customer_id: form.customer_id,
        receipt_date: form.receipt_date,
        amount: amountNum,
        method: form.method,
      };

      const result = await dispatch(createReceipt(payload)).unwrap();
      navigate(`/receipts/${result.id}`);
    } catch (e) {
      const err = e as Error;
      setError(err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <PageHeader
          title="Create New Receipt"
          description="Record a new payment from customer"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: FORM */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
              <Wallet size={20} className="text-orange-600" />
              Receipt Details
            </h2>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* CUSTOMER */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Customer <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-left flex justify-between items-center hover:border-orange-500 hover:ring-1 hover:ring-orange-500 transition focus:outline-none"
              >
                <span className={selectedCustomer ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                  {selectedCustomer ? selectedCustomer.name : '-- Select Customer --'}
                </span>
                <Search size={16} className="text-gray-400" />
              </button>
            </div>

            {/* DATE & METHOD */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={form.receipt_date}
                    onChange={(e) => setForm({ ...form, receipt_date: e.target.value })}
                    className="w-full pl-3 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Method</label>
                <select
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="transfer">Internal</option>
                </select>
              </div>
            </div>

            {/* AMOUNT */}
            <div className="space-y-2 pt-2">
              <label className="block text-sm font-medium text-gray-700">
                Receipt Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.amount ? Number(form.amount).toLocaleString('vi-VN') : ""}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0"
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-bold text-lg text-gray-900 outline-none"
                />
                <span className="absolute right-4 top-3.5 text-gray-500 font-medium text-sm">VND</span>
              </div>
              <p className="text-xs text-gray-500">
                Select invoices on the right to auto-calculate.
              </p>
            </div>

            {/* ACTIONS */}
            <div className="pt-4 space-y-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-2.5 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition shadow-sm disabled:bg-gray-400"
              >
                {loading ? 'Creating...' : 'Create Receipt'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/receipts')}
                className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INVOICE ALLOCATION HELP */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <CheckSquare size={18} className="text-orange-600" />
                Select Invoices to Pay
              </h3>
              {selectedCustomer && (
                <span className="text-sm font-medium text-gray-600">
                  Debt: <span className="text-red-600">{formatVND(selectedCustomer.total)}</span>
                </span>
              )}
            </div>

            <div className="flex-1 overflow-auto max-h-[600px] p-0">
              {!form.customer_id ? (
                <div className="h-40 flex items-center justify-center text-gray-400 italic">
                  Select a customer to view open invoices.
                </div>
              ) : unpaidInvoices.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-gray-500">
                  No unpaid invoices found for this customer.
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        {/* Select All could go here */}
                      </th>
                      <th className="px-4 py-3">Invoice #</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-right">Unpaid Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {unpaidInvoices.map(inv => {
                      const isSelected = selectedInvoiceIds.has(inv.invoice_id);
                      return (
                        <tr
                          key={inv.invoice_id}
                          className={`hover:bg-orange-50 transition cursor-pointer ${isSelected ? 'bg-orange-50' : ''}`}
                          onClick={() => toggleInvoice(inv.invoice_id, inv.unpaid)}
                        >
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer pointer-events-none"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-700">
                            {inv.invoice_no}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">
                            {formatVND(inv.total_after_tax)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-red-600">
                            {formatVND(inv.unpaid)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            {unpaidInvoices.length > 0 && form.customer_id && (
              <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 text-center">
                * Selecting invoices here helps calculate the amount. Validation and formal allocation occurs after approval.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CUSTOMER SEARCH MODAL */}
      <SearchSelectionModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Select Customer"
        items={customersWithDebt}
        searchKeys={['name']}
        onSelect={(c) => {
          setForm(prev => ({ ...prev, customer_id: c.id, amount: "" }));
          // Note: fetchUnpaidInvoices is handled by useEffect when form.customer_id changes
        }}
        renderItem={(c) => (
          <div className="p-3 flex justify-between items-center">
            <span className="font-medium text-gray-900">{c.name}</span>
            <span className="text-red-600 font-mono text-sm">{formatVND(c.total)}</span>
          </div>
        )}
      />
    </div>
  );
}
