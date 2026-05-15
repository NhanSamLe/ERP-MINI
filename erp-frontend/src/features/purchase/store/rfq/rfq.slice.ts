import { createSlice } from "@reduxjs/toolkit";
import { RfqState } from "./rfq.types";
import {
  fetchRfqsThunk,
  fetchRfqByIdThunk,
  createRfqThunk,
  updateRfqThunk,
  deleteRfqThunk,
  sendRfqThunk,
  markRfqReceivedThunk,
  acceptRfqThunk,
  rejectRfqThunk,
  convertRfqToPoThunk,
  createRfqVersionThunk,
  compareRfqsThunk,
} from "./rfq.thunks";

const initialState: RfqState = {
  items: [],
  selected: null,
  compareResult: null,
  loading: false,
  actionLoading: false,
  error: null,
};

const rfqSlice = createSlice({
  name: "rfq",
  initialState,
  reducers: {
    clearSelected(state) {
      state.selected = null;
      state.loading = false;
      state.error = null;
    },
    clearCompare(state) {
      state.compareResult = null;
    },
  },
  extraReducers: (b) => {
    // fetchAll
    b.addCase(fetchRfqsThunk.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchRfqsThunk.fulfilled, (s, a) => {
      s.loading = false;
      s.items = a.payload;
    });
    b.addCase(fetchRfqsThunk.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload as string;
    });

    // fetchOne
    b.addCase(fetchRfqByIdThunk.pending, (s) => {
      s.loading = true;
    });
    b.addCase(fetchRfqByIdThunk.fulfilled, (s, a) => {
      s.loading = false;
      s.selected = a.payload;
    });
    b.addCase(fetchRfqByIdThunk.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload as string;
    });

    // create
    b.addCase(createRfqThunk.fulfilled, (s, a) => {
      s.items.unshift(a.payload);
    });

    // update
    b.addCase(updateRfqThunk.fulfilled, (s, a) => {
      s.items = s.items.map((r) => (r.id === a.payload.id ? a.payload : r));
      if (s.selected?.id === a.payload.id) s.selected = a.payload;
    });

    // delete
    b.addCase(deleteRfqThunk.fulfilled, (s, a) => {
      s.items = s.items.filter((r) => r.id !== a.payload);
    });

    // status transitions — all update selected + list
    const updateItem = (s: RfqState, payload: RfqState["selected"]) => {
      if (!payload) return;
      s.actionLoading = false;
      s.items = s.items.map((r) => (r.id === payload.id ? payload : r));
      if (s.selected?.id === payload.id) s.selected = payload;
    };

    [
      sendRfqThunk,
      markRfqReceivedThunk,
      acceptRfqThunk,
      rejectRfqThunk,
      createRfqVersionThunk,
    ].forEach((thunk) => {
      b.addCase(thunk.pending, (s) => {
        s.actionLoading = true;
      });
      b.addCase(thunk.fulfilled, (s, a) => updateItem(s, a.payload));
      b.addCase(thunk.rejected, (s, a) => {
        s.actionLoading = false;
        s.error = a.payload as string;
      });
    });

    b.addCase(convertRfqToPoThunk.pending, (s) => {
      s.actionLoading = true;
    });
    b.addCase(convertRfqToPoThunk.fulfilled, (s) => {
      s.actionLoading = false;
    });
    b.addCase(convertRfqToPoThunk.rejected, (s, a) => {
      s.actionLoading = false;
      s.error = a.payload as string;
    });

    // compare
    b.addCase(compareRfqsThunk.pending, (s) => {
      s.loading = true;
    });
    b.addCase(compareRfqsThunk.fulfilled, (s, a) => {
      s.loading = false;
      s.compareResult = a.payload;
    });
    b.addCase(compareRfqsThunk.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload as string;
    });
  },
});

export const { clearSelected, clearCompare } = rfqSlice.actions;
export default rfqSlice.reducer;
