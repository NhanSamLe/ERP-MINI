import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";

import {
  fetchAllConversionsThunk,
  createConversionThunk,
  updateConversionThunk,
  deleteConversionThunk,
} from "../store/master-data/conversion/conversion.thunks";

import {
  UomConversion,
  CreateUomConversionDto,
  UpdateUomConversionDto,
} from "../dto/uom.dto";

import { DataTable } from "../../../components/ui/DataTable";
import ConversionFormModal from "../components/ConversionFormModal";
import { Plus, Search } from "lucide-react";
import * as convService from "../service/uomConversion.service";

export default function UomConversionPage() {
  const dispatch = useAppDispatch();
  const { UomConversions, loading } = useAppSelector((state) => state.conversion);

  const [searchText, setSearchText] = useState("");
  const [editItem, setEditItem] = useState<UomConversion | null>(null);

  useEffect(() => {
    dispatch(fetchAllConversionsThunk());
  }, [dispatch]);

  const handleSearch = async () => {
    const data = await convService.searchUomConversions(searchText);
    dispatch({ type: fetchAllConversionsThunk.fulfilled.type, payload: data });
  };

  const handleSubmit = async (form: CreateUomConversionDto | UpdateUomConversionDto) => {
    if (editItem) {
      await dispatch(updateConversionThunk({ id: editItem.id, data: form }));
    } else {
      await dispatch(createConversionThunk(form as CreateUomConversionDto));
    }
    setEditItem(null);
  };

  const handleDelete = async (item: UomConversion) => {
    if (window.confirm(`Delete this conversion?`)) {
      await dispatch(deleteConversionThunk(item.id));
    }
  };

  const columns = [
    { key: "from_uom_id", label: "From UOM" },
    { key: "to_uom_id", label: "To UOM" },
    { key: "factor", label: "Factor" },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between mb-5">
        <h2 className="text-xl font-semibold">Unit Conversion</h2>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search UOM Code..."
            className="border px-3 py-2 rounded-lg"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button
            className="p-2 border rounded-lg hover:bg-gray-100"
            onClick={handleSearch}
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            className="flex items-center bg-orange-500 px-4 py-2 rounded-lg text-white"
            onClick={() => setEditItem({} as UomConversion)}
          >
            <Plus className="w-5 h-5 mr-2" />
            New
          </button>
        </div>
      </div>

      <DataTable
        data={UomConversions}
        columns={columns}
        loading={loading}
        onEdit={(row) => setEditItem(row)}
        showSelection={false}
        onDelete={handleDelete}
      />

      {editItem && (
        <ConversionFormModal
          data={editItem}
          onClose={() => setEditItem(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
