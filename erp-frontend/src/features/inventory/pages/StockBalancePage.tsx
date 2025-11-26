import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";

import { fetchStockBalancesThunk } from "../store/stock/stockbalance/stockBalance.thunks";

import { fetchWarehousesThunk } from "../store/stock/warehouse/warehouse.thunks";
import { fetchProductsThunkAllStatus } from "../../products/store";
import { StockBalance } from "../store/stock/stockbalance/stockBalance.types";
import { DataTable } from "../../../components/ui/DataTable";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../components/ui/Select";

export default function StockBalancePage() {
  const dispatch = useDispatch<AppDispatch>();

  const { items, loading } = useSelector(
    (state: RootState) => state.stockBalance
  );
  const warehouses = useSelector((state: RootState) => state.warehouse.items);
  const products = useSelector((state: RootState) => state.product.items);

  const [search] = useState("");
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [productId, setProductId] = useState<string>("");

  useEffect(() => {
    dispatch(fetchStockBalancesThunk());
    dispatch(fetchWarehousesThunk());
    dispatch(fetchProductsThunkAllStatus());
  }, [dispatch]);

  const getWarehouseName = (id: number) =>
    warehouses.find((w) => w.id === id)?.name || "N/A";

  const getProduct = (id: number) => products.find((p) => p.id === id);

  const filteredData = items.filter((item) => {
    const product = getProduct(item.product_id);
    const warehouseName = getWarehouseName(item.warehouse_id);

    const matchSearch =
      search === "" ||
      product?.name.toLowerCase().includes(search.toLowerCase()) ||
      warehouseName.toLowerCase().includes(search.toLowerCase());

    const matchWarehouse =
      warehouseId === "" || item.warehouse_id === Number(warehouseId);

    const matchProduct =
      productId === "" || item.product_id === Number(productId);

    return matchSearch && matchWarehouse && matchProduct;
  });

  const columns = [
    {
      key: "warehouse_id",
      label: "Warehouse",
      render: (row: StockBalance) => getWarehouseName(row.warehouse_id),
    },
    {
      key: "product_id",
      label: "Product",
      render: (row: StockBalance) => {
        const p = getProduct(row.product_id);
        return (
          <div className="flex items-center gap-3">
            {p?.image_url && (
              <img
                src={p.image_url}
                className="w-9 h-9 rounded-md border object-cover"
              />
            )}
            <span className="font-medium text-gray-800">
              {p?.name ?? "N/A"}
            </span>
          </div>
        );
      },
    },
    {
      key: "quantity",
      label: "Quantity",
    },
    {
      key: "created_at",
      label: "Created At",
      render: (row: StockBalance) =>
        row.created_at ? new Date(row.created_at).toLocaleString() : "N/A",
    },

    {
      key: "updated_at",
      label: "Updated At",
      render: (row: StockBalance) =>
        row.updated_at ? new Date(row.updated_at).toLocaleString() : "N/A",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Manage Stock</h2>
        <p className="text-gray-500">View and manage stock across warehouses</p>
      </div>

      <div className="flex items-center justify-between w-full gap-4">
        <div className="flex items-center gap-3">
          <Select value={warehouseId} onValueChange={setWarehouseId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Warehouse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key={""} value={""}>
                None
              </SelectItem>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key={""} value={""}>
                None
              </SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <DataTable
          data={filteredData}
          columns={columns}
          loading={loading}
          onView={(item) => console.log("Xem:", item)}
        />
      </div>
    </div>
  );
}
