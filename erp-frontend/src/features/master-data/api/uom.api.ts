import axiosClient from "../../../api/axiosClient";
import { CreateUomDto, UpdateUomDto } from "../dto/uom.dto";
const UOM_URL = "/master-data/uoms";
export const searchUoms = (search?: string) => {
  return axiosClient.get(`${UOM_URL}/search`, { params: { search } });
};
export const getAllUoms = () => {
  return axiosClient.get(`${UOM_URL}`);
};
export const getUomById = (id: number) => {
  return axiosClient.get(`${UOM_URL}/${id}`);
};

export const createUom = (data: CreateUomDto) => {
  return axiosClient.post(UOM_URL, data);
};

export const updateUom = (id: number, data: UpdateUomDto) => {
  return axiosClient.put(`${UOM_URL}/${id}`, data);
};

export const deleteUom = (id: number) => {
  return axiosClient.delete(`${UOM_URL}/${id}`);
};