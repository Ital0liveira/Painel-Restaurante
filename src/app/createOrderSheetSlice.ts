import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CreateOrderSheetStep1 {
  visibleIdentifier: string;
  customerName: string;
  customerPhone: string;
  attendantId: number | null;
}

export interface CreateOrderSheetState {
  isOpen: boolean;
  step: 1 | 2;
  step1: CreateOrderSheetStep1;
  step2: {
    areaId: number | null;
    checkpadId: number | null;
    notes: string;
  };
  errors: Partial<Record<keyof CreateOrderSheetStep1, string>>;
}

const initialState: CreateOrderSheetState = {
  isOpen: false,
  step: 1,
  step1: {
    visibleIdentifier: '',
    customerName: '',
    customerPhone: '',
    attendantId: null,
  },
  step2: {
    areaId: null,
    checkpadId: null,
    notes: '',
  },
  errors: {},
};

const createOrderSheetSlice = createSlice({
  name: 'createOrderSheet',
  initialState,
  reducers: {
    openCreateModal: (state) => {
      state.isOpen = true;
      state.step = 1;
    },
    closeCreateModal: (state) => {
      state.isOpen = false;
    },
    setStep1Field: (
      state,
      action: PayloadAction<{ field: keyof CreateOrderSheetStep1; value: string | number | null }>
    ) => {
      const { field, value } = action.payload;
      if (field === 'visibleIdentifier' || field === 'customerName' || field === 'customerPhone') {
        state.step1[field] = value as string;
      } else if (field === 'attendantId') {
        state.step1[field] = value as number | null;
      }
      if (state.errors[field]) {
        delete state.errors[field];
      }
    },
    setStep1Error: (
      state,
      action: PayloadAction<{ field: keyof CreateOrderSheetStep1; message: string }>
    ) => {
      state.errors[action.payload.field] = action.payload.message;
    },
    clearStep1Errors: (state) => {
      state.errors = {};
    },
    goToStep2: (state) => {
      state.step = 2;
    },
    backToStep1: (state) => {
      state.step = 1;
    },
    setStep2Field: (
      state,
      action: PayloadAction<{ field: 'areaId' | 'checkpadId' | 'notes'; value: number | string | null }>
    ) => {
      // Type guard updates
      const { field, value } = action.payload;
      if (field === 'areaId') state.step2.areaId = (value as number) ?? null;
      if (field === 'checkpadId') state.step2.checkpadId = (value as number) ?? null;
      if (field === 'notes') state.step2.notes = (value as string) ?? '';
    },
    resetCreateWizard: () => initialState,
  },
});

export const {
  openCreateModal,
  closeCreateModal,
  setStep1Field,
  setStep1Error,
  clearStep1Errors,
  goToStep2,
  backToStep1,
  setStep2Field,
  resetCreateWizard,
} = createOrderSheetSlice.actions;

export default createOrderSheetSlice.reducer;


