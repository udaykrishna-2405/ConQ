import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GrowthForecastReport, CompetitorBenchmarkReport, GrowthForecastRequest, CompetitorBenchmarkRequest } from '../../types';
import { growthIntelligenceApi } from '../../services/api';

interface GrowthIntelligenceState {
  forecastReport: GrowthForecastReport | null;
  benchmarkReport: CompetitorBenchmarkReport | null;
  loading: boolean;
  error: string | null;
}

const initialState: GrowthIntelligenceState = {
  forecastReport: null,
  benchmarkReport: null,
  loading: false,
  error: null,
};

export const generateForecast = createAsyncThunk<GrowthForecastReport, GrowthForecastRequest>(
  'growthIntelligence/forecast',
  async (request, { rejectWithValue }) => {
    try {
      return await growthIntelligenceApi.forecast(request);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Growth forecast generation failed');
    }
  }
);

export const generateBenchmark = createAsyncThunk<CompetitorBenchmarkReport, CompetitorBenchmarkRequest>(
  'growthIntelligence/benchmark',
  async (request, { rejectWithValue }) => {
    try {
      return await growthIntelligenceApi.benchmark(request);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Competitor benchmark generation failed');
    }
  }
);

const growthIntelligenceSlice = createSlice({
  name: 'growthIntelligence',
  initialState,
  reducers: {
    clearGrowthReport(state) {
      state.forecastReport = null;
      state.benchmarkReport = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(generateForecast.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(generateForecast.fulfilled, (state, action: PayloadAction<GrowthForecastReport>) => {
      state.loading = false;
      state.forecastReport = action.payload;
    });
    builder.addCase(generateForecast.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    builder.addCase(generateBenchmark.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(generateBenchmark.fulfilled, (state, action: PayloadAction<CompetitorBenchmarkReport>) => {
      state.loading = false;
      state.benchmarkReport = action.payload;
    });
    builder.addCase(generateBenchmark.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearGrowthReport } = growthIntelligenceSlice.actions;
export default growthIntelligenceSlice.reducer;
