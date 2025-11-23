import { Tax} from "../../../dto/tax.dto";

export interface TaxState {
  Taxes: Tax[];
  loading: boolean;
  error: string | null;
}
