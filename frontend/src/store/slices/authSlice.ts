import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, LoginRequest, RegisterRequest, AuthResponse, UpdateProfileRequest } from '../../types';
import { authApi } from '../../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('conq_token'),
  loading: false,
  error: null,
};

export const login = createAsyncThunk<AuthResponse, LoginRequest>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      localStorage.setItem('conq_token', response.token);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Login failed');
    }
  }
);

export const register = createAsyncThunk<AuthResponse, RegisterRequest>(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authApi.register(data);
      localStorage.setItem('conq_token', response.token);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Registration failed');
    }
  }
);

export const fetchProfile = createAsyncThunk<User>(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await authApi.getProfile();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch profile');
    }
  }
);

export const completeOnboarding = createAsyncThunk<User, UpdateProfileRequest>(
  'auth/completeOnboarding',
  async (data, { rejectWithValue }) => {
    try {
      return await authApi.updateProfile(data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to save onboarding');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('conq_token');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(register.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Profile
    builder.addCase(fetchProfile.fulfilled, (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    });

    // Complete Onboarding
    builder.addCase(completeOnboarding.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(completeOnboarding.fulfilled, (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.user = action.payload;
    });
    builder.addCase(completeOnboarding.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
