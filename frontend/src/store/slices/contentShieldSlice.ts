import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ContentShieldReport, ContentShieldRequest } from '../../types';
import { contentShieldApi } from '../../services/api';

interface ContentShieldState {
  report: ContentShieldReport | null;
  loading: boolean;
  error: string | null;
}

const initialState: ContentShieldState = {
  report: null,
  loading: false,
  error: null,
};

export const analyzeContentShield = createAsyncThunk<ContentShieldReport, ContentShieldRequest>(
  'contentShield/analyze',
  async (request, { rejectWithValue }) => {
    try {
      return await contentShieldApi.analyze(request);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Content shield analysis failed');
    }
  }
);

const contentShieldSlice = createSlice({
  name: 'contentShield',
  initialState,
  reducers: {
    clearShieldReport(state) {
      state.report = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(analyzeContentShield.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(analyzeContentShield.fulfilled, (state, action: PayloadAction<ContentShieldReport>) => {
      state.loading = false;
      state.report = action.payload;
    });
    builder.addCase(analyzeContentShield.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearShieldReport } = contentShieldSlice.actions;
export default contentShieldSlice.reducer;
