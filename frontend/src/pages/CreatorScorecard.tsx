import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { generateScorecard, clearScorecard } from '../store/slices/creatorScorecardSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CreatorScorecard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { result, loading, error } = useAppSelector((state) => state.creatorScorecard);

  const [form, setForm] = useState({
    platform: 'youtube' as 'youtube' | 'instagram' | 'twitter' | 'linkedin',
    niche: '',
    followerCount: '',
    engagementRate: '',
    postsPerWeek: '',
    avgViews: '',
    contentQuality: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.niche.trim()) return;
    dispatch(generateScorecard({
      platform: form.platform,
      niche: form.niche,
      followerCount: form.followerCount ? parseInt(form.followerCount, 10) : undefined,
      engagementRate: form.engagementRate ? parseFloat(form.engagementRate) : undefined,
      postsPerWeek: form.postsPerWeek ? parseInt(form.postsPerWeek, 10) : undefined,
      avgViews: form.avgViews ? parseInt(form.avgViews, 10) : undefined,
      contentQuality: form.contentQuality ? parseFloat(form.contentQuality) : undefined,
    }));
  };

  const handleClear = () => {
    setForm({ platform: 'youtube', niche: '', followerCount: '', engagementRate: '', postsPerWeek: '', avgViews: '', contentQuality: '' });
    dispatch(clearScorecard());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return '#2ecc71';
    if (score >= 60) return '#27ae60';
    if (score >= 40) return '#f39c12';
    if (score >= 20) return '#e67e22';
    return '#e74c3c';
  };

  const gradeFromScore = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Creator Scorecard</h2>
        <p className="page-subtitle">
          Get a comprehensive score of your creator profile with actionable improvement insights
        </p>
      </div>

      <form onSubmit={handleSubmit} className="predictor-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="cs-platform">Platform *</label>
            <select id="cs-platform" name="platform" value={form.platform} onChange={handleChange}>
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="cs-niche">Niche *</label>
            <input
              id="cs-niche"
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
            <label htmlFor="cs-followers">Follower Count</label>
            <input
              id="cs-followers"
              name="followerCount"
              type="number"
              value={form.followerCount}
              onChange={handleChange}
              placeholder="e.g., 50000"
              min="0"
            />
          </div>
          <div className="form-group">
            <label htmlFor="cs-engagement">Engagement Rate</label>
            <input
              id="cs-engagement"
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
            <label htmlFor="cs-posts">Posts Per Week</label>
            <input
              id="cs-posts"
              name="postsPerWeek"
              type="number"
              min="0"
              max="50"
              value={form.postsPerWeek}
              onChange={handleChange}
              placeholder="e.g., 5"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="cs-views">Avg Views</label>
            <input
              id="cs-views"
              name="avgViews"
              type="number"
              value={form.avgViews}
              onChange={handleChange}
              placeholder="e.g., 10000"
              min="0"
            />
          </div>
          <div className="form-group">
            <label htmlFor="cs-quality">Content Quality (1-10)</label>
            <input
              id="cs-quality"
              name="contentQuality"
              type="number"
              step="0.1"
              min="1"
              max="10"
              value={form.contentQuality}
              onChange={handleChange}
              placeholder="e.g., 7.5"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading || !form.niche.trim()}>
            {loading ? 'Generating Scorecard...' : 'Generate Scorecard'}
          </button>
          <button type="button" className="btn-secondary" onClick={handleClear}>
            Clear
          </button>
        </div>
      </form>

      {loading && <LoadingSpinner message="Generating creator scorecard..." />}
      {error && <div className="error-banner">{error}</div>}

      {result && (
        <div className="module-section">
          {/* Big Score Circle with Grade and Tier */}
          <div className="module-section" style={{ textAlign: 'center' }}>
            <div
              className="score-circle"
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                border: `6px solid ${scoreColor(result.overallScore ?? 0)}`,
                margin: '0 auto',
              }}
            >
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: scoreColor(result.overallScore ?? 0) }}>
                {result.overallScore ?? 0}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#888' }}>/ 100</span>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <span
                className="badge"
                style={{
                  backgroundColor: scoreColor(result.overallScore ?? 0),
                  fontSize: '1.25rem',
                  padding: '0.5rem 1.25rem',
                  marginRight: '0.5rem',
                }}
              >
                Grade: {result.grade || gradeFromScore(result.overallScore ?? 0)}
              </span>
              {result.tier && (
                <span className="badge badge-info" style={{ fontSize: '1.25rem', padding: '0.5rem 1.25rem' }}>
                  {result.tier}
                </span>
              )}
            </div>
          </div>

          {/* Dimensions Scores with Progress Bars */}
          {result.dimensions && result.dimensions.length > 0 && (
            <div className="module-section">
              <h3>Score Dimensions</h3>
              <div className="results-grid">
                {result.dimensions.map((dim: any, idx: number) => (
                  <div key={idx} className="result-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong>{dim.name || dim.dimension}</strong>
                      <span style={{ fontWeight: 'bold', color: scoreColor(dim.score ?? 0) }}>
                        {dim.score ?? 0}/100
                      </span>
                    </div>
                    <div
                      style={{
                        height: '8px',
                        borderRadius: '4px',
                        backgroundColor: '#e0e0e0',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${dim.score ?? 0}%`,
                          backgroundColor: scoreColor(dim.score ?? 0),
                          borderRadius: '4px',
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                    {dim.feedback && (
                      <div className="result-detail" style={{ marginTop: '0.5rem' }}>{dim.feedback}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brand Strength Pillars */}
          {result.brandStrength && result.brandStrength.length > 0 && (
            <div className="module-section">
              <h3>Brand Strength Pillars</h3>
              <div className="metrics-grid">
                {result.brandStrength.map((pillar: any, idx: number) => (
                  <div key={idx} className="metric-card">
                    <div className="metric-card-title">{pillar.name || pillar.pillar}</div>
                    <div className="metric-card-value" style={{ color: scoreColor(pillar.score ?? 0) }}>
                      {pillar.score ?? 0}
                    </div>
                    {pillar.description && (
                      <div className="result-detail" style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                        {pillar.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Peer Comparison */}
          {result.peerComparison && (
            <div className="module-section">
              <h3>Peer Comparison</h3>
              {Array.isArray(result.peerComparison) ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Your Score</th>
                      <th>Peer Average</th>
                      <th>Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.peerComparison.map((comp: any, idx: number) => (
                      <tr key={idx}>
                        <td><strong>{comp.metric || comp.name}</strong></td>
                        <td>{comp.yourScore ?? comp.yours ?? 'N/A'}</td>
                        <td>{comp.peerAverage ?? comp.peers ?? 'N/A'}</td>
                        <td style={{
                          color: (comp.difference ?? (comp.yourScore ?? 0) - (comp.peerAverage ?? 0)) >= 0 ? '#2ecc71' : '#e74c3c',
                          fontWeight: 'bold',
                        }}>
                          {(comp.difference ?? ((comp.yourScore ?? 0) - (comp.peerAverage ?? 0))) >= 0 ? '+' : ''}
                          {comp.difference ?? ((comp.yourScore ?? 0) - (comp.peerAverage ?? 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="result-card">
                  <div className="result-detail">
                    {typeof result.peerComparison === 'string' ? result.peerComparison : JSON.stringify(result.peerComparison, null, 2)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Improvement Plan */}
          {result.improvementPlan && result.improvementPlan.length > 0 && (
            <div className="module-section">
              <h3>Improvement Plan</h3>
              <div className="results-grid">
                {result.improvementPlan.map((step: any, idx: number) => (
                  <div key={idx} className="result-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className="badge badge-info">{step.priority || `Step ${idx + 1}`}</span>
                      <strong>{typeof step === 'string' ? step : step.title || step.action}</strong>
                    </div>
                    {typeof step !== 'string' && step.description && (
                      <div className="result-detail">{step.description}</div>
                    )}
                    {typeof step !== 'string' && step.expectedImpact && (
                      <div className="result-detail" style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
                        Expected Impact: {step.expectedImpact}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badges (Earned vs Unearned) */}
          {result.badges && result.badges.length > 0 && (
            <div className="module-section">
              <h3>Creator Badges</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {result.badges.map((badge: any, idx: number) => (
                  <div
                    key={idx}
                    className="result-card"
                    style={{
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: '120px',
                      padding: '1rem',
                      opacity: badge.earned ? 1 : 0.45,
                      border: badge.earned ? '2px solid #2ecc71' : '2px dashed #95a5a6',
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                      {badge.icon || (badge.earned ? '\u2605' : '\u2606')}
                    </div>
                    <strong style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                      {badge.name || badge.title}
                    </strong>
                    {badge.description && (
                      <div className="result-detail" style={{ marginTop: '0.25rem', textAlign: 'center', fontSize: '0.75rem' }}>
                        {badge.description}
                      </div>
                    )}
                    <span
                      className="badge"
                      style={{
                        marginTop: '0.5rem',
                        backgroundColor: badge.earned ? '#2ecc71' : '#95a5a6',
                        fontSize: '0.7rem',
                      }}
                    >
                      {badge.earned ? 'Earned' : 'Locked'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreatorScorecard;
