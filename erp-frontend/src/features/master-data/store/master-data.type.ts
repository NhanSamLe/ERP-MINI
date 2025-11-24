import {Currency} from "../dto/currency.dto"

export interface MasterDataState {
  currencies: Currency[];
  currenciesReal: Currency[];
  loading: boolean;
  error?: string | null;
}