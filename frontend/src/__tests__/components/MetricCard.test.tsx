import React from 'react';
import { render, screen } from '@testing-library/react';
import MetricCard from '../../components/dashboard/MetricCard';

describe('MetricCard', () => {
  it('renders title and value', () => {
    render(<MetricCard title="Total Views" value={1234567} />);
    expect(screen.getByText('Total Views')).toBeInTheDocument();
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('renders string values as-is', () => {
    render(<MetricCard title="Status" value="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<MetricCard title="Engagements" value={500} subtitle="+12% this week" />);
    expect(screen.getByText('+12% this week')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    const { container } = render(<MetricCard title="Views" value={100} />);
    expect(container.querySelector('.metric-card-subtitle')).not.toBeInTheDocument();
  });

  it('applies trend class for up trend', () => {
    const { container } = render(<MetricCard title="Growth" value={42} trend="up" />);
    expect(container.querySelector('.metric-trend-up')).toBeInTheDocument();
  });

  it('applies trend class for down trend', () => {
    const { container } = render(<MetricCard title="Decline" value={-5} trend="down" />);
    expect(container.querySelector('.metric-trend-down')).toBeInTheDocument();
  });

  it('applies border color when provided', () => {
    const { container } = render(<MetricCard title="Custom" value={99} color="#ff0000" />);
    const card = container.querySelector('.metric-card') as HTMLElement;
    expect(card.style.borderLeftColor).toBe('#ff0000');
  });

  it('formats large numbers with locale separators', () => {
    render(<MetricCard title="Reach" value={9876543} />);
    expect(screen.getByText('9,876,543')).toBeInTheDocument();
  });
});
