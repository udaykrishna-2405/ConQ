import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import nlpReducer from './slices/nlpSlice';
import predictionReducer from './slices/predictionSlice';
import trendsReducer from './slices/trendsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    nlp: nlpReducer,
    prediction: predictionReducer,
    trends: trendsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
