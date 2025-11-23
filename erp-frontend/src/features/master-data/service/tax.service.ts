import * as api from "../api/tax.api";
import { CreateTaxRateDto, UpdateTaxRateDto} from "../dto/tax.dto";

// 📍 Danh sách + filter/search
export async function searchTaxRates(search?: string, status?: string) {
  const res = await api.searchTaxes(search, status);
  return res.data;
}
// 📍 Lấy tất cả tax
export async function getAllTaxRates() {
  const res = await api.getAllTaxes();
  return res.data.data;
}

// 📍 Lấy 1 tax theo ID
export async function getTaxRateById(id: number) {
  const res = await api.getTaxById(id);
  return res.data.data;
}

// 📍 Tạo tax mới
export async function createTaxRate(data: CreateTaxRateDto) {
  const res = await api.createTax(data);
  return res.data.data;
}

// 📍 Cập nhật tax
export async function updateTaxRate(id: number, data: UpdateTaxRateDto) {
  const res = await api.updateTax(id, data);
  return res.data.data;
}

// 📍 Xóa tax
export async function deleteTaxRate(id: number) {
  const res = await api.deleteTax(id);
  return res.data;
}

// 📍 Lấy danh sách tax đang active
export async function getActiveTaxRates() {
  const res = await api.getActiveTaxes();
  return res.data;
}

// 📍 Filter theo loại thuế
export async function filterTaxByType(type: string) {
  const res = await api.filterTaxByType(type);
  return res.data;
}

// 📍 Filter theo áp dụng sale / purchase / both
export async function filterTaxByAppliesTo(applies_to: string) {
  const res = await api.filterTaxByAppliesTo(applies_to);
  return res.data;
}
