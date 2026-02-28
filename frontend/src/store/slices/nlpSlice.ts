import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { NlpResult, NlpAnalyzeRequest } from '../../types';
import { nlpApi } from '../../services/api';

interface NlpState {
  result: NlpResult | null;
  loading: boolean;
  error: string | null;
}

const initialState: NlpState = {
  result: null,
  loading: false,
  error: null,
};

export const analyzeText = createAsyncThunk<NlpResult, NlpAnalyzeRequest>(
  'nlp/analyze',
  async (request, { rejectWithValue }) => {
    try {
      return await nlpApi.analyze(request);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'NLP analysis failed');
    }
  }
);

const nlpSlice = createSlice({
  name: 'nlp',
  initialState,
  reducers: {
    clearNlpResult(state) {
      state.result = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(analyzeText.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(analyzeText.fulfilled, (state, action: PayloadAction<NlpResult>) => {
      state.loading = false;
      state.result = action.payload;
    });
    builder.addCase(analyzeText.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearNlpResult } = nlpSlice.actions;
export default nlpSlice.reducer;
