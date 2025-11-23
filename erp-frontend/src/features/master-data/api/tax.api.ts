import axiosClient from "../../../api/axiosClient";
import { CreateTaxRateDto, UpdateTaxRateDto } from "../dto/tax.dto";
const TAX_URL = "/master-data/taxes";

// 📍 Lấy danh sách + search + filter
export const searchTaxes = (search?: string, status?: string) => {
  return axiosClient.get(`${TAX_URL}/search`, {
    params: { search, status },
  });
};
// 📍 Lấy danh sách tất cả thuế
export const getAllTaxes = () => {
  return axiosClient.get(`${TAX_URL}`);
};
// 📍 Lấy danh sách thuế đang hoạt động
export const getActiveTaxes = () => {
  return axiosClient.get(`${TAX_URL}/active`);
};

// 📍 Lấy chi tiết 1 loại thuế
export const getTaxById = (id: number) => {
  return axiosClient.get(`${TAX_URL}/${id}`);
};

// 📍 Thêm thuế
export const createTax = (data: CreateTaxRateDto) => {
  return axiosClient.post(TAX_URL, data);
};

// 📍 Cập nhật thuế
export const updateTax = (id: number, data: UpdateTaxRateDto) => {
  return axiosClient.put(`${TAX_URL}/${id}`, data);
};

// 📍 Xóa thuế
export const deleteTax = (id: number) => {
  return axiosClient.delete(`${TAX_URL}/${id}`);
};

// 📍 Lọc theo loại thuế
export const filterTaxByType = (type: string) => {
  return axiosClient.get(`${TAX_URL}/filter/type`, { params: { type } });
};

// 📍 Lọc theo nghiệp vụ áp dụng
export const filterTaxByAppliesTo = (applies_to: string) => {
  return axiosClient.get(`${TAX_URL}/filter/applies-to`, { params: { applies_to } });
};