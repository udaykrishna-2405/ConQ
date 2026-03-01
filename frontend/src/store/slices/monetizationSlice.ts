import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MonetizationReport, MonetizationRequest } from '../../types';
import { monetizationApi } from '../../services/api';

interface MonetizationState {
  report: MonetizationReport | null;
  loading: boolean;
  error: string | null;
}

const initialState: MonetizationState = {
  report: null,
  loading: false,
  error: null,
};

export const generateMonetizationReport = createAsyncThunk<MonetizationReport, MonetizationRequest>(
  'monetization/generateReport',
  async (request, { rejectWithValue }) => {
    try {
      return await monetizationApi.generateReport(request);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Monetization report generation failed');
    }
  }
);

const monetizationSlice = createSlice({
  name: 'monetization',
  initialState,
  reducers: {
    clearMonetizationReport(state) {
      state.report = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(generateMonetizationReport.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(generateMonetizationReport.fulfilled, (state, action: PayloadAction<MonetizationReport>) => {
      state.loading = false;
      state.report = action.payload;
    });
    builder.addCase(generateMonetizationReport.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearMonetizationReport } = monetizationSlice.actions;
export default monetizationSlice.reducer;
