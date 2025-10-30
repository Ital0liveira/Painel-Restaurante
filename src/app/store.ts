import { configureStore } from '@reduxjs/toolkit';
import checkpadsReducer from './checkpadsSlice';
import areasReducer from './areasSlice'; 
import filtersReducer from './filtersSlice';
import createOrderSheetReducer from './createOrderSheetSlice';
import uiReducer from './uiSlice';
import orderSheetsReducer from './orderSheetsSlice';

export const store = configureStore({
  reducer: {
    checkpads: checkpadsReducer,
    areas: areasReducer, 
    filters: filtersReducer,
    createOrderSheet: createOrderSheetReducer,
    ui: uiReducer,
    orderSheets: orderSheetsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;