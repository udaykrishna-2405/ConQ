import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchTrends } from '../store/slices/trendsSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CATEGORY_COLORS: Record<string, string> = {
  viral: '#e74c3c',
  trending: '#f39c12',
  emerging: '#3498db',
  declining: '#95a5a6',
};

const Trends: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector((state) => state.trends);

  const [filters, setFilters] = useState({
    region: '',
    language: '',
    category: '' as string,
    limit: '25',
  });

  useEffect(() => {
    dispatch(fetchTrends());
  }, [dispatch]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(fetchTrends({
      region: filters.region || undefined,
      language: filters.language || undefined,
      category: (filters.category || undefined) as any,
      limit: filters.limit ? parseInt(filters.limit, 10) : undefined,
    }));
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Trend Explorer</h2>
        <p className="page-subtitle">
          Real-time trend detection with velocity-based scoring
        </p>
      </div>

      {/* Filter Form */}
      <form onSubmit={handleFilter} className="filter-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="trend-region">Region</label>
            <select
              id="trend-region"
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
            >
              <option value="">All India</option>
              <option value="maharashtra">Maharashtra</option>
              <option value="karnataka">Karnataka</option>
              <option value="tamil-nadu">Tamil Nadu</option>
              <option value="delhi">Delhi</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="trend-lang">Language</label>
            <select
              id="trend-lang"
              value={filters.language}
              onChange={(e) => setFilters({ ...filters, language: e.target.value })}
            >
              <option value="">All Languages</option>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
              <option value="bn">Bengali</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="trend-cat">Category</label>
            <select
              id="trend-cat"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              <option value="viral">Viral</option>
              <option value="trending">Trending</option>
              <option value="emerging">Emerging</option>
              <option value="declining">Declining</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="trend-limit">Limit</label>
            <input
              id="trend-limit"
              type="number"
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: e.target.value })}
              min="1"
              max="50"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>
        </div>
      </form>

      {loading && <LoadingSpinner message="Fetching trends..." />}
      {error && <div className="error-banner">{error}</div>}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="trend-summary">
            <div className="summary-item" style={{ borderColor: CATEGORY_COLORS.viral }}>
              <span className="summary-count">{data.summary.viral}</span>
              <span className="summary-label">Viral</span>
            </div>
            <div className="summary-item" style={{ borderColor: CATEGORY_COLORS.trending }}>
              <span className="summary-count">{data.summary.trending}</span>
              <span className="summary-label">Trending</span>
            </div>
            <div className="summary-item" style={{ borderColor: CATEGORY_COLORS.emerging }}>
              <span className="summary-count">{data.summary.emerging}</span>
              <span className="summary-label">Emerging</span>
            </div>
            <div className="summary-item" style={{ borderColor: CATEGORY_COLORS.declining }}>
              <span className="summary-count">{data.summary.declining}</span>
              <span className="summary-label">Declining</span>
            </div>
          </div>

          {/* Trend Chart */}
          {data.trends.length > 0 && (
            <div className="chart-container">
              <h3>Trend Scores</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={data.trends.slice(0, 15).map(t => ({
                    keyword: t.keyword,
                    score: t.normalizedScore,
                    category: t.category,
                  }))}
                  margin={{ top: 5, right: 20, bottom: 60, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="keyword" angle={-40} textAnchor="end" interval={0} fontSize={11} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" name="Trend Score">
                    {data.trends.slice(0, 15).map((t, idx) => (
                      <Cell key={idx} fill={CATEGORY_COLORS[t.category] || '#95a5a6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Trend Table */}
          <div className="table-container">
            <h3>All Trends ({data.totalTrends} total)</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Keyword</th>
                  <th>Category</th>
                  <th>Score</th>
                  <th>Velocity</th>
                  <th>Growth</th>
                  <th>Region</th>
                  <th>Language</th>
                </tr>
              </thead>
              <tbody>
                {data.trends.map((trend) => (
                  <tr key={trend.trendId}>
                    <td><strong>{trend.keyword}</strong></td>
                    <td>
                      <span
                        className="category-badge"
                        style={{ backgroundColor: CATEGORY_COLORS[trend.category] }}
                      >
                        {trend.category}
                      </span>
                    </td>
                    <td>{trend.normalizedScore}</td>
                    <td>{trend.velocity.toFixed(2)}</td>
                    <td>{trend.growthRate.toFixed(1)}%</td>
                    <td>{trend.region}</td>
                    <td>{trend.language}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Trends;
