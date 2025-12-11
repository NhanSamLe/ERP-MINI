import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchAllUomsThunk,
  createUomThunk,
  updateUomThunk,
  deleteUomThunk,
} from "../store/master-data/uom/uom.thunks";

import { Uom, CreateUomDto, UpdateUomDto } from "../dto/uom.dto";
import { DataTable } from "../../../components/ui/DataTable";
import UomFormModal from "../components/UomFormModal";
import { Plus, RefreshCw, Search, Pencil, Trash2, Package } from "lucide-react";
import * as uomService from "../service/uom.service";
import { Column } from "../../../types/common";

export default function UomPage() {
  const dispatch = useAppDispatch();
  const { Uoms, loading } = useAppSelector((state) => state.uom);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Uom | null>(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    dispatch(fetchAllUomsThunk());
  }, [dispatch]);

  const handleSearch = async () => {
    const data = await uomService.searchUoms(searchText);
    dispatch({
      type: fetchAllUomsThunk.fulfilled.type,
      payload: data,
    });
  };

  const handleCreate = async (dto: CreateUomDto) => {
    await dispatch(createUomThunk(dto));
    setShowModal(false);
  };

  const handleUpdate = async (id: number, dto: UpdateUomDto) => {
    await dispatch(updateUomThunk({ id, data: dto }));
    setShowModal(false);
  };

  const handleDelete = async (row: Uom) => {
    if (window.confirm(`Delete UOM "${row.name}" ?`)) {
      await dispatch(deleteUomThunk(row.id));
    }
  };

  const columns: Column<Uom>[] = [
    { key: "code", label: "Code", sortable: true },
    { key: "name", label: "Name", sortable: true },
    {
      key: "actions" as any,
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2 py-1">
          <button
            type="button"
            onClick={() => {
              setEditItem(row);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Unit of Measurement
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage your UOM master data
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search UOM..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              {/* Refresh Button */}
              <button
                className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 group"
                onClick={handleSearch}
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5 text-gray-600 group-hover:rotate-180 transition-transform duration-500" />
              </button>

              {/* Add Button */}
              <button
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                onClick={() => {
                  setEditItem(null);
                  setShowModal(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Add UOM
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <DataTable<Uom>
            data={Uoms}
            columns={columns}
            loading={loading}
            showSelection={false}
            searchable={false}
            showActions={false}
          />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <UomFormModal
          data={editItem}
          onClose={() => setShowModal(false)}
          onSubmit={(data) => {
            if (editItem) {
              handleUpdate(editItem.id, data as UpdateUomDto);
            } else {
              handleCreate(data as CreateUomDto);
            }
          }}
        />
      )}
    </div>
  );
}