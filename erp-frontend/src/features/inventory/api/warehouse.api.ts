import axiosClient from "../../../api/axiosClient";
export const warehouseApi = {
  getAllWarehouses: async () => {
    const res = await axiosClient.get("/warehouse");
    return res.data;
  },
};
