import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NlpAnalyzer from './pages/NlpAnalyzer';
import ViralityPredictor from './pages/ViralityPredictor';
import Trends from './pages/Trends';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

const App: React.FC = () => {
  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/nlp"
          element={
            <ProtectedRoute>
              <Layout><NlpAnalyzer /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/predict"
          element={
            <ProtectedRoute>
              <Layout><ViralityPredictor /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/trends"
          element={
            <ProtectedRoute>
              <Layout><Trends /></Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default App;
