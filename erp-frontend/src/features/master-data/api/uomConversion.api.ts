import axiosClient from "../../../api/axiosClient";
import { CreateUomConversionDto,
  UpdateUomConversionDto, } from "../dto/uom.dto";

const CONVERSION_URL = "/master-data/uoms/conversions";

export const searchUomConversions = (search?: string) => {
  return axiosClient.get(`${CONVERSION_URL}/search`, {
    params: { search },
  });
};

export const getAllUomConversions = () => {
  return axiosClient.get(`${CONVERSION_URL}`);
};

export const createUomConversion = (data: CreateUomConversionDto) => {
  return axiosClient.post(CONVERSION_URL, data);
};

export const updateUomConversion = (id: number, data: UpdateUomConversionDto) => {
  return axiosClient.put(`${CONVERSION_URL}/${id}`, data);
};

export const deleteUomConversion = (id: number) => {
  return axiosClient.delete(`${CONVERSION_URL}/${id}`);
};