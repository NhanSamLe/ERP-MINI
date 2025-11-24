import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../store/store";
import { DataTable } from "../../../components/ui/DataTable";
import { Button } from "../../../components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  fetchPurchaseOrdersThunk,
  deletePurchaseOrderThunk,
} from "../store/purchaseOrder.thunks";

import { PurchaseOrder } from "../store/purchaseOrder.types";

import {
  FileText,
  FileSpreadsheet,
  RotateCw,
  ChevronUp,
  Upload,
  Plus,
  Trash2,
} from "lucide-react";

export default function PurchaseOrderPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const role = useSelector((state: RootState) => state.auth.user?.role.name);
  console.log("User Role:", role);

  const { items: purchaseOrders, loading } = useSelector(
    (state: RootState) => state.purchaseOrder
  );

  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchPurchaseOrdersThunk());
  }, [dispatch]);

  const handleDelete = async () => {
    if (!selectedPO) return;

    setDeleting(true);
    try {
      await dispatch(deletePurchaseOrderThunk(selectedPO.id)).unwrap();
      toast.success("Purchase Order deleted successfully!");
      setConfirmOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete Purchase Order!");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: "po_no", label: "PO No" },
    {
      key: "order_date",
      label: "Order Date",
      render: (po: PurchaseOrder) =>
        po.order_date
          ? new Date(po.order_date).toLocaleDateString("vi-VN")
          : "—",
    },
    {
      key: "total_after_tax",
      label: "Total",
      render: (po: PurchaseOrder) =>
        po.total_after_tax ? `$${po.total_after_tax}` : "—",
    },
    {
      key: "status",
      label: "Status",
      render: (po: PurchaseOrder) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            po.status === "draft"
              ? "bg-gray-100 text-gray-500"
              : po.status === "confirmed"
              ? "bg-blue-100 text-blue-700"
              : po.status === "received"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {po.status.toUpperCase()}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Created At",
      render: (po: PurchaseOrder) =>
        new Date(po.created_at).toLocaleDateString("vi-VN"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            Purchase Orders
          </h1>
          <p className="text-sm text-gray-500">
            Manage supplier purchase orders
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-1 border border-red-300 bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-200 transition">
            <FileText className="w-4 h-4" />
          </button>

          <button className="flex items-center gap-1 border border-green-300 bg-green-100 text-green-600 px-3 py-1.5 rounded-lg text-sm hover:bg-green-200 transition">
            <FileSpreadsheet className="w-4 h-4" />
          </button>

          <button
            onClick={() => dispatch(fetchPurchaseOrdersThunk())}
            className="flex items-center gap-1 border border-gray-300 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button className="flex items-center gap-1 border border-gray-300 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition">
            <ChevronUp className="w-4 h-4" />
          </button>

          <Link to="/purchase-orders/create">
            <Button className="flex items-center gap-1 bg-[#ff8c00] hover:bg-[#ff7700] text-white px-4 py-2 rounded-lg shadow text-sm font-medium transition">
              <Plus className="w-4 h-4" />
              Add Purchase Order
            </Button>
          </Link>

          <Button className="flex items-center gap-1 bg-[#1a1d29] hover:bg-[#0f111a] text-white px-4 py-2 rounded-lg shadow text-sm font-medium transition">
            <Upload className="w-4 h-4" />
            Import PO
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select className="border rounded-lg px-3 py-2 text-sm text-gray-700">
          <option>Status</option>
        </select>

        <select className="border rounded-lg px-3 py-2 text-sm text-gray-700">
          <option>Supplier</option>
        </select>
      </div>

      {/* Data Table */}
      <DataTable
        data={purchaseOrders}
        columns={columns}
        loading={loading}
        searchKeys={["po_no"]}
        onView={(item) => console.log(item)}
        onEdit={(item) =>
          navigate(`/purchase-orders/edit/${item.id}`, { state: { po: item } })
        }
        onDelete={
          role === "Purchasing Staff"
            ? (item) => {
                setSelectedPO(item);
                setConfirmOpen(true);
              }
            : undefined
        }
      />

      {/* Confirm Delete Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2">
              Are you sure you want to delete this Purchase Order?
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
