import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { TopContentItem } from '../../types';

interface EngagementChartProps {
  topContent: TopContentItem[];
}

/* Custom Tooltip (unchanged, full title shown) */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const fullTitle = payload[0].payload.fullTitle;

    return (
      <div
        style={{
          background: '#ffffff',
          padding: '12px 15px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: '300px',
          wordWrap: 'break-word',
          whiteSpace: 'normal'
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '6px' }}>
          {fullTitle}
        </div>
        <div style={{ color: '#3498db' }}>
          Engagements: {payload[0].value.toLocaleString()}
        </div>
      </div>
    );
  }
  return null;
};

const EngagementChart: React.FC<EngagementChartProps> = ({ topContent }) => {

  // 🔥 Function to shorten titles to 1-2 clean words
  const makeShortTitle = (title: string) => {
    const lower = title.toLowerCase();

    if (lower.includes('travel')) return 'Travel Hacks';
    if (lower.includes('food')) return 'Food Goals';
    if (lower.includes('skincare')) return 'Skincare Tips';
    if (lower.includes('health')) return 'Health Goals';
    if (lower.includes('fitness')) return 'Fitness Post';
    if (lower.includes('fashion')) return 'Fashion 2026';
    if (lower.includes('morning')) return 'Morning Routine';
    if (lower.includes('home')) return 'Home Post';

    return title.split(' ').slice(0, 2).join(' ');
  };

  const data = topContent.slice(0, 8).map((item) => ({
    shortName: makeShortTitle(item.title), // 🔥 Only this changed
    fullTitle: item.title,
    engagements: item.totalEngagements,
  }));

  return (
    <div className="chart-container">
      <h3>Top Content Engagement</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 60, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="shortName"
            angle={-30}
            textAnchor="end"
            interval={0}
            height={60}
            tick={{ fontSize: 11 }}
          />

          <YAxis />

          <Tooltip content={<CustomTooltip />} />

          <Legend />

          <Bar
            dataKey="engagements"
            fill="#3498db"
            name="Engagements"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EngagementChart;