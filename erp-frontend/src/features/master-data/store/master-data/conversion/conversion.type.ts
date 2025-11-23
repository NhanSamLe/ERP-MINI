import { UomConversion } from "../../../dto/uom.dto";

export interface UomConversionState {
  UomConversions: UomConversion[];
  loading: boolean;
  error: string | null;
}