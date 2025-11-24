import axiosClient from "../../../api/axiosClient";

export const getCurrencies = async () => {
 return axiosClient.get("/master-data/currencies");
};

export const getRealCurrencies = async () => {
  return axiosClient.get("/master-data/currencies/real");
};

export const addCurrency = async (code: string) => {
  return axiosClient.post("/master-data/currencies", { code });
};

export const getExchangeRates = async (date?: string) => {
  return axiosClient.get(
    `/master-data/currencies/rates${date ? `?date=${date}` : ""}`
  );
};

export const updateExchangeRates = async () => {
  return axiosClient.post("/master-data/currencies/rates/update");
};