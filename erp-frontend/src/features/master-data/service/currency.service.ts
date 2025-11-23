import * as api from "../api/currency.api";

export async function getCurrencies(){
    const res =  await api.getCurrencies();
    return res.data.currencies;
}
export async function getRealCurrencies(){
    const res = await api.getRealCurrencies();
    return res.data;
}
export async function getExchangeRates (date?: string){
    const res = await api.getExchangeRates(date);
     return res.data;
}
export async function addCurrency(code: string){
    const res = await api.addCurrency(code);
    return res.data;
}
export async function updateExchangeRates(){
    const res =  await api.updateExchangeRates();
    return res.data;
}