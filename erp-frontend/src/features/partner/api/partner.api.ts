import axiosClient from "../../../api/axiosClient";
import { Partner, PartnerType, PartnerStatus } from "../store/partner.types";

export interface PartnerQuery {
  type?: PartnerType;       // "customer" | "supplier" | "internal"
  status?: PartnerStatus;   // "active" | "inactive"
  search?: string;          // tên / SĐT / email / MST
}

export const partnerApi = {
  /** Lấy danh sách đối tác (có filter) */
  getAllPartners: async (params?: PartnerQuery): Promise<Partner[]> => {
    const res = await axiosClient.get("/partners", { params });
    return res.data;
  },

  /** Lấy 1 đối tác theo id */
  getPartnerById: async (id: number): Promise<Partner> => {
    const res = await axiosClient.get(`/partners/${id}`);
    return res.data;
  },

  /** Tạo mới đối tác */
  createPartner: async (data: Partial<Partner>): Promise<Partner> => {
    const res = await axiosClient.post("/partners", data);
    return res.data;
  },

  /** Cập nhật đối tác */
  updatePartner: async (id: number, data: Partial<Partner>): Promise<Partner> => {
    const res = await axiosClient.put(`/partners/${id}`, data);
    return res.data;
  },

  /** Xóa đối tác */
  deletePartner: async (id: number): Promise<void> => {
    await axiosClient.delete(`/partners/${id}`);
  },
};
