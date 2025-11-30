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
import {
  createReceiptStockMoveThunk,
  createTransferStockMoveThunk,
  fetchStockMoveByIdThunk,
  fetchStockMovesThunk,
  StockMove,
  StockMoveCreate,
  StockMoveTransferCreate,
  StockMoveUpdate,
  StockMoveType,
  updateReceiptStockMoveThunk,
  ReferenceType,
  TransferForm,
  LineTransferItem,
  updateTransferStockMoveThunk,
  StockMoveTransferUpdate,
  AdjustmentForm,
  LineAdjustmentItem,
  StockMoveAdjustmentCreate,
  createAdjustmentStockMoveThunk,
  StockMoveAdjustmentUpdate,
  updateAdjustmentStockMoveThunk,
  deleteStockMoveThunk,
} from "../store";
import { Button } from "../../../components/ui/Button";
import { BasicDropdownMenu } from "../../../components/ui/DropdownMenu";
import CreateReceiptModal, {
  CreateReceiptForm,
  ProductItem,
} from "../components/Modal/ReceiptModal/CreateReceiptModal";
import { toast } from "react-toastify";
import EditReceiptModal, {
  EditReceiptForm,
  LineReceiptItem,
} from "../components/Modal/ReceiptModal/EditReceiptModal";
import { fetchPurchaseOrderByStatus } from "../../purchase/store/purchaseOrder.thunks";
import EditTransferModal from "../components/Modal/TransferModal/EditTransferModal";
import CreateTransferModal from "../components/Modal/TransferModal/CreateTransferModal";
import { Trash2 } from "lucide-react";
import CreateAdjustmentModal from "../components/Modal/AdjustmentModal/CreateAdjustmentModal";
import { getErrorMessage } from "@/utils/ErrorHelper";
import EditAdjustmentModal from "../components/Modal/AdjustmentModal/EditAdjustmentModal";

