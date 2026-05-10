import {
  Pra,
  PurchaseReturn,
  ApDebitNote,
  VendorRefund,
} from "../../api/purchaseReturn.api";

export interface PurchaseReturnState {
  pras: Pra[];
  selectedPra: Pra | null;
  returns: PurchaseReturn[];
  selectedReturn: PurchaseReturn | null;
  debitNotes: ApDebitNote[];
  selectedDebitNote: ApDebitNote | null;
  vendorRefunds: VendorRefund[];
  selectedVendorRefund: VendorRefund | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

export type { Pra, PurchaseReturn, ApDebitNote, VendorRefund };
