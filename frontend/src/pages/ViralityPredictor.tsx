import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { predictVirality, clearPrediction } from '../store/slices/predictionSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ViralityPredictor: React.FC = () => {
  const dispatch = useAppDispatch();
  const { result, loading, error } = useAppSelector((state) => state.prediction);

  const [form, setForm] = useState({
    title: '',
    description: '',
    tags: '',
    platform: 'youtube' as 'youtube' | 'instagram',
    followerCount: '',
    historicalEngagementRate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(predictVirality({
      title: form.title,
      description: form.description || undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()) : undefined,
      platform: form.platform,
      followerCount: form.followerCount ? parseInt(form.followerCount, 10) : undefined,
      historicalEngagementRate: form.historicalEngagementRate
        ? parseFloat(form.historicalEngagementRate)
        : undefined,
    }));
  };

  const handleClear = () => {
    setForm({ title: '', description: '', tags: '', platform: 'youtube', followerCount: '', historicalEngagementRate: '' });
    dispatch(clearPrediction());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const scoreColor = (score: number) => {
    if (score >= 70) return '#2ecc71';
    if (score >= 40) return '#f39c12';
    return '#e74c3c';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Virality Predictor</h2>
        <p className="page-subtitle">
          AI-powered content scoring with explainable feature analysis
        </p>
      </div>

      <form onSubmit={handleSubmit} className="predictor-form">
        <div className="form-group">
          <label htmlFor="pred-title">Content Title *</label>
          <input
            id="pred-title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="Enter your content title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="pred-desc">Description</label>
          <textarea
            id="pred-desc"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Content description (optional)"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="pred-tags">Tags (comma-separated)</label>
            <input
              id="pred-tags"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="ai, tech, tutorial"
            />
          </div>
          <div className="form-group">
            <label htmlFor="pred-platform">Platform *</label>
            <select id="pred-platform" name="platform" value={form.platform} onChange={handleChange}>
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="pred-followers">Follower Count</label>
            <input
              id="pred-followers"
              name="followerCount"
              type="number"
              value={form.followerCount}
              onChange={handleChange}
              placeholder="e.g., 50000"
            />
          </div>
          <div className="form-group">
            <label htmlFor="pred-engagement">Historical Engagement Rate</label>
            <input
              id="pred-engagement"
              name="historicalEngagementRate"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={form.historicalEngagementRate}
              onChange={handleChange}
              placeholder="e.g., 0.05"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading || !form.title.trim()}>
            {loading ? 'Predicting...' : 'Predict Virality'}
          </button>
          <button type="button" className="btn-secondary" onClick={handleClear}>
            Clear
          </button>
        </div>
      </form>

      {loading && <LoadingSpinner message="Running virality prediction..." />}
      {error && <div className="error-banner">{error}</div>}

      {result && (
        <div className="prediction-results">
          {/* Score Display */}
          <div className="score-display">
            <div className="score-circle" style={{ borderColor: scoreColor(result.score) }}>
              <span className="score-number">{result.score}</span>
              <span className="score-label">/ 100</span>
            </div>
            <div className="score-meta">
              <div className="score-risk" style={{ color: scoreColor(result.score) }}>
                {result.riskLevel || (result.score >= 70 ? 'High Viral Potential' : result.score >= 40 ? 'Moderate Potential' : 'Low Potential')}
              </div>
              <div className="score-confidence">
                Confidence: {(result.confidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Feature Impact Chart */}
          {result.explanation.length > 0 && (
            <div className="chart-container">
              <h3>Feature Impact Analysis (SHAP-style)</h3>
              <ResponsiveContainer width="100%" height={Math.max(250, result.explanation.length * 30)}>
                <BarChart
                  data={result.explanation.slice(0, 12).map(f => ({
                    name: f.label || f.feature,
                    impact: Math.round(f.impact * 100) / 100,
                    direction: f.direction,
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={140} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="impact">
                    {result.explanation.slice(0, 12).map((f, idx) => (
                      <Cell
                        key={idx}
                        fill={f.direction === 'positive' ? '#2ecc71' : '#e74c3c'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ViralityPredictor;
