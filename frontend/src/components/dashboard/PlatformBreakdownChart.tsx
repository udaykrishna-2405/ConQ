import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { UnifiedMetrics } from '../../types';

interface PlatformBreakdownChartProps {
  unified: UnifiedMetrics;
}

const COLORS = ['#e74c3c', '#8e44ad'];

const PlatformBreakdownChart: React.FC<PlatformBreakdownChartProps> = ({ unified }) => {
  const data = [
    { name: 'YouTube', value: unified.platformBreakdown.youtube.engagements },
    { name: 'Instagram', value: unified.platformBreakdown.instagram.engagements },
  ];

  return (
    <div className="chart-container">
      <h3>Platform Breakdown</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => value.toLocaleString()} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PlatformBreakdownChart;
