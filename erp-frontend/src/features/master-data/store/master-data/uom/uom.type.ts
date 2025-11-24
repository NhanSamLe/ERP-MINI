import { Uom } from "../../../dto/uom.dto";
export interface UomState {
  Uoms: Uom[];
  loading: boolean;
  error: string | null;
}