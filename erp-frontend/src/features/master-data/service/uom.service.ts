import * as api from "../api/uom.api";
import { CreateUomDto, UpdateUomDto } from "../dto/uom.dto";

// 📍 Lấy danh sách + search
export async function searchUoms(search?: string) {
  const res = await api.searchUoms(search);
  return res.data;
}
// 📍 Lấy tất cả UOM
export async function getAllUoms() {
  const res = await api.getAllUoms();
  return res.data.data;
}
// 📍 Lấy chi tiết
export async function getUomById(id: number) {
  const res = await api.getUomById(id);
  return res.data;
}

// 📍 Thêm UOM
export async function createUom(data: CreateUomDto) {
  const res = await api.createUom(data);
  return res.data.data;
}

// 📍 Cập nhật UOM
export async function updateUom(id: number, data: UpdateUomDto) {
  const res = await api.updateUom(id, data);
  return res.data.data;
}

// 📍 Xóa UOM
export async function deleteUom(id: number) {
  const res = await api.deleteUom(id);
  return res.data;
}
