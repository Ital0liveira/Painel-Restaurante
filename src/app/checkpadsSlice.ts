import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import { Checkpad } from './interfaces'; 
import { mockCheckpads } from './data'; 
import { RootState } from './store'; 

const checkpadsAdapter = createEntityAdapter<Checkpad>({
   selectId: (checkpad) => checkpad.hash,
});

const initialState = checkpadsAdapter.setAll(
  checkpadsAdapter.getInitialState(),
  mockCheckpads 
);

export const checkpadsSlice = createSlice({
  name: 'checkpads',
  initialState,
  reducers: {
    // Ações (add, update, remove) podem ser definidas aqui
  },
});

export const {
  selectAll: selectAllCheckpads, 
  selectById: selectCheckpadById, 
} = checkpadsAdapter.getSelectors((state: RootState) => state.checkpads);

export default checkpadsSlice.reducer;