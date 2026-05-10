import { createSlice } from "@reduxjs/toolkit";
import { PurchaseReturnState } from "./purchaseReturn.types";
import {
  fetchPrasThunk,
  fetchPraByIdThunk,
  createPraThunk,
  submitPraThunk,
  approvePraThunk,
  rejectPraThunk,
  fetchReturnsThunk,
  fetchReturnByIdThunk,
  createReturnThunk,
  shipReturnThunk,
  confirmReturnThunk,
  completeReturnThunk,
  fetchDebitNotesThunk,
  fetchDebitNoteByIdThunk,
  createDebitNoteFromReturnThunk,
  postDebitNoteThunk,
  cancelDebitNoteThunk,
  fetchVendorRefundsThunk,
  fetchVendorRefundByIdThunk,
  createVendorRefundThunk,
  postVendorRefundThunk,
} from "./purchaseReturn.thunks";

const initialState: PurchaseReturnState = {
  pras: [],
  selectedPra: null,
  returns: [],
  selectedReturn: null,
  debitNotes: [],
  selectedDebitNote: null,
  vendorRefunds: [],
  selectedVendorRefund: null,
  loading: false,
  actionLoading: false,
  error: null,
};

const purchaseReturnSlice = createSlice({
  name: "purchaseReturn",
  initialState,
  reducers: {
    clearSelectedPra(s) {
      s.selectedPra = null;
    },
    clearSelectedReturn(s) {
      s.selectedReturn = null;
    },
    clearSelectedDebitNote(s) {
      s.selectedDebitNote = null;
    },
    clearSelectedVendorRefund(s) {
      s.selectedVendorRefund = null;
    },
  },
  extraReducers: (b) => {
    // PRA
    b.addCase(fetchPrasThunk.pending, (s) => {
      s.loading = true;
    });
    b.addCase(fetchPrasThunk.fulfilled, (s, a) => {
      s.loading = false;
      s.pras = a.payload;
    });
    b.addCase(fetchPrasThunk.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload as string;
    });
    b.addCase(fetchPraByIdThunk.fulfilled, (s, a) => {
      s.selectedPra = a.payload;
    });
    b.addCase(createPraThunk.fulfilled, (s, a) => {
      s.pras.unshift(a.payload);
    });
    [submitPraThunk, approvePraThunk, rejectPraThunk].forEach((t) => {
      b.addCase(t.pending, (s) => {
        s.actionLoading = true;
      });
      b.addCase(t.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.pras = s.pras.map((p) => (p.id === a.payload.id ? a.payload : p));
        if (s.selectedPra?.id === a.payload.id) s.selectedPra = a.payload;
      });
      b.addCase(t.rejected, (s, a) => {
        s.actionLoading = false;
        s.error = a.payload as string;
      });
    });

    // Returns
    b.addCase(fetchReturnsThunk.pending, (s) => {
      s.loading = true;
    });
    b.addCase(fetchReturnsThunk.fulfilled, (s, a) => {
      s.loading = false;
      s.returns = a.payload;
    });
    b.addCase(fetchReturnsThunk.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload as string;
    });
    b.addCase(fetchReturnByIdThunk.fulfilled, (s, a) => {
      s.selectedReturn = a.payload;
    });
    b.addCase(createReturnThunk.fulfilled, (s, a) => {
      s.returns.unshift(a.payload);
    });
    [shipReturnThunk, confirmReturnThunk, completeReturnThunk].forEach((t) => {
      b.addCase(t.pending, (s) => {
        s.actionLoading = true;
      });
      b.addCase(t.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.returns = s.returns.map((r) =>
          r.id === a.payload.id ? a.payload : r,
        );
        if (s.selectedReturn?.id === a.payload.id) s.selectedReturn = a.payload;
      });
      b.addCase(t.rejected, (s, a) => {
        s.actionLoading = false;
        s.error = a.payload as string;
      });
    });

    // Debit Notes
    b.addCase(fetchDebitNotesThunk.pending, (s) => {
      s.loading = true;
    });
    b.addCase(fetchDebitNotesThunk.fulfilled, (s, a) => {
      s.loading = false;
      s.debitNotes = a.payload;
    });
    b.addCase(fetchDebitNotesThunk.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload as string;
    });
    b.addCase(fetchDebitNoteByIdThunk.fulfilled, (s, a) => {
      s.selectedDebitNote = a.payload;
    });
    b.addCase(createDebitNoteFromReturnThunk.fulfilled, (s, a) => {
      s.debitNotes.unshift(a.payload);
      s.selectedDebitNote = a.payload;
    });
    [postDebitNoteThunk, cancelDebitNoteThunk].forEach((t) => {
      b.addCase(t.pending, (s) => {
        s.actionLoading = true;
      });
      b.addCase(t.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.debitNotes = s.debitNotes.map((d) =>
          d.id === a.payload.id ? a.payload : d,
        );
        if (s.selectedDebitNote?.id === a.payload.id)
          s.selectedDebitNote = a.payload;
      });
      b.addCase(t.rejected, (s, a) => {
        s.actionLoading = false;
        s.error = a.payload as string;
      });
    });

    // Vendor Refunds
    b.addCase(fetchVendorRefundsThunk.pending, (s) => {
      s.loading = true;
    });
    b.addCase(fetchVendorRefundsThunk.fulfilled, (s, a) => {
      s.loading = false;
      s.vendorRefunds = a.payload;
    });
    b.addCase(fetchVendorRefundsThunk.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload as string;
    });
    b.addCase(fetchVendorRefundByIdThunk.fulfilled, (s, a) => {
      s.selectedVendorRefund = a.payload;
    });
    b.addCase(createVendorRefundThunk.fulfilled, (s, a) => {
      s.vendorRefunds.unshift(a.payload);
    });
    b.addCase(postVendorRefundThunk.pending, (s) => {
      s.actionLoading = true;
    });
    b.addCase(postVendorRefundThunk.fulfilled, (s, a) => {
      s.actionLoading = false;
      s.vendorRefunds = s.vendorRefunds.map((r) =>
        r.id === a.payload.id ? a.payload : r,
      );
      if (s.selectedVendorRefund?.id === a.payload.id)
        s.selectedVendorRefund = a.payload;
    });
    b.addCase(postVendorRefundThunk.rejected, (s, a) => {
      s.actionLoading = false;
      s.error = a.payload as string;
    });
  },
});

export const {
  clearSelectedPra,
  clearSelectedReturn,
  clearSelectedDebitNote,
  clearSelectedVendorRefund,
} = purchaseReturnSlice.actions;
export default purchaseReturnSlice.reducer;
