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
import { useI18n } from '../i18n';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const { data, loading, error } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  if (loading) return <LoadingSpinner message={t('dashboard.loading')} />;

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
            <h2>{t('dashboard.title')}</h2>
            <p className="page-subtitle">
              {t('dashboard.subtitle')} | {t('dashboard.generated')} {new Date(data.generatedAt).toLocaleString()}
            </p>
          </div>
          <button className="btn-secondary" onClick={handleExportCsv}>
            {t('dashboard.exportCsv')}
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid">
        <MetricCard
          title={t('dashboard.totalReach')}
          value={unified.totalReach}
          subtitle={t('dashboard.reachSubtitle')}
          color="#3498db"
        />
        <MetricCard
          title={t('dashboard.totalEngagements')}
          value={unified.totalEngagements}
          subtitle={t('dashboard.engagementSubtitle')}
          color="#2ecc71"
        />
        <MetricCard
          title={t('dashboard.engagementRate')}
          value={`${(unified.weightedEngagementRate * 100).toFixed(2)}%`}
          subtitle={t('dashboard.rateSubtitle')}
          color="#e67e22"
        />
        <MetricCard
          title={t('dashboard.contentPublished')}
          value={unified.contentCount}
          subtitle={`${platforms.youtube.aggregated.videoCount} ${t('common.videos')}, ${platforms.instagram.aggregated.postCount} ${t('common.posts')}`}
          color="#9b59b6"
        />
      </div>

      {/* Platform Summary */}
      <div className="platform-summary-grid">
        <div className="platform-card">
          <h3>{t('dashboard.youtube')}</h3>
          <div className="platform-stats">
            <div><strong>{platforms.youtube.channel.title}</strong></div>
            <div>{platforms.youtube.channel.subscriberCount.toLocaleString()} {t('common.subscribers')}</div>
            <div>{platforms.youtube.aggregated.totalViews.toLocaleString()} {t('common.totalViews')}</div>
            <div>{(platforms.youtube.aggregated.avgEngagementRate * 100).toFixed(2)}% {t('common.avgEngagement')}</div>
          </div>
        </div>
        <div className="platform-card">
          <h3>{t('dashboard.instagram')}</h3>
          <div className="platform-stats">
            <div><strong>@{platforms.instagram.profile.username}</strong></div>
            <div>{platforms.instagram.profile.followersCount.toLocaleString()} {t('common.followers')}</div>
            <div>{platforms.instagram.aggregated.totalReach.toLocaleString()} {t('common.totalReach')}</div>
            <div>{(platforms.instagram.aggregated.avgEngagementRate * 100).toFixed(2)}% {t('common.avgEngagement')}</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <PlatformBreakdownChart unified={unified} />
        <EngagementChart topContent={topContent} />
      </div>

      <TopContentTable items={topContent} />

      {trendAlignment.length > 0 && (
        <TrendAlignmentList items={trendAlignment} />
      )}
    </div>
  );
};

export default Dashboard;
