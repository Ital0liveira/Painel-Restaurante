import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface UiState {
  toasts: Toast[];
  lastActivatedCheckpadId: number | null;
  highlightUntilTs: number | null;
  comandaDetails: { isOpen: boolean; orderId: number | null };
  orderOverrides: Record<number, { checkpadId?: number | null }>; // by orderId
}

const initialState: UiState = {
  toasts: [],
  lastActivatedCheckpadId: null,
  highlightUntilTs: null,
  comandaDetails: { isOpen: false, orderId: null },
  orderOverrides: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addToast: (state, action: PayloadAction<{ message: string; type?: ToastType }>) => {
      const id = Math.random().toString(36).slice(2);
      state.toasts.push({ id, message: action.payload.message, type: action.payload.type ?? 'info' });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
    setHighlight: (state, action: PayloadAction<{ checkpadId: number; durationMs?: number }>) => {
      state.lastActivatedCheckpadId = action.payload.checkpadId;
      state.highlightUntilTs = Date.now() + (action.payload.durationMs ?? 5000);
    },
    clearHighlight: (state) => {
      state.lastActivatedCheckpadId = null;
      state.highlightUntilTs = null;
    },
    openComandaDetails: (state, action: PayloadAction<{ orderId: number }>) => {
      state.comandaDetails = { isOpen: true, orderId: action.payload.orderId };
    },
    closeComandaDetails: (state) => {
      state.comandaDetails = { isOpen: false, orderId: null };
    },
    setOrderOverride: (state, action: PayloadAction<{ orderId: number; checkpadId: number | null }>) => {
      const { orderId, checkpadId } = action.payload;
      state.orderOverrides[orderId] = {
        ...(state.orderOverrides[orderId] ?? {}),
        checkpadId,
      };
    },
  },
});

export const { addToast, removeToast, setHighlight, clearHighlight, openComandaDetails, closeComandaDetails, setOrderOverride } = uiSlice.actions;

export default uiSlice.reducer;


