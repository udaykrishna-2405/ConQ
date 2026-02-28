import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DashboardResponse } from '../../types';
import { analyticsApi } from '../../services/api';

interface DashboardState {
  data: DashboardResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchDashboard = createAsyncThunk<DashboardResponse>(
  'dashboard/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await analyticsApi.getDashboard();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to load dashboard');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboard(state) {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchDashboard.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDashboard.fulfilled, (state, action: PayloadAction<DashboardResponse>) => {
      state.loading = false;
      state.data = action.payload;
    });
    builder.addCase(fetchDashboard.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
