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
  AiStudioGenerateRequest,
  AiStudioVideoAssistRequest,
  GeneratedContent,
  VideoAssistResult,
  MonetizationRequest,
  MonetizationReport,
  ContentShieldRequest,
  ContentShieldReport,
  GrowthForecastRequest,
  GrowthForecastReport,
  CompetitorBenchmarkRequest,
  CompetitorBenchmarkReport,
  ScheduleRequest,
  ScheduleResult,
  HashtagRequest,
  HashtagResult,
  ABTestRequest,
  ABTestResult,
  CreatorScorecardRequest,
  CreatorScorecard,
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

// ── AI Studio API ──

export const aiStudioApi = {
  generate: async (data: AiStudioGenerateRequest): Promise<GeneratedContent> => {
    const res = await apiClient.post('/ai-studio/generate', data);
    return res.data;
  },
  videoAssist: async (data: AiStudioVideoAssistRequest): Promise<VideoAssistResult> => {
    const res = await apiClient.post('/ai-studio/video-assist', data);
    return res.data;
  },
  getHistory: async (): Promise<{ history: unknown[] }> => {
    const res = await apiClient.get('/ai-studio/history');
    return res.data;
  },
};

// ── Monetization API ──

export const monetizationApi = {
  generateReport: async (data: MonetizationRequest): Promise<MonetizationReport> => {
    const res = await apiClient.post('/monetization/report', data);
    return res.data;
  },
};

// ── Content Shield API ──

export const contentShieldApi = {
  analyze: async (data: ContentShieldRequest): Promise<ContentShieldReport> => {
    const res = await apiClient.post('/content-shield/analyze', data);
    return res.data;
  },
};

// ── Growth Intelligence API ──

export const growthIntelligenceApi = {
  forecast: async (data: GrowthForecastRequest): Promise<GrowthForecastReport> => {
    const res = await apiClient.post('/growth-intelligence/forecast', data);
    return res.data;
  },
  benchmark: async (data: CompetitorBenchmarkRequest): Promise<CompetitorBenchmarkReport> => {
    const res = await apiClient.post('/growth-intelligence/benchmark', data);
    return res.data;
  },
};

// ── Automation API ──

export const automationApi = {
  schedule: async (data: ScheduleRequest): Promise<ScheduleResult> => {
    const res = await apiClient.post('/automation/schedule', data);
    return res.data;
  },
  hashtags: async (data: HashtagRequest): Promise<HashtagResult> => {
    const res = await apiClient.post('/automation/hashtags', data);
    return res.data;
  },
  abTest: async (data: ABTestRequest): Promise<ABTestResult> => {
    const res = await apiClient.post('/automation/ab-test', data);
    return res.data;
  },
};

// ── Creator Scorecard API ──

export const creatorScorecardApi = {
  generate: async (data: CreatorScorecardRequest): Promise<CreatorScorecard> => {
    const res = await apiClient.post('/creator-scorecard/generate', data);
    return res.data;
  },
};
