import { createSlice } from '@reduxjs/toolkit';
import { Area } from './interfaces';
import { mockAreas } from './data'; 


const initialState: Area[] = mockAreas;

const areasSlice = createSlice({
  name: 'areas',
  initialState,
  reducers: {
  
  },
});

export default areasSlice.reducer;