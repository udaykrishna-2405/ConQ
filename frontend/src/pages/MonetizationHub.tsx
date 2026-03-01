import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { generateMonetizationReport, clearMonetizationReport } from '../store/slices/monetizationSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';

const MonetizationHub: React.FC = () => {
  const dispatch = useAppDispatch();
  const { result, loading, error } = useAppSelector((state) => state.monetization);

  const [form, setForm] = useState({
    platform: 'youtube' as 'youtube' | 'instagram' | 'twitter' | 'linkedin',
    niche: '',
    followerCount: '',
    engagementRate: '',
    avgViews: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.niche.trim()) return;
    dispatch(generateMonetizationReport({
      platform: form.platform,
      niche: form.niche,
      followerCount: form.followerCount ? parseInt(form.followerCount, 10) : undefined,
      engagementRate: form.engagementRate ? parseFloat(form.engagementRate) : undefined,
      avgViews: form.avgViews ? parseInt(form.avgViews, 10) : undefined,
    }));
  };

  const handleClear = () => {
    setForm({ platform: 'youtube', niche: '', followerCount: '', engagementRate: '', avgViews: '' });
    dispatch(clearMonetizationReport());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Monetization Hub</h2>
        <p className="page-subtitle">
          Discover revenue opportunities, brand matches, and earning potential
        </p>
      </div>

      <form onSubmit={handleSubmit} className="predictor-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="mon-platform">Platform *</label>
            <select id="mon-platform" name="platform" value={form.platform} onChange={handleChange}>
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="mon-niche">Niche *</label>
            <input
              id="mon-niche"
              name="niche"
              value={form.niche}
              onChange={handleChange}
              required
              placeholder="e.g., tech, fitness, cooking"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="mon-followers">Follower Count</label>
            <input
              id="mon-followers"
              name="followerCount"
              type="number"
              value={form.followerCount}
              onChange={handleChange}
              placeholder="e.g., 50000"
              min="0"
            />
          </div>
          <div className="form-group">
            <label htmlFor="mon-engagement">Engagement Rate</label>
            <input
              id="mon-engagement"
              name="engagementRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.engagementRate}
              onChange={handleChange}
              placeholder="e.g., 3.5"
            />
          </div>
          <div className="form-group">
            <label htmlFor="mon-views">Avg Views</label>
            <input
              id="mon-views"
              name="avgViews"
              type="number"
              value={form.avgViews}
              onChange={handleChange}
              placeholder="e.g., 10000"
              min="0"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading || !form.niche.trim()}>
            {loading ? 'Generating Report...' : 'Generate Report'}
          </button>
          <button type="button" className="btn-secondary" onClick={handleClear}>
            Clear
          </button>
        </div>
      </form>

      {loading && <LoadingSpinner message="Generating monetization report..." />}
      {error && <div className="error-banner">{error}</div>}

      {result && (
        <div className="module-section">
          {/* Revenue Estimates */}
          {result.revenueEstimates && (
            <div className="module-section">
              <h3>Revenue Estimates</h3>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-card-title">Monthly Low</div>
                  <div className="metric-card-value">${result.revenueEstimates.monthlyLow?.toLocaleString() ?? 'N/A'}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-card-title">Monthly Mid</div>
                  <div className="metric-card-value">${result.revenueEstimates.monthlyMid?.toLocaleString() ?? 'N/A'}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-card-title">Monthly High</div>
                  <div className="metric-card-value">${result.revenueEstimates.monthlyHigh?.toLocaleString() ?? 'N/A'}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-card-title">Annual Projection</div>
                  <div className="metric-card-value">${result.revenueEstimates.annualProjection?.toLocaleString() ?? 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {/* CPM / RPM Info */}
          {result.cpmRpm && (
            <div className="module-section">
              <h3>CPM / RPM Rates</h3>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-card-title">CPM (Cost Per Mille)</div>
                  <div className="metric-card-value">${result.cpmRpm.cpm?.toFixed(2) ?? 'N/A'}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-card-title">RPM (Revenue Per Mille)</div>
                  <div className="metric-card-value">${result.cpmRpm.rpm?.toFixed(2) ?? 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Brand Matches */}
          {result.brandMatches && result.brandMatches.length > 0 && (
            <div className="module-section">
              <h3>Brand Matches ({result.brandMatches.length})</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Match Score</th>
                    <th>Est. Deal Value</th>
                    <th>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {result.brandMatches.map((brand: any, idx: number) => (
                    <tr key={idx}>
                      <td><strong>{brand.name}</strong></td>
                      <td>{brand.category}</td>
                      <td>
                        <span className="badge" style={{
                          backgroundColor: brand.matchScore >= 80 ? '#2ecc71' : brand.matchScore >= 50 ? '#f39c12' : '#95a5a6'
                        }}>
                          {brand.matchScore}%
                        </span>
                      </td>
                      <td>${brand.estimatedDealValue?.toLocaleString() ?? 'N/A'}</td>
                      <td>{brand.contact || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sponsored Post Prediction */}
          {result.sponsoredPostPrediction && (
            <div className="module-section">
              <h3>Sponsored Post Prediction</h3>
              <div className="results-grid">
                <div className="result-card">
                  <div className="result-value">${result.sponsoredPostPrediction.estimatedRate?.toLocaleString() ?? 'N/A'}</div>
                  <div className="result-detail">Estimated Rate per Sponsored Post</div>
                </div>
                <div className="result-card">
                  <div className="result-value">{result.sponsoredPostPrediction.postsPerMonth ?? 'N/A'}</div>
                  <div className="result-detail">Recommended Posts per Month</div>
                </div>
              </div>
            </div>
          )}

          {/* Audience Interests */}
          {result.audienceInterests && result.audienceInterests.length > 0 && (
            <div className="module-section">
              <h3>Audience Interests</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {result.audienceInterests.map((interest: string, idx: number) => (
                  <span key={idx} className="badge badge-info">{interest}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonetizationHub;
