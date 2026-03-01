import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { generateForecast, generateBenchmark, clearGrowthReport } from '../store/slices/growthIntelligenceSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';

type TabType = 'forecast' | 'benchmark';

const GrowthIntelligence: React.FC = () => {
  const dispatch = useAppDispatch();
  const { result, loading, error } = useAppSelector((state) => state.growthIntelligence);

  const [activeTab, setActiveTab] = useState<TabType>('forecast');

  // Forecast form state
  const [forecastForm, setForecastForm] = useState({
    platform: 'youtube' as 'youtube' | 'instagram' | 'twitter' | 'linkedin',
    timeframeMonths: '6',
    niche: '',
    postsPerWeek: '3',
    currentFollowers: '',
    currentEngagementRate: '',
  });

  // Benchmark form state
  const [benchmarkForm, setBenchmarkForm] = useState({
    platform: 'youtube' as 'youtube' | 'instagram' | 'twitter' | 'linkedin',
    niche: '',
    followerCount: '',
    engagementRate: '',
  });

  const handleForecastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forecastForm.niche.trim()) return;
    dispatch(generateForecast({
      platform: forecastForm.platform,
      timeframeMonths: parseInt(forecastForm.timeframeMonths, 10),
      niche: forecastForm.niche,
      postsPerWeek: parseInt(forecastForm.postsPerWeek, 10),
      currentFollowers: forecastForm.currentFollowers ? parseInt(forecastForm.currentFollowers, 10) : undefined,
      currentEngagementRate: forecastForm.currentEngagementRate ? parseFloat(forecastForm.currentEngagementRate) : undefined,
    }));
  };

  const handleBenchmarkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!benchmarkForm.niche.trim()) return;
    dispatch(generateBenchmark({
      platform: benchmarkForm.platform,
      niche: benchmarkForm.niche,
      followerCount: benchmarkForm.followerCount ? parseInt(benchmarkForm.followerCount, 10) : undefined,
      engagementRate: benchmarkForm.engagementRate ? parseFloat(benchmarkForm.engagementRate) : undefined,
    }));
  };

  const handleClear = () => {
    setForecastForm({ platform: 'youtube', timeframeMonths: '6', niche: '', postsPerWeek: '3', currentFollowers: '', currentEngagementRate: '' });
    setBenchmarkForm({ platform: 'youtube', niche: '', followerCount: '', engagementRate: '' });
    dispatch(clearGrowthReport());
  };

  const handleForecastChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForecastForm({ ...forecastForm, [e.target.name]: e.target.value });
  };

  const handleBenchmarkChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBenchmarkForm({ ...benchmarkForm, [e.target.name]: e.target.value });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Growth Intelligence</h2>
        <p className="page-subtitle">
          Forecast your growth trajectory and benchmark against competitors
        </p>
      </div>

      {/* Tab Selector */}
      <div className="form-row" style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={activeTab === 'forecast' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('forecast')}
        >
          Growth Forecast
        </button>
        <button
          type="button"
          className={activeTab === 'benchmark' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('benchmark')}
        >
          Competitor Benchmark
        </button>
      </div>

      {/* Growth Forecast Form */}
      {activeTab === 'forecast' && (
        <form onSubmit={handleForecastSubmit} className="predictor-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gf-platform">Platform *</label>
              <select id="gf-platform" name="platform" value={forecastForm.platform} onChange={handleForecastChange}>
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="gf-niche">Niche *</label>
              <input
                id="gf-niche"
                name="niche"
                value={forecastForm.niche}
                onChange={handleForecastChange}
                required
                placeholder="e.g., tech, fitness, cooking"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gf-timeframe">Timeframe (Months) *</label>
              <input
                id="gf-timeframe"
                name="timeframeMonths"
                type="number"
                min="1"
                max="24"
                value={forecastForm.timeframeMonths}
                onChange={handleForecastChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="gf-posts">Posts Per Week *</label>
              <input
                id="gf-posts"
                name="postsPerWeek"
                type="number"
                min="1"
                max="30"
                value={forecastForm.postsPerWeek}
                onChange={handleForecastChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gf-followers">Current Followers</label>
              <input
                id="gf-followers"
                name="currentFollowers"
                type="number"
                value={forecastForm.currentFollowers}
                onChange={handleForecastChange}
                placeholder="e.g., 10000"
                min="0"
              />
            </div>
            <div className="form-group">
              <label htmlFor="gf-engagement">Current Engagement Rate</label>
              <input
                id="gf-engagement"
                name="currentEngagementRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={forecastForm.currentEngagementRate}
                onChange={handleForecastChange}
                placeholder="e.g., 3.5"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading || !forecastForm.niche.trim()}>
              {loading ? 'Forecasting...' : 'Generate Forecast'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleClear}>
              Clear
            </button>
          </div>
        </form>
      )}

      {/* Competitor Benchmark Form */}
      {activeTab === 'benchmark' && (
        <form onSubmit={handleBenchmarkSubmit} className="predictor-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gb-platform">Platform *</label>
              <select id="gb-platform" name="platform" value={benchmarkForm.platform} onChange={handleBenchmarkChange}>
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="gb-niche">Niche *</label>
              <input
                id="gb-niche"
                name="niche"
                value={benchmarkForm.niche}
                onChange={handleBenchmarkChange}
                required
                placeholder="e.g., tech, fitness, cooking"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gb-followers">Your Follower Count</label>
              <input
                id="gb-followers"
                name="followerCount"
                type="number"
                value={benchmarkForm.followerCount}
                onChange={handleBenchmarkChange}
                placeholder="e.g., 50000"
                min="0"
              />
            </div>
            <div className="form-group">
              <label htmlFor="gb-engagement">Your Engagement Rate</label>
              <input
                id="gb-engagement"
                name="engagementRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={benchmarkForm.engagementRate}
                onChange={handleBenchmarkChange}
                placeholder="e.g., 3.5"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading || !benchmarkForm.niche.trim()}>
              {loading ? 'Benchmarking...' : 'Run Benchmark'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleClear}>
              Clear
            </button>
          </div>
        </form>
      )}

      {loading && <LoadingSpinner message={activeTab === 'forecast' ? 'Generating growth forecast...' : 'Running competitor benchmark...'} />}
      {error && <div className="error-banner">{error}</div>}

      {/* Forecast Results */}
      {result && activeTab === 'forecast' && result.projections && (
        <div className="module-section">
          {/* Projections Table */}
          <div className="module-section">
            <h3>Growth Projections</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Followers</th>
                  <th>Engagement Rate</th>
                  <th>Est. Views</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {result.projections.map((proj: any, idx: number) => (
                  <tr key={idx}>
                    <td><strong>Month {proj.month}</strong></td>
                    <td>{proj.followers?.toLocaleString()}</td>
                    <td>{proj.engagement?.toFixed(2)}%</td>
                    <td>{proj.views?.toLocaleString()}</td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: (proj.confidence ?? 0) >= 0.7 ? '#2ecc71' : (proj.confidence ?? 0) >= 0.4 ? '#f39c12' : '#e74c3c'
                      }}>
                        {((proj.confidence ?? 0) * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Milestones */}
          {result.milestones && result.milestones.length > 0 && (
            <div className="module-section">
              <h3>Milestones</h3>
              <div className="results-grid">
                {result.milestones.map((milestone: any, idx: number) => (
                  <div key={idx} className="result-card">
                    <div className="result-value">{milestone.target || milestone.name}</div>
                    <div className="result-detail">
                      {milestone.estimatedDate || `~${milestone.estimatedMonths} months`}
                    </div>
                    {milestone.description && (
                      <div className="result-detail" style={{ marginTop: '0.25rem' }}>{milestone.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Growth Drivers */}
          {result.growthDrivers && result.growthDrivers.length > 0 && (
            <div className="module-section">
              <h3>Growth Drivers</h3>
              <div className="results-grid">
                {result.growthDrivers.map((driver: any, idx: number) => (
                  <div key={idx} className="result-card">
                    <strong>{typeof driver === 'string' ? driver : driver.name}</strong>
                    {typeof driver !== 'string' && driver.impact && (
                      <div className="result-detail" style={{ marginTop: '0.25rem' }}>Impact: {driver.impact}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Plan */}
          {result.actionPlan && result.actionPlan.length > 0 && (
            <div className="module-section">
              <h3>Action Plan</h3>
              <div className="results-grid">
                {result.actionPlan.map((action: any, idx: number) => (
                  <div key={idx} className="result-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className="badge badge-info">{action.priority || `Step ${idx + 1}`}</span>
                      <strong>{typeof action === 'string' ? action : action.title}</strong>
                    </div>
                    {typeof action !== 'string' && action.description && (
                      <div className="result-detail">{action.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Benchmark Results */}
      {result && activeTab === 'benchmark' && result.comparison && (
        <div className="module-section">
          {/* Comparison Table */}
          <div className="module-section">
            <h3>Your Metrics vs Niche</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Your Value</th>
                  <th>Niche Average</th>
                  <th>Top Performers</th>
                </tr>
              </thead>
              <tbody>
                {result.comparison.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td><strong>{item.metric}</strong></td>
                    <td>{item.yourValue ?? 'N/A'}</td>
                    <td>{item.nicheAverage ?? 'N/A'}</td>
                    <td>{item.topPerformers ?? 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Percentile Rank */}
          {result.percentileRank !== undefined && (
            <div className="module-section">
              <h3>Your Percentile Rank</h3>
              <div className="result-card" style={{ textAlign: 'center' }}>
                <div className="result-value" style={{ fontSize: '2.5rem', color: result.percentileRank >= 70 ? '#2ecc71' : result.percentileRank >= 40 ? '#f39c12' : '#e74c3c' }}>
                  {result.percentileRank}th
                </div>
                <div className="result-detail">percentile in your niche</div>
                <div
                  style={{
                    marginTop: '0.75rem',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: '#e0e0e0',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${result.percentileRank}%`,
                      backgroundColor: result.percentileRank >= 70 ? '#2ecc71' : result.percentileRank >= 40 ? '#f39c12' : '#e74c3c',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Gaps with Recommendations */}
          {result.gaps && result.gaps.length > 0 && (
            <div className="module-section">
              <h3>Gaps & Recommendations</h3>
              <div className="results-grid">
                {result.gaps.map((gap: any, idx: number) => (
                  <div key={idx} className="result-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{gap.area || gap.metric}</strong>
                      <span className="badge" style={{
                        backgroundColor: gap.severity === 'high' ? '#e74c3c' : gap.severity === 'medium' ? '#f39c12' : '#2ecc71'
                      }}>
                        {gap.severity || 'gap'}
                      </span>
                    </div>
                    <div className="result-detail" style={{ marginTop: '0.5rem' }}>{gap.recommendation || gap.description}</div>
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

export default GrowthIntelligence;
