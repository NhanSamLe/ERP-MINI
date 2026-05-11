import axiosClient from "../../../api/axiosClient";

export const leaveApi = {
  getTypes: () =>
    axiosClient.get("/hrm/leave/types"),

  createType: (data: any) =>
    axiosClient.post("/hrm/leave/types", data),

  getAllocations: () =>
    axiosClient.get("/hrm/leave/allocations"),

  getRequests: () =>
    axiosClient.get("/hrm/leave/requests"),

  createRequest: (data: any) =>
    axiosClient.post("/hrm/leave/requests", data),

  approveRequest: (id: number) =>
    axiosClient.post(`/hrm/leave/requests/${id}/approve`),

  rejectRequest: (id: number) =>
    axiosClient.post(`/hrm/leave/requests/${id}/reject`),

  cancelRequest: (id: number) =>
    axiosClient.post(`/hrm/leave/requests/${id}/cancel`),
};