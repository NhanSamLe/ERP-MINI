import { Currency } from "../../../dto/currency.dto";

export interface CurrencyState {
  currencies: Currency[];
  currenciesReal: Currency[];
  loading: boolean;
  error: string | null;
}
