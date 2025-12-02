import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createReceipt, fetchCustomersWithDebt } from "../store/receipt.slice";
import { CreateReceiptDto } from "../dto/receipt.dto";

export default function ReceiptCreatePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { customersWithDebt } = useAppSelector((s) => s.receipt);

  useEffect(() => {
    dispatch(fetchCustomersWithDebt());
  }, [dispatch]);

  const [form, setForm] = useState<{
    customer_id: number;
    receipt_date: string;
    amount: string; // string để nhập đẹp
    method: "cash" | "bank" | "transfer";
  }>({
    customer_id: 0,
    receipt_date: "",
    amount: "",
    method: "cash",
  });

  const [error, setError] = useState<string | null>(null);

  const selectedCustomerDebt =
    customersWithDebt.find((c) => c.id === form.customer_id)?.total ?? 0;

  const handleAmountChange = (value: string) => {
    const clean = value.replace(/\D/g, ""); // chỉ số

    const num = Number(clean);

    if (num > selectedCustomerDebt) {
      setError("Amount cannot exceed customer's unpaid debt");
      return;
    }

    setError(null);
    setForm({ ...form, amount: clean });
  };

  const handleSubmit = async () => {
    if (!form.customer_id) return setError("Customer is required");
    if (!form.receipt_date) return setError("Receipt date is required");

    const amountNum = Number(form.amount);
    if (amountNum <= 0) return setError("Amount must be > 0");

    if (amountNum > selectedCustomerDebt)
      return setError("Amount cannot exceed customer debt");

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
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">Create Receipt</h1>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <div className="space-y-4 bg-white p-4 rounded shadow">
        {/* CUSTOMER */}
        <div className="space-y-1">
          <label className="font-semibold">Customer</label>
          <select
            className="w-full border p-2 rounded"
            value={form.customer_id || ""}
            onChange={(e) =>
              setForm({ ...form, customer_id: Number(e.target.value) })
            }
          >
            <option value="">-- Select customer with debt --</option>
            {customersWithDebt.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (Debt: {c.total.toLocaleString()}₫)
              </option>
            ))}
          </select>
        </div>

        {/* DEBT DISPLAY */}
        {form.customer_id !== 0 && (
          <div className="text-sm text-gray-700">
            Remaining Debt:{" "}
            <span className="font-semibold text-red-600">
              {selectedCustomerDebt.toLocaleString()}₫
            </span>
          </div>
        )}

        {/* DATE */}
        <div className="space-y-1">
          <label className="font-semibold">Receipt Date</label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={form.receipt_date}
            onChange={(e) =>
              setForm({ ...form, receipt_date: e.target.value })
            }
          />
        </div>

        {/* AMOUNT */}
        <div className="space-y-1">
          <label className="font-semibold">Amount</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder="Enter amount"
            value={form.amount}
            onChange={(e) => handleAmountChange(e.target.value)}
          />

          {/* Quick choose */}
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              className="px-3 py-1 bg-gray-200 rounded"
              onClick={() =>
                handleAmountChange(Math.min(100000, selectedCustomerDebt).toString())
              }
            >
              +100,000
            </button>

            <button
              className="px-3 py-1 bg-gray-200 rounded"
              onClick={() =>
                handleAmountChange(Math.min(500000, selectedCustomerDebt).toString())
              }
            >
              +500,000
            </button>

            <button
              className="px-3 py-1 bg-blue-500 text-white rounded"
              onClick={() => handleAmountChange(selectedCustomerDebt.toString())}
            >
              Pay Full Debt ({selectedCustomerDebt.toLocaleString()}₫)
            </button>
          </div>
        </div>

        {/* METHOD */}
        <div className="space-y-1">
          <label className="font-semibold">Method</label>
          <select
            className="w-full border p-2 rounded"
            value={form.method}
            onChange={(e) =>
              setForm({
                ...form,
                method: e.target.value as CreateReceiptDto["method"],
              })
            }
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank Transfer</option>
            <option value="transfer">Internal Transfer</option>
          </select>
        </div>

        {/* SUBMIT */}
        <button
          onClick={handleSubmit}
          className="w-full py-2 bg-blue-600 text-white rounded"
        >
          Create Receipt
        </button>
      </div>
    </div>
  );
}
