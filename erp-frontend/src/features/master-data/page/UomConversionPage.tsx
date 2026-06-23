import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchAllConversionsThunk,
  createConversionThunk,
  updateConversionThunk,
  deleteConversionThunk,
} from "../store/master-data/conversion/conversion.thunks";
import { formatNumber } from "../../../utils/currency.helper";
import { fetchAllUomsThunk } from "../store/master-data/uom/uom.thunks";
import {
  UomConversion,
  CreateUomConversionDto,
  UpdateUomConversionDto,
} from "../dto/uom.dto";
import { DataTable } from "../../../components/ui/DataTable";
import { Column } from "../../../types/common";
import ConversionFormModal from "../components/ConversionFormModal";
import { Plus, RefreshCw, Search, Pencil, Trash2, ArrowRightLeft } from "lucide-react";
import { toast } from "react-toastify";
import { ActionConfirmModal } from "../../../components/common/ActionConfirmModal";

export default function UomConversionPage() {
  const dispatch = useAppDispatch();

  const { UomConversions, loading } = useAppSelector((state) => state.conversion);
  const { Uoms } = useAppSelector((state) => state.uom);

  const [searchText, setSearchText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<UomConversion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UomConversion | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchAllConversionsThunk());
    dispatch(fetchAllUomsThunk());
  }, [dispatch]);

  const getUomLabel = (id: number) => {
    const uom = Uoms.find((item) => item.id === id);
    return uom ? `${uom.code} - ${uom.name}` : `#${id}`;
  };

  const filteredConversions = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return UomConversions;

    return UomConversions.filter((item) => {
      const from = getUomLabel(item.from_uom_id).toLowerCase();
      const to = getUomLabel(item.to_uom_id).toLowerCase();
      return from.includes(keyword) || to.includes(keyword) || String(item.factor).includes(keyword);
    });
  }, [UomConversions, Uoms, searchText]);

  const handleSubmit = async (
    form: CreateUomConversionDto | UpdateUomConversionDto
  ) => {
    if (editItem?.id) {
      const result = await dispatch(
        updateConversionThunk({ id: editItem.id, data: form as UpdateUomConversionDto })
      );
      if (updateConversionThunk.fulfilled.match(result)) {
        toast.success("Cập nhật quy đổi thành công.");
        setShowModal(false);
        setEditItem(null);
      } else {
        toast.error((result.payload as string) ?? "Cập nhật quy đổi thất bại.");
      }
      return;
    }

    const result = await dispatch(createConversionThunk(form as CreateUomConversionDto));
    if (createConversionThunk.fulfilled.match(result)) {
      toast.success("Tạo quy đổi thành công.");
      setShowModal(false);
      setEditItem(null);
    } else {
      toast.error((result.payload as string) ?? "Tạo quy đổi thất bại.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await dispatch(deleteConversionThunk(deleteTarget.id));
      if (deleteConversionThunk.fulfilled.match(result)) {
        toast.success("Đã xóa quy đổi.");
        setDeleteTarget(null);
      } else {
        toast.error((result.payload as string) ?? "Xóa quy đổi thất bại.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<UomConversion>[] = [
    {
      key: "from_uom_id",
      label: "Đơn vị nguồn",
      sortable: true,
      render: (row) => <span className="font-medium text-gray-900">{getUomLabel(row.from_uom_id)}</span>,
    },
    {
      key: "to_uom_id",
      label: "Đơn vị đích",
      sortable: true,
      render: (row) => <span className="font-medium text-gray-900">{getUomLabel(row.to_uom_id)}</span>,
    },
    {
      key: "factor",
      label: "Hệ số quy đổi",
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 font-semibold text-sm">
          x{formatNumber(row.factor, 6)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Thao tác",
      render: (row) => (
        <div className="flex items-center gap-2 py-1">
          <button
            type="button"
            onClick={() => {
              setEditItem(row);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-100 rounded-md hover:bg-orange-100 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Sửa
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-md hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Xóa
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="erp-card overflow-hidden">
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-gray-200 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Quy đổi đơn vị</h1>
              <p className="text-xs text-gray-400 mt-0.5">Quản lý hệ số chuyển đổi giữa các đơn vị tính</p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {filteredConversions.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm quy đổi..."
                className="w-full h-8 pl-8 pr-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
              onClick={() => dispatch(fetchAllConversionsThunk())}
              title="Tải lại"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors shadow-sm"
              onClick={() => {
                setEditItem({
                  id: 0,
                  from_uom_id: 0,
                  to_uom_id: 0,
                  factor: 1,
                } as UomConversion);
                setShowModal(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm quy đổi
            </button>
          </div>
        </div>

        <div className="px-5 py-4">
          <DataTable<UomConversion>
            data={filteredConversions}
            columns={columns}
            loading={loading}
            showSelection={false}
            searchable={false}
            showActions={false}
          />
        </div>
      </div>

      {showModal && editItem && (
        <ConversionFormModal
          data={editItem}
          onClose={() => {
            setShowModal(false);
            setEditItem(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      <ActionConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Xóa quy đổi đơn vị"
        description={
          <span>
            Bạn có chắc muốn xóa quy đổi từ <strong>{deleteTarget ? getUomLabel(deleteTarget.from_uom_id) : ""}</strong> sang <strong>{deleteTarget ? getUomLabel(deleteTarget.to_uom_id) : ""}</strong>?
          </span>
        }
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
