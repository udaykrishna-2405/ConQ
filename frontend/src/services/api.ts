import axios from 'axios';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  UpdateProfileRequest,
  NlpAnalyzeRequest,
  NlpResult,
  PredictionRequest,
  ViralityPrediction,
  TrendQuery,
  TrendResponse,
  DashboardResponse,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('conq_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('conq_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/login', data);
    return res.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },

  getProfile: async (): Promise<User> => {
    const res = await apiClient.get('/users/me');
    return res.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const res = await apiClient.put('/users/me', data);
    return res.data;
  },
};

// ── NLP API ──

export const nlpApi = {
  analyze: async (data: NlpAnalyzeRequest): Promise<NlpResult> => {
    const res = await apiClient.post('/nlp/analyze', data);
    return res.data;
  },
};

// ── Prediction API ──

export const predictionApi = {
  predict: async (data: PredictionRequest): Promise<ViralityPrediction> => {
    const res = await apiClient.post('/prediction/virality', data);
    return res.data;
  },
};

// ── Trends API ──

export const trendsApi = {
  getTrends: async (query?: TrendQuery): Promise<TrendResponse> => {
    const params = new URLSearchParams();
    if (query?.region) params.set('region', query.region);
    if (query?.language) params.set('language', query.language);
    if (query?.category) params.set('category', query.category);
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.date) params.set('date', query.date);

    const res = await apiClient.get(`/trends?${params.toString()}`);
    return res.data;
  },
};

// ── Analytics API ──

export const analyticsApi = {
  getDashboard: async (): Promise<DashboardResponse> => {
    const res = await apiClient.get('/analytics/dashboard');
    return res.data;
  },
};
