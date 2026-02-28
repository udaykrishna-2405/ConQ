import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import authReducer from '../../store/slices/authSlice';
import dashboardReducer from '../../store/slices/dashboardSlice';
import nlpReducer from '../../store/slices/nlpSlice';
import predictionReducer from '../../store/slices/predictionSlice';
import trendsReducer from '../../store/slices/trendsSlice';

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

describe('ProtectedRoute', () => {
  it('renders children when authenticated', () => {
    const store = makeStore({ token: 'valid-token' });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    const store = makeStore({ token: null });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
