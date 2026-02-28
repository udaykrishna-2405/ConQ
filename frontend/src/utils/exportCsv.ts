import { DashboardResponse } from '../types';

function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildRow(fields: (string | number)[]): string {
  return fields.map(escapeCsvField).join(',');
}

export function dashboardToCsv(data: DashboardResponse): string {
  const lines: string[] = [];

  // Header
  lines.push(`ConQ Analytics Export - ${new Date(data.generatedAt).toLocaleString()}`);
  lines.push('');

  // Unified Metrics
  lines.push('=== Unified Metrics ===');
  lines.push(buildRow(['Metric', 'Value']));
  lines.push(buildRow(['Total Reach', data.unified.totalReach]));
  lines.push(buildRow(['Total Engagements', data.unified.totalEngagements]));
  lines.push(buildRow(['Weighted Engagement Rate', `${(data.unified.weightedEngagementRate * 100).toFixed(2)}%`]));
  lines.push(buildRow(['Content Count', data.unified.contentCount]));
  lines.push(buildRow(['YouTube Engagements', data.unified.platformBreakdown.youtube.engagements]));
  lines.push(buildRow(['Instagram Engagements', data.unified.platformBreakdown.instagram.engagements]));
  lines.push('');

  // YouTube Summary
  lines.push('=== YouTube Summary ===');
  lines.push(buildRow(['Metric', 'Value']));
  lines.push(buildRow(['Channel', data.platforms.youtube.channel.title]));
  lines.push(buildRow(['Subscribers', data.platforms.youtube.channel.subscriberCount]));
  lines.push(buildRow(['Total Views', data.platforms.youtube.aggregated.totalViews]));
  lines.push(buildRow(['Total Likes', data.platforms.youtube.aggregated.totalLikes]));
  lines.push(buildRow(['Total Comments', data.platforms.youtube.aggregated.totalComments]));
  lines.push(buildRow(['Avg Engagement Rate', `${(data.platforms.youtube.aggregated.avgEngagementRate * 100).toFixed(2)}%`]));
  lines.push('');

  // Instagram Summary
  lines.push('=== Instagram Summary ===');
  lines.push(buildRow(['Metric', 'Value']));
  lines.push(buildRow(['Username', `@${data.platforms.instagram.profile.username}`]));
  lines.push(buildRow(['Followers', data.platforms.instagram.profile.followersCount]));
  lines.push(buildRow(['Total Reach', data.platforms.instagram.aggregated.totalReach]));
  lines.push(buildRow(['Total Likes', data.platforms.instagram.aggregated.totalLikes]));
  lines.push(buildRow(['Total Comments', data.platforms.instagram.aggregated.totalComments]));
  lines.push(buildRow(['Avg Engagement Rate', `${(data.platforms.instagram.aggregated.avgEngagementRate * 100).toFixed(2)}%`]));
  lines.push('');

  // Top Content
  lines.push('=== Top Content ===');
  lines.push(buildRow(['Platform', 'Title', 'Engagement Rate', 'Total Engagements', 'Published']));
  for (const item of data.topContent) {
    lines.push(buildRow([
      item.platform,
      item.title,
      `${(item.engagementRate * 100).toFixed(2)}%`,
      item.totalEngagements,
      new Date(item.publishedAt).toLocaleDateString(),
    ]));
  }
  lines.push('');

  // Trend Alignment
  if (data.trendAlignment.length > 0) {
    lines.push('=== Trend Alignment ===');
    lines.push(buildRow(['Keyword', 'Platform', 'Content Title', 'Alignment Score']));
    for (const item of data.trendAlignment) {
      lines.push(buildRow([
        item.keyword,
        item.platform,
        item.contentTitle,
        `${(item.alignmentScore * 100).toFixed(0)}%`,
      ]));
    }
  }

  return lines.join('\n');
}

export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
