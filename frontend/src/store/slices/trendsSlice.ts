import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TrendResponse, TrendQuery } from '../../types';
import { trendsApi } from '../../services/api';

interface TrendsState {
  data: TrendResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: TrendsState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchTrends = createAsyncThunk<TrendResponse, TrendQuery | undefined>(
  'trends/fetch',
  async (query, { rejectWithValue }) => {
    try {
      return await trendsApi.getTrends(query);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch trends');
    }
  }
);

const trendsSlice = createSlice({
  name: 'trends',
  initialState,
  reducers: {
    clearTrends(state) {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchTrends.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTrends.fulfilled, (state, action: PayloadAction<TrendResponse>) => {
      state.loading = false;
      state.data = action.payload;
    });
    builder.addCase(fetchTrends.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearTrends } = trendsSlice.actions;
export default trendsSlice.reducer;
