import  { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchSaleOrders } from "@/features/sales/store/saleOrder.slice";
import SaleOrderFilters from "../components/SaleOrderFilters";
import SaleOrderTable from "../components/SaleOrderTable";
import { Link } from "react-router-dom";

export default function SaleOrderListPage() {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.saleOrder);
  const { user } = useAppSelector((state) => state.auth);

  // ================= LOCAL FILTERS =================
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [customer, setCustomer] = useState("");

  useEffect(() => {
    dispatch(fetchSaleOrders());
  }, [dispatch]);

  // ✅ Check if user can create order
  const canCreateOrder = user?.role?.code === "SALES";

  // ✅ Get unique customers for filter dropdown
  const customers = useMemo(() => {
    const uniqueCustomers = new Map();
    items.forEach((item) => {
      if (item.customer && item.customer_id) {
        uniqueCustomers.set(item.customer_id, item.customer);
      }
    });
    return Array.from(uniqueCustomers.entries()).map(([id, customer]) => ({
      id,
      name: customer.name,
    }));
  }, [items]);

  // ================= FILTER LOGIC =================
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search by order number or customer name
      const searchLower = search.toLowerCase();
      const matchesSearch =
        item.order_no?.toLowerCase().includes(searchLower) ||
        item.customer?.name?.toLowerCase().includes(searchLower);

      if (search && !matchesSearch) return false;

      // Filter by status
      if (status && item.approval_status !== status) {
        return false;
      }

      // Filter by customer
      if (customer && item.customer_id?.toString() !== customer) {
        return false;
      }

      return true;
    });
  }, [items, search, status, customer]);

  return (
    <div className="p-6">
      {/* ========== HEADER ========== */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Sales &gt; Sale Orders</p>
          <h1 className="text-2xl font-semibold">Sale Orders</h1>
        </div>

        {canCreateOrder && (
          <Link
            to="/sales/orders/create"
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            + New Sale Order
          </Link>
        )}
      </div>

      {/* ========== FILTERS ========== */}
      <SaleOrderFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        customer={customer}
        onCustomerChange={setCustomer}
        customers={customers}
        onRefresh={() => dispatch(fetchSaleOrders())}
      />

      {/* ========== TABLE ========== */}
      {loading ? (
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-500 text-center">No sale orders found</p>
        </div>
      ) : (
        <SaleOrderTable items={filteredItems} />
      )}

      {/* ========== RESULT COUNT ========== */}
      {!loading && (
        <div className="mt-4 text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredItems.length}</span> of{" "}
          <span className="font-semibold">{items.length}</span> sale orders
        </div>
      )}
    </div>
  );
}