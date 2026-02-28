import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Navbar from '../../components/layout/Navbar';
import authReducer from '../../store/slices/authSlice';
import dashboardReducer from '../../store/slices/dashboardSlice';
import nlpReducer from '../../store/slices/nlpSlice';
import predictionReducer from '../../store/slices/predictionSlice';
import trendsReducer from '../../store/slices/trendsSlice';
import { I18nProvider } from '../../i18n';

function makeStore(authState = {}) {
  return configureStore({
    reducer: {
      auth: authReducer,
      dashboard: dashboardReducer,
      nlp: nlpReducer,
      prediction: predictionReducer,
      trends: trendsReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        loading: false,
        error: null,
        ...authState,
      },
    },
  });
}

function renderWithProviders(
  ui: React.ReactElement,
  { store = makeStore(), initialPath = '/dashboard' } = {}
) {
  return render(
    <Provider store={store}>
      <I18nProvider>
        <MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>
      </I18nProvider>
    </Provider>
  );
}

describe('Navbar', () => {
  it('renders brand name', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText('ConQ')).toBeInTheDocument();
    expect(screen.getByText('AI Growth OS')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('NLP Analyzer')).toBeInTheDocument();
    expect(screen.getByText('Virality Predictor')).toBeInTheDocument();
    expect(screen.getByText('Trends')).toBeInTheDocument();
  });

  it('renders logout button', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('displays user name when logged in', () => {
    const store = makeStore({
      user: { userId: '1', tenantId: 't1', email: 'a@b.com', name: 'Test User', role: 'creator', tier: 'pro', platforms: [] },
      token: 'abc123',
    });
    renderWithProviders(<Navbar />, { store });
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('pro')).toBeInTheDocument();
  });

  it('does not render on login page', () => {
    const { container } = renderWithProviders(<Navbar />, { initialPath: '/login' });
    expect(container.querySelector('.navbar')).not.toBeInTheDocument();
  });

  it('clears auth state on logout click', () => {
    const store = makeStore({
      user: { userId: '1', tenantId: 't1', email: 'a@b.com', name: 'Test', role: 'creator', tier: 'free', platforms: [] },
      token: 'abc123',
    });
    renderWithProviders(<Navbar />, { store });

    fireEvent.click(screen.getByText('Logout'));
    const state = store.getState();
    expect(state.auth.token).toBeNull();
    expect(state.auth.user).toBeNull();
  });
});
