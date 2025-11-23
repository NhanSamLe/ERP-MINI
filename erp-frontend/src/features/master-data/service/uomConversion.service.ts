import * as api from "../api/uomConversion.api";
import {
  CreateUomConversionDto,
  UpdateUomConversionDto,
} from "../dto/uom.dto";

// 📍 Lấy tất cả quy đổi + search theo UOM code
export async function searchUomConversions(search?: string) {
  const res = await api.searchUomConversions(search);
  return res.data;
}
// 📍 Lấy tất cả quy đổi
export async function getAllUomConversions() {
  const res = await api.getAllUomConversions();
  return res.data.data;
}

// 📍 Thêm quy đổi
export async function createUomConversion(data: CreateUomConversionDto) {
  const res = await api.createUomConversion(data);
  return res.data;
}

// 📍 Cập nhật quy đổi
export async function updateUomConversion(id: number, data: UpdateUomConversionDto) {
  const res = await api.updateUomConversion(id, data);
  return res.data;
}

// 📍 Xóa quy đổi
export async function deleteUomConversion(id: number) {
  const res = await api.deleteUomConversion(id);
  return res.data;
}
