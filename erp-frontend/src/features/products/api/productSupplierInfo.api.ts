import axiosClient from "../../../api/axiosClient";
import {
  ProductSupplierInfo,
  ProductSupplierInfoInput,
} from "../store/product.types";

export const productSupplierInfoApi = {
  /**
   * Lấy danh sách nhà cung cấp của một product
   */
  getByProduct: async (productId: number): Promise<ProductSupplierInfo[]> => {
    const res = await axiosClient.get(`/product/${productId}/suppliers`);
    return res.data;
  },

  /**
   * Thêm nhà cung cấp cho product
   */
  create: async (
    productId: number,
    data: ProductSupplierInfoInput,
  ): Promise<ProductSupplierInfo> => {
    const res = await axiosClient.post(`/product/${productId}/suppliers`, data);
    return res.data;
  },

  /**
   * Cập nhật thông tin nhà cung cấp
   */
  update: async (
    productId: number,
    id: number,
    data: Partial<ProductSupplierInfoInput>,
  ): Promise<ProductSupplierInfo> => {
    const res = await axiosClient.put(
      `/product/${productId}/suppliers/${id}`,
      data,
    );
    return res.data;
  },

  /**
   * Xóa nhà cung cấp
   */
  delete: async (productId: number, id: number): Promise<void> => {
    await axiosClient.delete(`/product/${productId}/suppliers/${id}`);
  },

  /**
   * Đặt nhà cung cấp làm ưu tiên
   */
  setPreferred: async (
    productId: number,
    id: number,
  ): Promise<ProductSupplierInfo> => {
    const res = await axiosClient.patch(
      `/product/${productId}/suppliers/${id}/set-preferred`,
    );
    return res.data;
  },
};
