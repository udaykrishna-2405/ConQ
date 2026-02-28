import React from 'react';
import { render, screen } from '@testing-library/react';
import TopContentTable from '../../components/dashboard/TopContentTable';
import { TopContentItem } from '../../types';

const mockItems: TopContentItem[] = [
  {
    platform: 'youtube',
    contentId: 'vid_001',
    title: 'Top 10 AI Tips',
    engagementRate: 0.0534,
    totalEngagements: 15420,
    publishedAt: '2026-02-15T10:00:00Z',
  },
  {
    platform: 'instagram',
    contentId: 'post_001',
    title: 'Fitness Goals! Tag someone who needs this',
    engagementRate: 0.0891,
    totalEngagements: 8320,
    publishedAt: '2026-02-20T14:30:00Z',
  },
];

describe('TopContentTable', () => {
  it('renders table header', () => {
    render(<TopContentTable items={mockItems} />);
    expect(screen.getByText('Top Performing Content')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<TopContentTable items={mockItems} />);
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Engagements')).toBeInTheDocument();
    expect(screen.getByText('Eng. Rate')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('renders content items', () => {
    render(<TopContentTable items={mockItems} />);
    expect(screen.getByText('Top 10 AI Tips')).toBeInTheDocument();
    expect(screen.getByText('Fitness Goals! Tag someone who needs this')).toBeInTheDocument();
  });

  it('renders platform badges', () => {
    render(<TopContentTable items={mockItems} />);
    expect(screen.getByText('youtube')).toBeInTheDocument();
    expect(screen.getByText('instagram')).toBeInTheDocument();
  });

  it('formats engagement count with locale separators', () => {
    render(<TopContentTable items={mockItems} />);
    expect(screen.getByText('15,420')).toBeInTheDocument();
    expect(screen.getByText('8,320')).toBeInTheDocument();
  });

  it('formats engagement rate as percentage', () => {
    render(<TopContentTable items={mockItems} />);
    expect(screen.getByText('5.34%')).toBeInTheDocument();
    expect(screen.getByText('8.91%')).toBeInTheDocument();
  });

  it('renders correct number of rows', () => {
    const { container } = render(<TopContentTable items={mockItems} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('renders empty table when no items', () => {
    const { container } = render(<TopContentTable items={[]} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(0);
  });
});
