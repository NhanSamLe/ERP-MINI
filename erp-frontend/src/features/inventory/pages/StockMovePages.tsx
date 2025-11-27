import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import { fetchWarehousesThunk } from "../store/stock/warehouse/warehouse.thunks";
import { DataTable } from "../../../components/ui/DataTable";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../components/ui/Select";
import { fetchStockMovesThunk, StockMove } from "../store";

export default function StockMovePages() {
  const dispatch = useDispatch<AppDispatch>();

  const { items, loading } = useSelector((state: RootState) => state.stockMove);

  const warehouses = useSelector((state: RootState) => state.warehouse.items);

  const [search] = useState("");
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [type, setType] = useState("");

  useEffect(() => {
    dispatch(fetchStockMovesThunk());
    dispatch(fetchWarehousesThunk());
  }, [dispatch]);

  const getWarehouseName = (id: number) =>
    warehouses.find((w) => w.id === id)?.name || "N/A";

  const filteredData = items.filter((item) => {
    const warehouseName = getWarehouseName(item.warehouse_id);

    const matchSearch =
      search === "" ||
      item.type.toLowerCase().includes(search.toLowerCase()) ||
      warehouseName.toLowerCase().includes(search.toLowerCase());

    const matchWarehouse =
      warehouseId === "" || item.warehouse_id === Number(warehouseId);

    const matchType = type === "" || item.type === type;

    return matchSearch && matchWarehouse && matchType;
  });

  const columns = [
    {
      key: "move_no",
      label: "Move No",
    },
    {
      key: "warehouse_id",
      label: "Warehouse",
      render: (row: StockMove) => getWarehouseName(row.warehouse_id),
    },

    {
      key: "type",
      label: "Type",
      render: (row: StockMove) => row.type.toUpperCase(),
    },

    {
      key: "move_date",
      label: "Date",
      render: (row: StockMove) =>
        row.move_date ? new Date(row.move_date).toLocaleString() : "N/A",
    },

    {
      key: "status",
      label: "Status",
      render: (row: StockMove) => row.status,
    },

    {
      key: "note",
      label: "Note",
      render: (row: StockMove) =>
        row.note ? <span className="italic">{row.note}</span> : "N/A",
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
            <SelectTrigger className="min-w-[200px]">
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
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="receipt">Receipt</SelectItem>
              <SelectItem value="issue">Issue</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
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
