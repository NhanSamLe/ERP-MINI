import * as api from "../api/uomConversion.api";
import {
  CreateUomConversionDto,
  UpdateUomConversionDto,
} from "../dto/uom.dto";

// 📍 Search theo UOM code
export async function searchUomConversions(search?: string) {
  const res = await api.searchUomConversions(search);
  // BE thường trả { data: [...] }
  return res.data.data;            // ⬅️ trả về mảng UomConversion
}

// 📍 Lấy tất cả quy đổi
export async function getAllUomConversions() {
  const res = await api.getAllUomConversions();
  return res.data.data;           // ⬅️ trả về UomConversion[]
}

// 📍 Thêm quy đổi
export async function createUomConversion(data: CreateUomConversionDto) {
  const res = await api.createUomConversion(data);
  return res.data.data;           // ⬅️ trả về 1 UomConversion
}

// 📍 Cập nhật quy đổi
export async function updateUomConversion(
  id: number,
  data: UpdateUomConversionDto
) {
  const res = await api.updateUomConversion(id, data);
  return res.data.data;           // ⬅️ trả về 1 UomConversion đã cập nhật
}

// 📍 Xóa quy đổi
export async function deleteUomConversion(id: number) {
  await api.deleteUomConversion(id); // không cần trả gì
}
