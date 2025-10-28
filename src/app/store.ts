import { configureStore } from '@reduxjs/toolkit';
import checkpadsReducer from './checkpadsSlice';
import areasReducer from './areasSlice'; // 1. Importe o novo reducer

export const store = configureStore({
  reducer: {
    checkpads: checkpadsReducer,
    areas: areasReducer, // 2. Adicione o reducer aqui
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;