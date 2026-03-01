import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ScheduleResult, HashtagResult, ABTestResult, ScheduleRequest, HashtagRequest, ABTestRequest } from '../../types';
import { automationApi } from '../../services/api';

interface AutomationState {
  scheduleResult: ScheduleResult | null;
  hashtagResult: HashtagResult | null;
  abTestResult: ABTestResult | null;
  loading: boolean;
  error: string | null;
}

const initialState: AutomationState = {
  scheduleResult: null,
  hashtagResult: null,
  abTestResult: null,
  loading: false,
  error: null,
};

export const generateSchedule = createAsyncThunk<ScheduleResult, ScheduleRequest>(
  'automation/schedule',
  async (request, { rejectWithValue }) => {
    try {
      return await automationApi.schedule(request);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Schedule generation failed');
    }
  }
);

export const generateHashtags = createAsyncThunk<HashtagResult, HashtagRequest>(
  'automation/hashtags',
  async (request, { rejectWithValue }) => {
    try {
      return await automationApi.hashtags(request);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Hashtag generation failed');
    }
  }
);

export const runABTest = createAsyncThunk<ABTestResult, ABTestRequest>(
  'automation/abTest',
  async (request, { rejectWithValue }) => {
    try {
      return await automationApi.abTest(request);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'A/B test failed');
    }
  }
);

const automationSlice = createSlice({
  name: 'automation',
  initialState,
  reducers: {
    clearAutomationResult(state) {
      state.scheduleResult = null;
      state.hashtagResult = null;
      state.abTestResult = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(generateSchedule.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(generateSchedule.fulfilled, (state, action: PayloadAction<ScheduleResult>) => {
      state.loading = false;
      state.scheduleResult = action.payload;
    });
    builder.addCase(generateSchedule.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    builder.addCase(generateHashtags.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(generateHashtags.fulfilled, (state, action: PayloadAction<HashtagResult>) => {
      state.loading = false;
      state.hashtagResult = action.payload;
    });
    builder.addCase(generateHashtags.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    builder.addCase(runABTest.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(runABTest.fulfilled, (state, action: PayloadAction<ABTestResult>) => {
      state.loading = false;
      state.abTestResult = action.payload;
    });
    builder.addCase(runABTest.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearAutomationResult } = automationSlice.actions;
export default automationSlice.reducer;
