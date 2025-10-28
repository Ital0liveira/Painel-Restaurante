import { configureStore } from '@reduxjs/toolkit';
import areasReducer from './areasSlice';
import checkpadsReducer from './checkpadsSlice';
import ordersheetsReducer from './ordersheetsSlice';

export const store = configureStore({
  reducer: {
    areas: areasReducer,
    checkpads: checkpadsReducer,
    ordersheets: ordersheetsReducer,
  },
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;