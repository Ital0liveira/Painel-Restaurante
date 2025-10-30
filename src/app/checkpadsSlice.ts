import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import { Checkpad } from './interfaces'; 
import { mockCheckpads } from './data'; 
import type { RootState } from './store';

const checkpadsAdapter = createEntityAdapter<Checkpad>();

const initialState = checkpadsAdapter.setAll(
  checkpadsAdapter.getInitialState(),
  mockCheckpads 
);

export const checkpadsSlice = createSlice({
  name: 'checkpads',
  initialState,
  reducers: {
    activateCheckpad: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      const existing = state.entities[id];
      if (!existing) return;
      checkpadsAdapter.updateOne(state, {
        id,
        changes: {
          activity: 'active',
          subtotal: existing.subtotal ?? 0,
          numberOfCustomers: existing.numberOfCustomers ?? 1,
          idleTime: 0,
          lastOrderCreated: new Date().toISOString(),
        },
      });
    },
    addOrderSheetToCheckpad: (
      state,
      action: PayloadAction<{ checkpadId: number; orderSheetId: number }>
    ) => {
      const { checkpadId, orderSheetId } = action.payload;
      const existing = state.entities[checkpadId];
      if (!existing) return;

      const currentOrderSheetIds = existing.orderSheetIds ?? [];
      if (currentOrderSheetIds.includes(orderSheetId)) return;

      checkpadsAdapter.updateOne(state, {
        id: checkpadId,
        changes: {
          orderSheetIds: [...currentOrderSheetIds, orderSheetId],
          lastOrderCreated: new Date().toISOString(),
          ...(existing.activity === 'empty' && {
            activity: 'active',
            idleTime: 0,
          }),
        },
      });
    },
  },
});

export const {
  selectAll: selectAllCheckpads, 
  selectById: selectCheckpadById, 
} = checkpadsAdapter.getSelectors((state: RootState) => state.checkpads);


export const { activateCheckpad, addOrderSheetToCheckpad } =
  checkpadsSlice.actions;

export default checkpadsSlice.reducer;