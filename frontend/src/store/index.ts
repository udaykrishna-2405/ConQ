import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import nlpReducer from './slices/nlpSlice';
import predictionReducer from './slices/predictionSlice';
import trendsReducer from './slices/trendsSlice';
import aiStudioReducer from './slices/aiStudioSlice';
import monetizationReducer from './slices/monetizationSlice';
import contentShieldReducer from './slices/contentShieldSlice';
import growthIntelligenceReducer from './slices/growthIntelligenceSlice';
import automationReducer from './slices/automationSlice';
import creatorScorecardReducer from './slices/creatorScorecardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    nlp: nlpReducer,
    prediction: predictionReducer,
    trends: trendsReducer,
    aiStudio: aiStudioReducer,
    monetization: monetizationReducer,
    contentShield: contentShieldReducer,
    growthIntelligence: growthIntelligenceReducer,
    automation: automationReducer,
    creatorScorecard: creatorScorecardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
