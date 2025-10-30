import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UiStatus = 'Ocupada' | 'Livre' | 'Reservada';

export interface FiltersState {
  statuses: UiStatus[]; // múltipla seleção
  attendantName: string | null; // filtrar por nome do atendente
  searchQuery: string; // busca por mesa/cliente/atendente
}

const initialState: FiltersState = {
  statuses: [],
  attendantName: null,
  searchQuery: '',
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setStatuses: (state, action: PayloadAction<UiStatus[]>) => {
      state.statuses = action.payload;
    },
    toggleStatus: (state, action: PayloadAction<UiStatus>) => {
      const s = action.payload;
      state.statuses = state.statuses.includes(s)
        ? state.statuses.filter(x => x !== s)
        : [...state.statuses, s];
    },
    setAttendantName: (state, action: PayloadAction<string | null>) => {
      state.attendantName = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearFilters: (state) => {
      state.statuses = [];
      state.attendantName = null;
      state.searchQuery = '';
    },
  },
});

export const { setStatuses, toggleStatus, setAttendantName, setSearchQuery, clearFilters } = filtersSlice.actions;

export default filtersSlice.reducer;


