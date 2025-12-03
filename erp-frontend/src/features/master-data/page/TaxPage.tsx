import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchAllTaxRatesThunk,
  createTaxRateThunk,
  updateTaxRateThunk,
  deleteTaxRateThunk,
} from "../store/master-data/tax/tax.thunks";

import { Tax, CreateTaxRateDto, UpdateTaxRateDto } from "../dto/tax.dto";
import { DataTable } from "../../../components/ui/DataTable";
import { Plus, RefreshCw, Search, Pencil, Trash2, Receipt } from "lucide-react";
import TaxFormModal from "../components/TaxFormModal";
import * as taxService from "../service/tax.service";
import { Column } from "../../../types/common";

// ... (import giữ nguyên, thêm Alert nếu chưa có)
import { Alert } from "../../../components/ui/Alert";  
import { clearTaxError } from "../store/master-data/tax/tax.slice";

export default function TaxPage() {
  const dispatch = useAppDispatch();
  const { Taxes, loading, error: reduxError } = useAppSelector((state) => state.tax);  // Lấy error từ Redux

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Tax | null>(null);
  const [searchText, setSearchText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);  // State local cho lỗi

  // Hiển thị lỗi từ Redux hoặc local
  const displayError = reduxError || localError;

  useEffect(() => {
    dispatch(fetchAllTaxRatesThunk());
  }, [dispatch]);

  const handleSearch = async () => {
    try {
      const data = await taxService.searchTaxRates(searchText);
      dispatch({
        type: fetchAllTaxRatesThunk.fulfilled.type,
        payload: data,
      });
      setLocalError(null);
    } catch (err) {
      setLocalError("Failed to search tax rates");
    }
  };

  const handleCreate = async (dto: CreateTaxRateDto) => {
    try {
      await dispatch(createTaxRateThunk(dto));
      setShowModal(false);
      setLocalError(null);
    } catch (err) {
      setLocalError("Failed to create tax rate");
    }
  };

  const handleUpdate = async (id: number, dto: UpdateTaxRateDto) => {
    try {
      await dispatch(updateTaxRateThunk({ id, data: dto }));
      setShowModal(false);
      setLocalError(null);
    } catch (err) {
      setLocalError("Failed to update tax rate");
    }
  };

  const handleDelete = async (row: Tax) => {
    if (window.confirm(`Delete tax "${row.name}" ?`)) {
      try {
        await dispatch(deleteTaxRateThunk(row.id));
        setLocalError(null);
      } catch (err) {
        setLocalError("Failed to delete tax rate");
      }
    }
  };


  const columns: Column<Tax>[] = [
    { key: "code", label: "Code", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { 
      key: "rate", 
      label: "Rate (%)", 
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">{row.rate}%</span>
      ),
    },
    { 
      key: "status", 
      label: "Status",
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.status}
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
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Tax Rates
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage your tax rates and configurations
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
                  placeholder="Search tax rates..."
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
                Add Tax
              </button>
            </div>
          </div>
        </div>
                   {/* Hiển thị lỗi nếu có */}
        {displayError && (
          <Alert type="error" message={displayError} onClose={() => {
            setLocalError(null);
            dispatch(clearTaxError());  // Clear Redux error
          }} />
        )}
        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <DataTable<Tax>
            data={Taxes}
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
        <TaxFormModal
          data={editItem}
          onClose={() => setShowModal(false)}
          onSubmitCreate={handleCreate}
          onSubmitUpdate={(id, data) => handleUpdate(id, data)}
        />
      )}
    </div>
  );
}