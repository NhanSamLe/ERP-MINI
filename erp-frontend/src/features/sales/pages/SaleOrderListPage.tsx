import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import {
  fetchSaleOrders,
} from "@/features/sales/store/saleOrder.slice";

import SaleOrderFilters from "../components/SaleOrderFilters";
import SaleOrderTable from "../components/SaleOrderTable";
import { Link } from "react-router-dom";

export default function SaleOrderListPage() {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.saleOrder);

  // Local filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [customer, setCustomer] = useState("");

  useEffect(() => {
    dispatch(fetchSaleOrders());
  }, [dispatch]);

  return (
    <div className="p-6">
      {/* Breadcrumb + Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Sales &gt; Sale Orders</p>
          <h1 className="text-2xl font-semibold">Sale Orders</h1>
        </div>

        <Link
          to="/sales/orders/create"
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          + New Sale Order
        </Link>
      </div>

      {/* Filters */}
      <SaleOrderFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        customer={customer}
        onCustomerChange={setCustomer}
        onRefresh={() => dispatch(fetchSaleOrders())}
      />

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <SaleOrderTable items={items} />
      )}
    </div>
  );
}
