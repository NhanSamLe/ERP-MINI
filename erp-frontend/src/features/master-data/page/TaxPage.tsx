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
import { Plus, RefreshCw } from "lucide-react";
import TaxFormModal from "../components/TaxFormModal";

export default function TaxPage() {
  const dispatch = useAppDispatch();
  const { Taxes, loading } = useAppSelector((state) => state.tax);

  const [modalData, setModalData] = useState<Tax | null>(null);

  useEffect(() => {
    dispatch(fetchAllTaxRatesThunk());
  }, [dispatch]);

  // 📌 CREATE
  const handleCreate = async (dto: CreateTaxRateDto) => {
    await dispatch(createTaxRateThunk(dto));
    setModalData(null);
  };

  // 📌 UPDATE
  const handleUpdate = async (id: number, dto: UpdateTaxRateDto) => {
    await dispatch(updateTaxRateThunk({ id, data: dto }));
    setModalData(null);
  };

  // 📌 DELETE
  const handleDelete = async (item: Tax) => {
    if (window.confirm(`Delete tax "${item.name}" ?`)) {
      await dispatch(deleteTaxRateThunk(item.id));
    }
  };

  const columns = [
    { key: "code", label: "Code", sortable: true },
    { key: "name", label: "Name" },
    { key: "rate", label: "Rate (%)", sortable: true },
    { key: "status", label: "Status" },
  ];

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto bg-white rounded-lg p-6 shadow-md">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">Tax Rates</h1>

          <div className="flex gap-2">
            <button
              className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:text-gray-900"
              onClick={() => dispatch(fetchAllTaxRatesThunk())}
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <button
              className="flex items-center gap-2 bg-orange-500 text-white rounded-lg px-4 py-2 hover:bg-orange-600"
              onClick={() => setModalData({} as Tax)}
            >
              <Plus className="w-5 h-5" />
              <span>Add Tax</span>
            </button>
          </div>
        </div>

        {/* DATA TABLE */}
        <DataTable
          data={Taxes}
          columns={columns}
          loading={loading}
          searchable
          searchKeys={["name", "code"]}
          onEdit={(row) => setModalData(row)}
          showSelection={false}
          onDelete={handleDelete}
        />
      </div>

      {/* MODAL */}
      {modalData && (
        <TaxFormModal
            data={modalData}
            onClose={() => setModalData(null)}
            onSubmitCreate={handleCreate}
            onSubmitUpdate={handleUpdate}
        />
        )}
    </div>
  );
}
