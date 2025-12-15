import { useEffect, useMemo, useState } from "react";
import { Eye, Download, Plus, Search, CreditCard } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getAllApPaymentsThunk } from "../../store/apPayment/apPayment.thunks";
import { ApPayment } from "../../store/apPayment/apPayment.types";
import { useNavigate } from "react-router-dom";
import ApPaymentCreateModal from "../../components/ApPaymentCreateModal";

export default function ApPaymentPages() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { list, loading } = useAppSelector((state) => state.apPayment);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [openCreateModal, setOpenCreateModal] = useState(false);

  useEffect(() => {
    dispatch(getAllApPaymentsThunk());
  }, [dispatch]);

  const filteredPayments = useMemo(() => {
    return list.filter((payment: ApPayment) => {
      const matchesSearch = payment.payment_no
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || payment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [list, searchTerm, statusFilter]);

  /* ================= BADGES ================= */
  const statusBadge: Record<ApPayment["status"], string> = {
    draft: "bg-gray-100 text-gray-700",
    posted: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const approvalBadge: Record<ApPayment["approval_status"], string> = {
    draft: "bg-gray-100 text-gray-700",
    waiting_approval: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              AP Payment List
            </h1>
            <p className="text-gray-600 mt-1">Manage all supplier payments</p>
          </div>

          <button
            onClick={() => setOpenCreateModal(true)}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-lg"
          >
            <Plus className="w-5 h-5" />
            New Payment
          </button>
        </div>

        {/* ================= FILTER ================= */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Payment no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            <div className="w-56">
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option>All</option>
                <option value="draft">Draft</option>
                <option value="posted">Posted</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* ================= TABLE ================= */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">
                  Payment No
                </th>
                <th className="px-6 py-4 text-left font-semibold">Supplier</th>
                <th className="px-6 py-4 text-right font-semibold">Amount</th>
                <th className="px-6 py-4 text-left font-semibold">Status</th>
                <th className="px-6 py-4 text-left font-semibold">Approval</th>
                <th className="px-6 py-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <CreditCard className="w-8 h-8 animate-pulse" />
                      Loading payments...
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              )}

              {!loading &&
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-orange-600">
                      {payment.payment_no}
                    </td>

                    <td className="px-6 py-4">
                      {payment.supplier?.name || "-"}
                    </td>

                    <td className="px-6 py-4 text-right font-medium">
                      {Number(payment.amount || 0).toLocaleString("vi-VN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-md font-medium ${
                          statusBadge[payment.status]
                        }`}
                      >
                        {payment.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-md font-medium ${
                          approvalBadge[payment.approval_status]
                        }`}
                      >
                        {payment.approval_status
                          .replace("_", " ")
                          .toUpperCase()}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-3">
                        <Eye
                          onClick={() =>
                            navigate(`/purchase/payments/${payment.id}`)
                          }
                          className="w-5 h-5 cursor-pointer text-gray-500 hover:text-gray-900"
                        />
                        <Download className="w-5 h-5 cursor-pointer text-gray-500 hover:text-gray-900" />
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {/* ================= FOOTER ================= */}
          <div className="px-6 py-4 border-t bg-gray-50 text-sm text-gray-600">
            Showing <strong>{filteredPayments.length}</strong> of{" "}
            <strong>{list.length}</strong> payments
          </div>
        </div>
      </div>
      <ApPaymentCreateModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onSuccess={() => {
          setOpenCreateModal(false);
          navigate(`/purchase/payments`);
        }}
      />
    </div>
  );
}
