import { createSlice } from '@reduxjs/toolkit';
import { Area } from './interfaces';
import { mockAreas } from './data'; // Agora isso vai funcionar

// O estado inicial usa os dados mockados
const initialState: Area[] = mockAreas;

const areasSlice = createSlice({
  name: 'areas',
  initialState,
  reducers: {
    // Ações futuras (addArea, etc.)
  },
});

export default areasSlice.reducer;