export default function StockMovePages() {
  const dispatch = useDispatch<AppDispatch>();

  const { items, loading } = useSelector((state: RootState) => state.stockMove);

  const warehouses = useSelector((state: RootState) => state.warehouse.items);
  const purchaseOrder = useSelector((state: RootState) => state.purchaseOrder);

  const [search] = useState("");
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [type, setType] = useState("");

  const typeColorMap: Record<string, string> = {
    receipt: "bg-green-100 text-green-700",
    issue: "bg-red-100 text-red-700",
    transfer: "bg-blue-100 text-blue-700",
    adjustment: "bg-orange-100 text-orange-700",
  };

  const statusColorMap: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    posted: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const [openCreateReceiptModal, setOpenCreateReceiptModal] = useState(false);
  const [openCreateTransferModal, setOpenCreateTransferModal] = useState(false);
  const [openCreateAdjustmentModal, setOpenCreateAdjustmentModal] =
    useState(false);

  const [openEditReceiptModal, setOpenEditReceiptModal] = useState(false);
  const [openEditTransferModal, setOpenEditTransferModal] = useState(false);
  const [openEditAdjustmentModal, setOpenEditAdjustmentModal] = useState(false);

  const [selectedStockMove, setSelectedStockMove] = useState<StockMove | null>(
    null
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchStockMovesThunk());
    dispatch(fetchWarehousesThunk());
    dispatch(fetchPurchaseOrderByStatus("confirmed"));
  }, [dispatch]);

  const getWarehouseName = (id: number) =>
    warehouses.find((w) => w.id === id)?.name || "N/A";

  const filteredData = items.filter((item: StockMove) => {
    const fromName = item.warehouse_from_id
      ? getWarehouseName(item.warehouse_from_id)
      : "";
    const toName = item.warehouse_to_id
      ? getWarehouseName(item.warehouse_to_id)
      : "";

    let warehouseName = "";

    if (item.type === "receipt") {
      warehouseName = toName;
    } else if (item.type === "issue") {
      warehouseName = fromName;
    } else if (item.type === "transfer") {
      warehouseName = `${fromName} → ${toName}`;
    } else if (item.type === "adjustment") {
      warehouseName = fromName;
    }
    const matchSearch =
      search === "" ||
      item.type.toLowerCase().includes(search.toLowerCase()) ||
      warehouseName.toLowerCase().includes(search.toLowerCase());

    const matchWarehouse =
      warehouseId === "" ||
      item.warehouse_from_id === Number(warehouseId) ||
      item.warehouse_to_id === Number(warehouseId);

    const matchType = type === "" || item.type === type;

    return matchSearch && matchWarehouse && matchType;
  });

  const columns = [
    {
      key: "move_no",
      label: "Move No",
    },
    {
      key: "warehouse",
      label: "Warehouse",
      render: (row: StockMove) => {
        const from = row.warehouse_from_id
          ? getWarehouseName(row.warehouse_from_id)
          : "N/A";

        const to = row.warehouse_to_id
          ? getWarehouseName(row.warehouse_to_id)
          : "N/A";

        switch (row.type) {
          case "receipt":
            return to;
          case "issue":
            return from;
          case "transfer":
            return `${from} → ${to}`;
          case "adjustment":
            return from;
          default:
            return "-";
        }
      },
    },

    {
      key: "type",
      label: "Type",
      render: (row: StockMove) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            typeColorMap[row.type] || "bg-gray-100 text-gray-700"
          }`}
        >
          {row.type.toUpperCase()}
        </span>
      ),
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
      render: (row: StockMove) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            statusColorMap[row.status] || "bg-gray-100 text-gray-700"
          }`}
        >
          {row.status.toUpperCase()}
        </span>
      ),
    },
    {
      key: "note",
      label: "Note",
      render: (row: StockMove) => {
        const text = row.note || "";
        const truncated =
          text.length > 20 ? text.substring(0, 20) + "..." : text;
        return <span className="italic">{truncated}</span>;
      },
    },
  ];

  const handleCreate = (type: string) => {
    if (type === "receipt") {
      setOpenCreateReceiptModal(true);
    }
    if (type === "transfer") {
      setOpenCreateTransferModal(true);
    }
    if (type === "adjustment") {
      setOpenCreateAdjustmentModal(true);
    }
  };

  const handleCreateReceiptSubmit = async (data: {
    form: CreateReceiptForm;
    products: ProductItem[];
  }) => {
    try {
      const payload: StockMoveCreate = {
        move_no: data.form.move_no,
        move_date: data.form.move_date,
        type: data.form.type as StockMoveType,
        warehouse_id: Number(data.form.warehouse),
        reference_type: data.form.reference_type as ReferenceType,
        reference_id: Number(data.form.referenceNo),
        note: data.form.notes || "",
        lines: data.products.map((p) => ({
          id: undefined,
          product_id: p.id,
          quantity: p.quantity,
          uom: p.uom,
        })),
      };
      const result = await dispatch(
        createReceiptStockMoveThunk(payload)
      ).unwrap();
      console.log("Created stock move:", result);
      toast.success("Stock Receipt Move created!");
      setOpenCreateReceiptModal(false);
    } catch (error) {
      console.log(">>> Error caught:", error);
      console.log(">>>> ERROR TYPE:", typeof error);

      toast.error(getErrorMessage(error));
    }
  };

  const handleCreateTransferSubmit = async (data: {
    form: TransferForm;
    lineItems: LineTransferItem[];
  }) => {
    try {
      const payload: StockMoveTransferCreate = {
        move_no: data.form.move_no,
        move_date: data.form.move_date,
        type: data.form.type as StockMoveType,
        warehouse_from_id: Number(data.form.warehouseFrom),
        warehouse_to_id: Number(data.form.warehouseTo),
        reference_type: data.form.reference_type as ReferenceType,
        note: data.form.notes || "",
        lines: data.lineItems.map((p) => ({
          id: undefined,
          product_id: p.product_id,
          quantity: p.quantity,
          uom: p.uom,
        })),
      };
      const result = await dispatch(createTransferStockMoveThunk(payload));
      console.log("Created stock move:", result);
      toast.success("Stock Transfer Move created!");
      setOpenCreateTransferModal(false);
    } catch (error) {
      console.error("Failed to create Stock Transfer Move:", error);
      toast.error("Failed to create Stock Transfer Move");
    }
  };
  const handleCreateAdjustmentSubmit = async (data: {
    form: AdjustmentForm;
    lineItems: LineAdjustmentItem[];
  }) => {
    try {
      const payload: StockMoveAdjustmentCreate = {
        move_no: data.form.move_no,
        move_date: data.form.move_date,
        type: data.form.type as StockMoveType,
        warehouse_id: Number(data.form.warehouse),
        reference_type: data.form.reference_type as ReferenceType,
        note: data.form.notes || "",
        lines: data.lineItems.map((p) => ({
          id: undefined,
          product_id: p.product_id,
          quantity: p.quantity,
          uom: p.uom,
        })),
      };
      const result = await dispatch(
        createAdjustmentStockMoveThunk(payload)
      ).unwrap();
      console.log("Created stock move:", result);
      toast.success("Stock Receipt Move created!");
      setOpenCreateAdjustmentModal(false);
    } catch (error) {
      console.log(">>> Error caught:", error);
      console.log(">>>> ERROR TYPE:", typeof error);

      toast.error(getErrorMessage(error));
    }
  };

  const handleEditReceiptSubmit = async (data: {
    form: EditReceiptForm;
    lineItems: LineReceiptItem[];
  }) => {
    if (!selectedStockMove) {
      toast.error("No receipt selected!");
      return;
    }
    const checkStatus = await dispatch(
      fetchStockMoveByIdThunk(selectedStockMove.id)
    ).unwrap();

    if (checkStatus.status !== "draft") {
      toast.error("Cannot edit, receipt already approved!");
      setOpenEditReceiptModal(false);
      return;
    }

    try {
      const payload: StockMoveUpdate = {
        move_no: data.form.move_no,
        move_date: data.form.move_date,
        type: data.form.type as StockMoveType,
        warehouse_id: Number(data.form.warehouse),
        reference_type: data.form.reference_type as ReferenceType,
        reference_id: Number(data.form.referenceNo),
        note: data.form.notes || "",
        lines: data.lineItems.map((p) => ({
          id: p.id,
          product_id: p.product_id,
          quantity: p.quantity,
          uom: p.uom,
        })),
      };
      const result = await dispatch(
        updateReceiptStockMoveThunk({ id: selectedStockMove.id, data: payload })
      ).unwrap();
      console.log("Edited stock move:", result);
      toast.success("Stock Receipt Move Edited!");
      setOpenEditReceiptModal(false);
    } catch (error) {
      console.log(">>> Error caught:", error);
      console.log(">>>> ERROR TYPE:", typeof error);

      toast.error(getErrorMessage(error));
    }
  };

  const handleEditTransferSubmit = async (data: {
    form: TransferForm;
    lineItems: LineTransferItem[];
  }) => {
    if (!selectedStockMove) {
      toast.error("No receipt selected!");
      return;
    }
    const checkStatus = await dispatch(
      fetchStockMoveByIdThunk(selectedStockMove.id)
    ).unwrap();

    if (checkStatus.status !== "draft") {
      toast.error("Cannot edit, Transfer already approved!");
      setOpenEditReceiptModal(false);
      return;
    }
    try {
      const payload: StockMoveTransferUpdate = {
        move_no: data.form.move_no,
        move_date: data.form.move_date,
        type: data.form.type as StockMoveType,
        warehouse_from_id: Number(data.form.warehouseFrom),
        warehouse_to_id: Number(data.form.warehouseTo),
        reference_type: data.form.reference_type as ReferenceType,
        note: data.form.notes || "",
        lines: data.lineItems.map((p) => ({
          id: p.id,
          product_id: p.product_id,
          quantity: p.quantity,
          uom: p.uom,
        })),
      };
      const result = await dispatch(
        updateTransferStockMoveThunk({
          id: selectedStockMove.id,
          data: payload,
        })
      );
      console.log("Edited stock move:", result);
      toast.success("Stock Transfer Move Edited!");
      setOpenEditTransferModal(false);
    } catch (error) {
      console.error("Failed to edit Stock Transfer Move:", error);
      toast.error("Failed to edit Stock Transfer Move");
    }
  };

  const handleEditAdjustmentSubmit = async (data: {
    form: AdjustmentForm;
    lineItems: LineAdjustmentItem[];
  }) => {
    if (!selectedStockMove) {
      toast.error("No receipt selected!");
      return;
    }
    const checkStatus = await dispatch(
      fetchStockMoveByIdThunk(selectedStockMove.id)
    ).unwrap();

    if (checkStatus.status !== "draft") {
      toast.error("Cannot edit, Adjustment already approved!");
      setOpenEditReceiptModal(false);
      return;
    }
    try {
      const payload: StockMoveAdjustmentUpdate = {
        move_no: data.form.move_no,
        move_date: data.form.move_date,
        type: data.form.type as StockMoveType,
        warehouse_id: Number(data.form.warehouse),
        reference_type: data.form.reference_type as ReferenceType,
        note: data.form.notes || "",
        lines: data.lineItems.map((p) => ({
          id: p.id,
          product_id: p.product_id,
          quantity: p.quantity,
          uom: p.uom,
        })),
      };
      const result = await dispatch(
        updateAdjustmentStockMoveThunk({
          id: selectedStockMove.id,
          data: payload,
        })
      ).unwrap();
      console.log("Edited stock move:", result);
      toast.success("Stock Adjustment Move Edited!");
      setOpenEditAdjustmentModal(false);
    } catch (error) {
      console.log(">>> Error caught:", error);
      console.log(">>>> ERROR TYPE:", typeof error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!selectedStockMove) return;
    try {
      setDeleting(true);
      await dispatch(deleteStockMoveThunk(selectedStockMove.id)).unwrap();
      toast.success("Deleted successfully!");
      setConfirmOpen(false);
      dispatch(fetchStockMovesThunk());
    } catch (error) {
      console.log(">>> Error caught:", error);
      console.log(">>>> ERROR TYPE:", typeof error);
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Manage Stock</h2>
        <p className="text-gray-500">View and manage stock across warehouses</p>
      </div>

      <div className="flex items-center justify-between w-full gap-4 margin-bottom-20">
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
        <BasicDropdownMenu
          trigger={
            <Button className="primary hover:secondary text-white mb-2">
              Create Movement ▾
            </Button>
          }
          items={[
            { label: "Create Receipt", onClick: () => handleCreate("receipt") },
            { label: "Create Issue", onClick: () => handleCreate("issue") },
            {
              label: "Create Transfer",
              onClick: () => handleCreate("transfer"),
            },
            {
              label: "Create Adjustment",
              onClick: () => handleCreate("adjustment"),
            },
          ]}
        />
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <DataTable
          data={filteredData}
          itemsPerPage={7}
          columns={columns}
          loading={loading}
          onView={(item) => console.log("Xem:", item)}
          onEdit={(item) => {
            try {
              setSelectedStockMove(item);
              switch (item.type) {
                case "receipt":
                  setOpenEditReceiptModal(true);
                  break;
                case "transfer":
                  setOpenEditTransferModal(true);
                  break;
                case "adjustment":
                  setOpenEditAdjustmentModal(true);
                  break;
                default:
                  toast.warn("Unknown stock move type");
              }
            } catch (error) {
              console.log(error);
              toast.error("Failed to load stock move detail");
            }
          }}
          onDelete={(item) => {
            setSelectedStockMove(item);
            setConfirmOpen(true);
          }}
          canEdit={(item) => item.status === "draft"}
          canDelete={(item) => item.status === "draft"}
        />
      </div>
      {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2">
              Are you sure you want to delete this Stock move?
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm"
                disabled={deleting}
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
      <CreateTransferModal
        open={openCreateTransferModal}
        warehouses={warehouses}
        onSubmit={handleCreateTransferSubmit}
        onClose={() => setOpenCreateTransferModal(false)}
      />
      <CreateReceiptModal
        open={openCreateReceiptModal}
        warehouses={warehouses}
        onSubmit={handleCreateReceiptSubmit}
        onClose={() => setOpenCreateReceiptModal(false)}
      />
      <CreateAdjustmentModal
        open={openCreateAdjustmentModal}
        warehouses={warehouses}
        onSubmit={handleCreateAdjustmentSubmit}
        onClose={() => setOpenCreateAdjustmentModal(false)}
      />
      <EditTransferModal
        open={openEditTransferModal}
        warehouses={warehouses}
        data={selectedStockMove}
        onSubmit={handleEditTransferSubmit}
        onClose={() => setOpenEditTransferModal(false)}
      />
      <EditReceiptModal
        open={openEditReceiptModal}
        warehouses={warehouses}
        purchaseOrder={purchaseOrder}
        data={selectedStockMove}
        onSubmit={handleEditReceiptSubmit}
        onClose={() => setOpenEditReceiptModal(false)}
      />
      <EditAdjustmentModal
        open={openEditAdjustmentModal}
        warehouses={warehouses}
        data={selectedStockMove}
        onSubmit={handleEditAdjustmentSubmit}
        onClose={() => setOpenEditAdjustmentModal(false)}
      />
    </div>
  );
}
