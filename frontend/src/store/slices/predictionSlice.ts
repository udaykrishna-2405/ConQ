import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ViralityPrediction, PredictionRequest } from '../../types';
import { predictionApi } from '../../services/api';

interface PredictionState {
  result: ViralityPrediction | null;
  loading: boolean;
  error: string | null;
}

const initialState: PredictionState = {
  result: null,
  loading: false,
  error: null,
};

export const predictVirality = createAsyncThunk<ViralityPrediction, PredictionRequest>(
  'prediction/predict',
  async (request, { rejectWithValue }) => {
    try {
      return await predictionApi.predict(request);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Prediction failed');
    }
  }
);

const predictionSlice = createSlice({
  name: 'prediction',
  initialState,
  reducers: {
    clearPrediction(state) {
      state.result = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(predictVirality.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(predictVirality.fulfilled, (state, action: PayloadAction<ViralityPrediction>) => {
      state.loading = false;
      state.result = action.payload;
    });
    builder.addCase(predictVirality.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearPrediction } = predictionSlice.actions;
export default predictionSlice.reducer;
