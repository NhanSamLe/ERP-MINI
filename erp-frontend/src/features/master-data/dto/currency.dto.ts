export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
}

// export interface ExchangeRate {
//   id: number;
//   rate: string;
//   valid_date: string;
//   baseCurrency: { code: string };
//   quoteCurrency: { code: string };
// }
export interface ExchangeRate {
  id: number;
  baseCurrency: { code: string };
  quoteCurrency: { code: string };
  rate: number;
  valid_date: string;
}

