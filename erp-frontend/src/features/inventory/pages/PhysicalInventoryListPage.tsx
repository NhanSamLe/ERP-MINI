import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch, RootState } from "../../../store/store";
import {
  fetchPhysicalInventoriesThunk,
  createPhysicalInventoryThunk,
} from "../store";
import { fetchWarehousesThunk } from "../store/stock/warehouse/warehouse.thunks";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../components/ui/Select";
import { PhysicalInventory } from "../store/stock/physicalInventory/physicalInventory.types";
import { toast } from "react-toastify";
import { formatDateTime } from "@/utils/time.helper";
import { Plus, Eye, ClipboardList, Search, FileEdit, CheckSquare, RefreshCw, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
  in_progress: "bg-blue-50 text-blue-700 border-blue-150 hover:bg-blue-50",
  validated: "bg-emerald-50 text-emerald-700 border-emerald-150 hover:bg-emerald-50",
  cancelled: "bg-rose-50 text-rose-700 border-rose-150 hover:bg-rose-50",
};

const statusLabels: Record<string, string> = {
  draft: "Nháp",
  in_progress: "Đang thực hiện",
  validated: "Đã xác nhận",
  cancelled: "Đã hủy",
};

export default function PhysicalInventoryListPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { items, loading } = useSelector(
    (state: RootState) => state.physicalInventory,
  );
  const warehouses = useSelector((state: RootState) => state.warehouse.items);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    warehouse_id: "",
    inv_date: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    dispatch(fetchPhysicalInventoriesThunk());
    dispatch(fetchWarehousesThunk());
  }, [dispatch]);

  const filtered = items.filter((inv) => {
    const matchSearch =
      !search ||
      inv.inv_no.toLowerCase().includes(search.toLowerCase()) ||
      inv.warehouse?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = async () => {
    if (!createForm.warehouse_id || !createForm.inv_date) {
      toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc!");
      return;
    }
    setCreating(true);
    try {
      const result = await dispatch(
        createPhysicalInventoryThunk({
          warehouse_id: Number(createForm.warehouse_id),
          inv_date: createForm.inv_date,
        }),
      ).unwrap();
      toast.success("Tạo phiếu kiểm kê thực tế thành công!");
      setShowCreate(false);
      setCreateForm({ warehouse_id: "", inv_date: "" });
      navigate(`/inventory/physical-inventories/${result.id}`);
    } catch (err: any) {
      toast.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-sm">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kiểm kê kho thực tế</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Khởi tạo, đối chiếu và xác nhận các điều chỉnh số lượng tồn kho thực tế
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowCreate(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          size="md"
          className="self-end sm:self-auto"
        >
          Tạo đợt kiểm kê
        </Button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phiếu kiểm kê</p>
            <p className="text-lg font-extrabold text-slate-850 mt-0.5">{items.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đang thực hiện</p>
            <p className="text-lg font-extrabold text-slate-850 mt-0.5">
              {items.filter(x => x.status === 'in_progress').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đã xác nhận</p>
            <p className="text-lg font-extrabold text-slate-850 mt-0.5">
              {items.filter(x => x.status === 'validated').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
            <FileEdit className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phiếu nháp</p>
            <p className="text-lg font-extrabold text-slate-850 mt-0.5">
              {items.filter(x => x.status === 'draft').length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="border-slate-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
        {/* Filters Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
            <Input
              placeholder="Tìm kiếm phiếu theo số phiếu hoặc tên kho hàng..."
              value={search}
              onChange={setSearch}
              className="pl-9 bg-white border-slate-200 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px] h-10 bg-white border-slate-200 focus:ring-orange-500 focus:border-orange-500 rounded-lg">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả trạng thái</SelectItem>
              <SelectItem value="draft">Nháp</SelectItem>
              <SelectItem value="in_progress">Đang thực hiện</SelectItem>
              <SelectItem value="validated">Đã xác nhận</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6 text-left">Mã phiếu</th>
                <th className="py-3.5 px-6 text-left">Kho hàng</th>
                <th className="py-3.5 px-6 text-left">Ngày kiểm</th>
                <th className="py-3.5 px-6 text-left">Trạng thái</th>
                <th className="py-3.5 px-6 text-left">Người tạo</th>
                <th className="py-3.5 px-6 text-left">Ngày tạo</th>
                <th className="py-3.5 px-6 text-center w-20">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-medium">Đang tải danh sách kiểm kê...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 italic">
                    Không tìm thấy đợt kiểm kê thực tế nào
                  </td>
                </tr>
              ) : (
                filtered.map((inv: PhysicalInventory) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/40 transition-colors cursor-pointer"
                    onClick={() => navigate(`/inventory/physical-inventories/${inv.id}`)}
                  >
                    <td className="py-3.5 px-6 font-semibold font-mono text-slate-700">
                      {inv.inv_no}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-800">
                      {inv.warehouse?.name ?? "—"}
                    </td>
                    <td className="py-3.5 px-6 text-slate-650 text-xs font-medium font-mono">
                      {inv.inv_date}
                    </td>
                    <td className="py-3.5 px-6">
                      <Badge
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-none capitalize ${
                          statusColors[inv.status] || "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {statusLabels[inv.status] || inv.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-6 text-slate-700 font-medium">
                      {inv.creator?.full_name ?? "—"}
                    </td>
                    <td className="py-3.5 px-6 text-slate-450 text-xs font-mono font-medium">
                      {formatDateTime(inv.created_at ?? "")}
                    </td>
                    <td className="py-3.5 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/inventory/physical-inventories/${inv.id}`)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo đợt kiểm kê thực tế mới</DialogTitle>
            <DialogDescription>
              Khởi tạo phiếu kiểm tra số lượng tồn kho. Bạn có thể nhập thực tế đếm số lượng sau đó.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Kho hàng <span className="text-red-500">*</span>
              </label>
              <Select
                value={createForm.warehouse_id}
                onValueChange={(v) =>
                  setCreateForm((p) => ({ ...p, warehouse_id: v }))
                }
              >
                <SelectTrigger className="w-full h-10 bg-white border-slate-200 focus:ring-orange-500 focus:border-orange-500 rounded-lg">
                  <SelectValue placeholder="Chọn kho hàng" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Ngày kiểm kê <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={createForm.inv_date}
                onChange={(v) =>
                  setCreateForm((p) => ({ ...p, inv_date: v }))
                }
                className="border-slate-200 focus:ring-orange-500 focus:border-orange-500"
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 flex-row justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCreate(false)}
              disabled={creating}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={creating}
            >
              Bắt đầu kiểm kê
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
