import { useEffect, useState } from "react";
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
import * as convService from "../service/uomConversion.service";

export default function UomConversionPage() {
  const dispatch = useAppDispatch();

  const { UomConversions, loading } = useAppSelector(
    (state) => state.conversion
  );
  const { Uoms } = useAppSelector((state) => state.uom);

  const [searchText, setSearchText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<UomConversion | null>(null);

  useEffect(() => {
    dispatch(fetchAllConversionsThunk());
    dispatch(fetchAllUomsThunk());
  }, [dispatch]);

  const handleSearch = async () => {
    const data = await convService.searchUomConversions(searchText);
    dispatch({ type: fetchAllConversionsThunk.fulfilled.type, payload: data });
  };

  const handleSubmit = async (
    form: CreateUomConversionDto | UpdateUomConversionDto
  ) => {
    if (editItem && editItem.id) {
      await dispatch(
        updateConversionThunk({ id: editItem.id, data: form as UpdateUomConversionDto })
      );
    } else {
      await dispatch(createConversionThunk(form as CreateUomConversionDto));
    }
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = async (item: UomConversion) => {
    if (window.confirm(`Delete this conversion?`)) {
      await dispatch(deleteConversionThunk(item.id));
    }
  };

  const getUomLabel = (id: number) => {
    const uom = Uoms.find((u) => u.id === id);
    if (!uom) return `#${id}`;
    return `${uom.code} - ${uom.name}`;
  };

  const columns: Column<UomConversion>[] = [
    {
      key: "from_uom_id",
      label: "From UOM",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">
          {getUomLabel(row.from_uom_id)}
        </span>
      ),
    },
    {
      key: "to_uom_id",
      label: "To UOM",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">
          {getUomLabel(row.to_uom_id)}
        </span>
      ),
    },
    {
      key: "factor",
      label: "Conversion Factor",
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold text-sm">
           ×{formatNumber(row.factor, 6)}
        </span>
      ),
    },
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
                <ArrowRightLeft className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Unit Conversion
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage conversion rates between units
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
                  placeholder="Search conversions..."
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
                  setEditItem({
                    id: 0,
                    from_uom_id: 0,
                    to_uom_id: 0,
                    factor: 1,
                  } as UomConversion);
                  setShowModal(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Add Conversion
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <DataTable<UomConversion>
            data={UomConversions}
            columns={columns}
            loading={loading}
            showSelection={false}
            searchable={false}
            showActions={false}
          />
        </div>
      </div>

      {/* Modal */}
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
    </div>
  );
}