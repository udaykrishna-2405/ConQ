import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GeneratedContent, VideoAssistResult, AiStudioGenerateRequest, AiStudioVideoAssistRequest } from '../../types';
import { aiStudioApi } from '../../services/api';

interface AiStudioState {
  contentResult: GeneratedContent | null;
  videoResult: VideoAssistResult | null;
  loading: boolean;
  error: string | null;
}

const initialState: AiStudioState = {
  contentResult: null,
  videoResult: null,
  loading: false,
  error: null,
};

export const generateContent = createAsyncThunk<GeneratedContent, AiStudioGenerateRequest>(
  'aiStudio/generateContent',
  async (request, { rejectWithValue }) => {
    try {
      return await aiStudioApi.generate(request);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Content generation failed');
    }
  }
);

export const generateVideoAssist = createAsyncThunk<VideoAssistResult, AiStudioVideoAssistRequest>(
  'aiStudio/generateVideoAssist',
  async (request, { rejectWithValue }) => {
    try {
      return await aiStudioApi.videoAssist(request);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Video assist failed');
    }
  }
);

const aiStudioSlice = createSlice({
  name: 'aiStudio',
  initialState,
  reducers: {
    clearAiStudioResult(state) {
      state.contentResult = null;
      state.videoResult = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(generateContent.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(generateContent.fulfilled, (state, action: PayloadAction<GeneratedContent>) => {
      state.loading = false;
      state.contentResult = action.payload;
    });
    builder.addCase(generateContent.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    builder.addCase(generateVideoAssist.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(generateVideoAssist.fulfilled, (state, action: PayloadAction<VideoAssistResult>) => {
      state.loading = false;
      state.videoResult = action.payload;
    });
    builder.addCase(generateVideoAssist.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearAiStudioResult } = aiStudioSlice.actions;
export default aiStudioSlice.reducer;
