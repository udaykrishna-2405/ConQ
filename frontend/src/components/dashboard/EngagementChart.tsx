import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TopContentItem } from '../../types';

interface EngagementChartProps {
  topContent: TopContentItem[];
}

const EngagementChart: React.FC<EngagementChartProps> = ({ topContent }) => {
  const data = topContent.slice(0, 8).map((item) => ({
    name: item.title.length > 25 ? item.title.substring(0, 25) + '...' : item.title,
    engagements: item.totalEngagements,
    rate: Math.round(item.engagementRate * 10000) / 100,
    platform: item.platform,
  }));

  return (
    <div className="chart-container">
      <h3>Top Content Engagement</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 60, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-35}
            textAnchor="end"
            interval={0}
            fontSize={11}
          />
          <YAxis />
          <Tooltip
            formatter={(value: number, name: string) => [
              name === 'rate' ? `${value}%` : value.toLocaleString(),
              name === 'rate' ? 'Engagement Rate' : 'Total Engagements',
            ]}
          />
          <Legend />
          <Bar dataKey="engagements" fill="#3498db" name="Engagements" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EngagementChart;
