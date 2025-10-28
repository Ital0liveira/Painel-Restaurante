
import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import { Checkpad } from './interfaces';
import { mockCheckpads } from './data';
import { RootState } from './index'; 


const checkpadsAdapter = createEntityAdapter<Checkpad>();

const initialState = checkpadsAdapter.setAll(
  checkpadsAdapter.getInitialState(),
  mockCheckpads 
);

export const checkpadsSlice = createSlice({
  name: 'checkpads',
  initialState,
  reducers: {
  },
});


export const {
  selectAll: selectAllCheckpads, 
  selectById: selectCheckpadById, 
} = checkpadsAdapter.getSelectors((state: RootState) => state.checkpads);

export default checkpadsSlice.reducer;