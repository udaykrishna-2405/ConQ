import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CreatorScorecard, CreatorScorecardRequest } from '../../types';
import { creatorScorecardApi } from '../../services/api';

interface CreatorScorecardState {
  scorecard: CreatorScorecard | null;
  loading: boolean;
  error: string | null;
}

const initialState: CreatorScorecardState = {
  scorecard: null,
  loading: false,
  error: null,
};

export const generateScorecard = createAsyncThunk<CreatorScorecard, CreatorScorecardRequest>(
  'creatorScorecard/generate',
  async (request, { rejectWithValue }) => {
    try {
      return await creatorScorecardApi.generate(request);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Scorecard generation failed');
    }
  }
);

const creatorScorecardSlice = createSlice({
  name: 'creatorScorecard',
  initialState,
  reducers: {
    clearScorecard(state) {
      state.scorecard = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(generateScorecard.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(generateScorecard.fulfilled, (state, action: PayloadAction<CreatorScorecard>) => {
      state.loading = false;
      state.scorecard = action.payload;
    });
    builder.addCase(generateScorecard.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearScorecard } = creatorScorecardSlice.actions;
export default creatorScorecardSlice.reducer;
