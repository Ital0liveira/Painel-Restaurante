import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import { OrderSheet } from './interfaces';
import { mockOrderSheets } from './data';
import type { RootState } from './store';

const orderSheetsAdapter = createEntityAdapter<OrderSheet>();

const initialState = orderSheetsAdapter.setAll(
  orderSheetsAdapter.getInitialState(),
  mockOrderSheets
);

export interface CreateOrderSheetPayload {
  id: number;
  mainIdentifier: string;
  customerName?: string;
  customerPhone?: string;
  checkpadId: number;
  checkpadHash: string;
  checkpadIdentifier: string;
  numberOfCustomers: number;
  author?: OrderSheet['author'];
}

export const orderSheetsSlice = createSlice({
  name: 'orderSheets',
  initialState,
  reducers: {
    addOrderSheet: (state, action: PayloadAction<CreateOrderSheetPayload>) => {
      const payload = action.payload;
      const author = payload.author ?? {
        id: 127,
        name: 'Guilherme 2',
        type: 'seller',
      };

      const newOrderSheet: OrderSheet = {
        id: payload.id,
        author,
        opened: new Date().toISOString(),
        checkpad: {
          id: payload.checkpadId,
          hash: payload.checkpadHash,
          identifier: payload.checkpadIdentifier,
        },
        subtotal: 0,
        mainIdentifier: payload.mainIdentifier,
        customerName: payload.customerName,
        numberOfCustomers: payload.numberOfCustomers,
      };

      orderSheetsAdapter.addOne(state, newOrderSheet);
    },
    updateOrderSheet: (
      state,
      action: PayloadAction<{ id: number; changes: Partial<OrderSheet> }>
    ) => {
      orderSheetsAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload.changes,
      });
    },
    removeOrderSheet: (state, action: PayloadAction<number>) => {
      orderSheetsAdapter.removeOne(state, action.payload);
    },
  },
});

export const { addOrderSheet, updateOrderSheet, removeOrderSheet } =
  orderSheetsSlice.actions;

export const {
  selectAll: selectAllOrderSheets,
  selectById: selectOrderSheetById,
} = orderSheetsAdapter.getSelectors((state: RootState) => state.orderSheets);

export default orderSheetsSlice.reducer;

