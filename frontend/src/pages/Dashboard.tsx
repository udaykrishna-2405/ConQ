import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchDashboard } from '../store/slices/dashboardSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MetricCard from '../components/dashboard/MetricCard';
import PlatformBreakdownChart from '../components/dashboard/PlatformBreakdownChart';
import EngagementChart from '../components/dashboard/EngagementChart';
import TopContentTable from '../components/dashboard/TopContentTable';
import TrendAlignmentList from '../components/dashboard/TrendAlignmentList';
import { dashboardToCsv, downloadCsv } from '../utils/exportCsv';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  if (error) {
    return (
      <div className="page-container">
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const { unified, platforms, topContent, trendAlignment } = data;

  const handleExportCsv = () => {
    const csv = dashboardToCsv(data);
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `conq-analytics-${date}.csv`);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h2>Analytics Dashboard</h2>
            <p className="page-subtitle">
              Cross-platform performance overview | Generated {new Date(data.generatedAt).toLocaleString()}
            </p>
          </div>
          <button className="btn-secondary" onClick={handleExportCsv}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Reach"
          value={unified.totalReach}
          subtitle="YouTube views + Instagram reach"
          color="#3498db"
        />
        <MetricCard
          title="Total Engagements"
          value={unified.totalEngagements}
          subtitle="Likes, comments, shares, saves"
          color="#2ecc71"
        />
        <MetricCard
          title="Engagement Rate"
          value={`${(unified.weightedEngagementRate * 100).toFixed(2)}%`}
          subtitle="Weighted cross-platform average"
          color="#e67e22"
        />
        <MetricCard
          title="Content Published"
          value={unified.contentCount}
          subtitle={`${platforms.youtube.aggregated.videoCount} videos, ${platforms.instagram.aggregated.postCount} posts`}
          color="#9b59b6"
        />
      </div>

      {/* Platform Summary Cards */}
      <div className="platform-summary-grid">
        <div className="platform-card">
          <h3>YouTube</h3>
          <div className="platform-stats">
            <div><strong>{platforms.youtube.channel.title}</strong></div>
            <div>{platforms.youtube.channel.subscriberCount.toLocaleString()} subscribers</div>
            <div>{platforms.youtube.aggregated.totalViews.toLocaleString()} total views</div>
            <div>{(platforms.youtube.aggregated.avgEngagementRate * 100).toFixed(2)}% avg engagement</div>
          </div>
        </div>
        <div className="platform-card">
          <h3>Instagram</h3>
          <div className="platform-stats">
            <div><strong>@{platforms.instagram.profile.username}</strong></div>
            <div>{platforms.instagram.profile.followersCount.toLocaleString()} followers</div>
            <div>{platforms.instagram.aggregated.totalReach.toLocaleString()} total reach</div>
            <div>{(platforms.instagram.aggregated.avgEngagementRate * 100).toFixed(2)}% avg engagement</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        <PlatformBreakdownChart unified={unified} />
        <EngagementChart topContent={topContent} />
      </div>

      {/* Top Content Table */}
      <TopContentTable items={topContent} />

      {/* Trend Alignment */}
      {trendAlignment.length > 0 && (
        <TrendAlignmentList items={trendAlignment} />
      )}
    </div>
  );
};

export default Dashboard;
