import { Rfq, RfqCompareResult } from "../../api/rfq.api";

export interface RfqState {
  items: Rfq[];
  selected: Rfq | null;
  compareResult: RfqCompareResult | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

export type { Rfq, RfqCompareResult };
