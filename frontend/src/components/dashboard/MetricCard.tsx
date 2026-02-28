import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, trend, color }) => {
  const trendClass = trend ? `metric-trend-${trend}` : '';

  return (
    <div className={`metric-card ${trendClass}`} style={color ? { borderLeftColor: color } : {}}>
      <div className="metric-card-title">{title}</div>
      <div className="metric-card-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {subtitle && <div className="metric-card-subtitle">{subtitle}</div>}
    </div>
  );
};

export default MetricCard;
