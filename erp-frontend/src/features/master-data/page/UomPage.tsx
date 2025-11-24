import React, { useEffect, useState } from "react";
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
import { Plus, RefreshCw, Search } from "lucide-react";
import * as uomService from "../service/uom.service";

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
    dispatch({ type: fetchAllUomsThunk.fulfilled.type, payload: data });
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
      dispatch(deleteUomThunk(row.id));
    }
  };

  const columns = [
    { key: "code", label: "Code", sortable: true },
    { key: "name", label: "Name", sortable: true },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-semibold">Unit of Measurement</h2>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search UOM..."
              className="border pl-9 pr-4 py-2 rounded-lg"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <button
            className="p-2 border rounded hover:bg-gray-100"
            onClick={handleSearch}
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            className="flex items-center bg-orange-500 text-white px-4 py-2 rounded-lg"
            onClick={() => {
              setEditItem(null);
              setShowModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add UOM
          </button>
        </div>
      </div>

      <DataTable
        data={Uoms}
        columns={columns}
        loading={loading}
        searchable={false}
        onEdit={(row) => {
          setEditItem(row);
          setShowModal(true);
        }}
        onDelete={handleDelete}
      />

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
