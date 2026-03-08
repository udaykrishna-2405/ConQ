import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { predictVirality, clearPrediction } from '../store/slices/predictionSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useI18n } from '../i18n';

const ViralityPredictor: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
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
        <h2>{t('predict.title')}</h2>
        <p className="page-subtitle">{t('predict.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="predictor-form">
        <div className="form-group">
          <label htmlFor="pred-title">{t('predict.titleLabel')}</label>
          <input
            id="pred-title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder={t('predict.titlePlaceholder')}
          />
        </div>

        <div className="form-group">
          <label htmlFor="pred-desc">{t('predict.descLabel')}</label>
          <textarea
            id="pred-desc"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder={t('predict.descPlaceholder')}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="pred-tags">{t('predict.categoryLabel')}</label>
            <input
              id="pred-tags"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="ai, tech, tutorial"
            />
          </div>
          <div className="form-group">
            <label htmlFor="pred-platform">{t('predict.platformLabel')}</label>
            <select id="pred-platform" name="platform" value={form.platform} onChange={handleChange}>
              <option value="youtube">{t('common.youtube')}</option>
              <option value="instagram">{t('common.instagram')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="pred-followers">{t('common.followers')}</label>
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
            <label htmlFor="pred-engagement">{t('dashboard.engagementRate')}</label>
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
            {loading ? t('predict.predictingBtn') : t('predict.predictBtn')}
          </button>
          <button type="button" className="btn-secondary" onClick={handleClear}>
            {t('common.clear')}
          </button>
        </div>
      </form>

      {loading && <LoadingSpinner message={t('predict.predictingBtn')} />}
      {error && <div className="error-banner">{error}</div>}

      {result && (
        <div className="prediction-results">
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
                {t('predict.confidence')}: {(result.confidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {result.explanation.length > 0 && (
            <div className="chart-container">
              <h3>{t('predict.factors')}</h3>
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

      {!result && !loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
          <p>{t('predict.emptyState')}</p>
        </div>
      )}
    </div>
  );
};

export default ViralityPredictor;
