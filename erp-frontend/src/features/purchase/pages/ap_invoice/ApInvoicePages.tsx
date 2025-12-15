import { useEffect, useMemo, useState } from "react";
import { Eye, Download, Plus, Search, FileText } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createApInvoiceFromPoThunk,
  getAllApInvoicesThunk,
} from "../../store/apInvoice/apInvoice.thunks";
import { ApInvoice } from "../../store/apInvoice/apInvoice.types";
import SelectPoModal from "../../components/SelectPoModal";
import { getPurchaseOrdersAvailableForInvoiceThunk } from "../../store/purchaseOrder.thunks";
import { loadPartnerDetail } from "@/features/partner/store/partner.thunks";
import { PurchaseOrder } from "../../store/purchaseOrder.types";
import ConfirmCreateInvoiceModal from "../../components/ConfirmCreateInvoiceModal";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/ErrorHelper";
import { useNavigate } from "react-router-dom";

export default function ApInvoicePages() {
  const dispatch = useAppDispatch();
  const { list, loading } = useAppSelector((state) => state.apInvoice);

  const { availableForInvoice } = useAppSelector(
    (state) => state.purchaseOrder
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [openSelectPo, setOpenSelectPo] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getAllApInvoicesThunk());
  }, [dispatch]);

  const handleOpenSelectPo = () => {
    setOpenSelectPo(true);
    dispatch(getPurchaseOrdersAvailableForInvoiceThunk());
  };

  const handleConfirmCreateInvoice = async () => {
    if (!selectedPo) return;

    try {
      const invoice = await dispatch(
        createApInvoiceFromPoThunk(selectedPo.id)
      ).unwrap();
      toast.success(`AP Invoice ${invoice.invoice_no} created successfully`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setOpenConfirm(false);
      setSelectedPo(null);
    }
  };
  const filteredInvoices = useMemo(() => {
    return list.filter((invoice: ApInvoice) => {
      const matchesSearch =
        invoice.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.creator?.full_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [list, searchTerm, statusFilter]);

  /* ================= BADGES ================= */
  const statusBadge = {
    draft: "bg-gray-100 text-gray-700",
    posted: "bg-orange-100 text-orange-700",
    paid: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const approvalBadge = {
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
              {" "}
              AP Invoice List
            </h1>
            <p className="text-gray-600 mt-1">Manage all purchase invoices</p>
          </div>
          <button
            onClick={() => handleOpenSelectPo()}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Invoice
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
                  placeholder="Invoice no, creator..."
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
                <option value="paid">Paid</option>
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
                  Invoice No
                </th>
                <th className="px-6 py-4 text-left font-semibold">Branch</th>
                <th className="px-6 py-4 text-left font-semibold">Creator</th>
                <th className="px-6 py-4 text-right font-semibold">Amount</th>
                <th className="px-6 py-4 text-left font-semibold">Status</th>
                <th className="px-6 py-4 text-left font-semibold">Approval</th>
                <th className="px-6 py-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <FileText className="w-8 h-8 animate-pulse" />
                      Loading invoices...
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-500">
                    No invoices found
                  </td>
                </tr>
              )}

              {!loading &&
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-orange-600">
                      {invoice.invoice_no}
                    </td>
                    <td className="px-6 py-4">{invoice.branch?.name}</td>
                    <td className="px-6 py-4">{invoice.creator?.full_name}</td>
                    <td className="px-6 py-4 text-right font-medium">
                      {Number(invoice.total_after_tax || 0).toLocaleString(
                        "vi-VN",
                        { minimumFractionDigits: 2 }
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-md font-medium ${
                          statusBadge[invoice.status]
                        }`}
                      >
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-md font-medium ${
                          approvalBadge[invoice.approval_status]
                        }`}
                      >
                        {invoice.approval_status
                          .replace("_", " ")
                          .toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-3">
                        <Eye
                          onClick={() =>
                            navigate(`/purchase/invoices/${invoice.id}`)
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
            Showing <strong>{filteredInvoices.length}</strong> of{" "}
            <strong>{list.length}</strong> invoices
          </div>
        </div>
      </div>
      <SelectPoModal
        open={openSelectPo}
        poList={availableForInvoice}
        onClose={() => setOpenSelectPo(false)}
        onSelect={(po) => {
          console.log("Selected PO:", po);
          if (po.supplier_id) {
            dispatch(loadPartnerDetail(po.supplier_id));
          }
          setSelectedPo(po);
          setOpenSelectPo(false);
          setOpenConfirm(true);
        }}
      />

      <ConfirmCreateInvoiceModal
        open={openConfirm}
        po={selectedPo}
        onCancel={() => {
          setOpenConfirm(false);
          setSelectedPo(null);
        }}
        onConfirm={handleConfirmCreateInvoice}
      />
    </div>
  );
}
