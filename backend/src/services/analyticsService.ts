// Analytics Service – Unified Dashboard Aggregation
// Combines YouTube + Instagram platform data with virality scores
// and trend alignment into a single dashboard response.
// All data is tenant-scoped. In production, reads from DynamoDB
// (populated by platform webhook ingestion Lambdas).

import { v4 as uuidv4 } from 'uuid';
import * as youtube from './platforms/youtube';
import * as instagram from './platforms/instagram';
import { TenantRepository } from '../utils/repository';
import { config } from '../config';

// ── Response Interfaces ──

export interface DashboardResponse {
  tenantId: string;
  generatedAt: string;
  snapshotId: string;
  platforms: {
    youtube: YouTubeSummary;
    instagram: InstagramSummary;
  };
  unified: UnifiedMetrics;
  topContent: TopContentItem[];
  trendAlignment: TrendAlignmentItem[];
}

export interface YouTubeSummary {
  channel: youtube.YouTubeChannel;
  aggregated: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    avgEngagementRate: number;
    videoCount: number;
  };
  recentVideos: youtube.YouTubeVideo[];
}

export interface InstagramSummary {
  profile: instagram.InstagramProfile;
  aggregated: {
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalSaves: number;
    totalReach: number;
    totalImpressions: number;
    avgEngagementRate: number;
    postCount: number;
  };
  recentPosts: instagram.InstagramPost[];
}

export interface UnifiedMetrics {
  totalEngagements: number;
  totalReach: number;
  weightedEngagementRate: number;
  contentCount: number;
  platformBreakdown: {
    youtube: { engagements: number; percentage: number };
    instagram: { engagements: number; percentage: number };
  };
  growthIndicators: {
    subscriberToFollowerRatio: number;
    crossPlatformPresence: number;
  };
}

export interface TopContentItem {
  platform: 'youtube' | 'instagram';
  contentId: string;
  title: string;
  engagementRate: number;
  totalEngagements: number;
  publishedAt: string;
}

export interface TrendAlignmentItem {
  keyword: string;
  platform: 'youtube' | 'instagram';
  contentId: string;
  contentTitle: string;
  alignmentScore: number;
}

// ── Analytics Repository ──

interface AnalyticsSnapshot {
  tenant_id: string;
  snapshot_id: string;
  data: string; // JSON-stringified DashboardResponse
  created_at: string;
  ttl: number;
}

class AnalyticsRepository extends TenantRepository {
  constructor() {
    super(config.tables.analytics);
  }

  async saveSnapshot(snapshot: AnalyticsSnapshot): Promise<void> {
    await this.put(snapshot.tenant_id, snapshot as unknown as Record<string, unknown>);
  }

  async getLatestSnapshot(tenantId: string): Promise<AnalyticsSnapshot | null> {
    const results = await this.queryByTenant<AnalyticsSnapshot>(tenantId, 1);
    return results.length > 0 ? results[0] : null;
  }
}

// ── Trend Keywords for Alignment Scoring ──

const TREND_KEYWORDS = [
  'ai', 'machine learning', 'python', 'javascript', 'react',
  'web development', 'data science', 'cloud', 'fitness',
  'cooking', 'stock market', 'crypto', 'startup', 'travel',
  'skincare', 'photography', 'mental health', 'coding',
];

// ── Service ──

export class AnalyticsService {
  private repo: AnalyticsRepository;

  constructor() {
    this.repo = new AnalyticsRepository();
  }

  /**
   * Generates full dashboard analytics for a tenant.
   * Aggregates YouTube + Instagram data, computes unified metrics,
   * ranks top content, and scores trend alignment.
   */
  async getDashboard(tenantId: string): Promise<DashboardResponse> {
    // Fetch platform data
    const ytChannel = youtube.fetchChannelMetrics(tenantId);
    const ytAggregated = youtube.fetchAggregatedStats(tenantId);
    const ytVideos = youtube.fetchVideoMetrics(tenantId, 10);

    const igProfile = instagram.fetchProfileMetrics(tenantId);
    const igAggregated = instagram.fetchAggregatedPostStats(tenantId);
    const igPosts = instagram.fetchPostMetrics(tenantId, 10);

    // Build platform summaries
    const youtubeSummary: YouTubeSummary = {
      channel: ytChannel,
      aggregated: ytAggregated,
      recentVideos: ytVideos,
    };

    const instagramSummary: InstagramSummary = {
      profile: igProfile,
      aggregated: igAggregated,
      recentPosts: igPosts,
    };

    // Compute unified metrics
    const unified = this.computeUnifiedMetrics(ytChannel, ytAggregated, igProfile, igAggregated);

    // Rank top content across platforms
    const topContent = this.rankTopContent(ytVideos, igPosts);

    // Score trend alignment
    const trendAlignment = this.scoreTrendAlignment(ytVideos, igPosts);

    const snapshotId = uuidv4();
    const generatedAt = new Date().toISOString();

    const dashboard: DashboardResponse = {
      tenantId,
      generatedAt,
      snapshotId,
      platforms: {
        youtube: youtubeSummary,
        instagram: instagramSummary,
      },
      unified,
      topContent,
      trendAlignment,
    };

    // Persist snapshot asynchronously (fire-and-forget)
    this.persistSnapshot(tenantId, snapshotId, dashboard).catch(() => {
      // Swallow persistence errors in mock mode
    });

    return dashboard;
  }

  /**
   * Computes unified cross-platform engagement metrics.
   */
  private computeUnifiedMetrics(
    ytChannel: youtube.YouTubeChannel,
    ytAgg: ReturnType<typeof youtube.fetchAggregatedStats>,
    igProfile: instagram.InstagramProfile,
    igAgg: ReturnType<typeof instagram.fetchAggregatedPostStats>
  ): UnifiedMetrics {
    const ytEngagements = ytAgg.totalLikes + ytAgg.totalComments + ytAgg.totalShares;
    const igEngagements = igAgg.totalLikes + igAgg.totalComments + igAgg.totalShares + igAgg.totalSaves;
    const totalEngagements = ytEngagements + igEngagements;

    // Total reach: YT views + IG reach
    const totalReach = ytAgg.totalViews + igAgg.totalReach;

    // Weighted engagement rate (by content count)
    const totalContent = ytAgg.videoCount + igAgg.postCount;
    const weightedEngagementRate = totalContent > 0
      ? Math.round(
          ((ytAgg.avgEngagementRate * ytAgg.videoCount + igAgg.avgEngagementRate * igAgg.postCount)
            / totalContent) * 10000
        ) / 10000
      : 0;

    // Platform breakdown percentages
    const ytPercentage = totalEngagements > 0
      ? Math.round((ytEngagements / totalEngagements) * 10000) / 10000
      : 0;
    const igPercentage = totalEngagements > 0
      ? Math.round((igEngagements / totalEngagements) * 10000) / 10000
      : 0;

    // Growth indicators
    const subscriberToFollowerRatio = igProfile.followersCount > 0
      ? Math.round((ytChannel.subscriberCount / igProfile.followersCount) * 100) / 100
      : 0;

    // Cross-platform presence score (0-1): based on having content on both platforms
    const crossPlatformPresence = Math.min(1,
      (ytAgg.videoCount > 0 ? 0.5 : 0) + (igAgg.postCount > 0 ? 0.5 : 0)
    );

    return {
      totalEngagements,
      totalReach,
      weightedEngagementRate,
      contentCount: totalContent,
      platformBreakdown: {
        youtube: { engagements: ytEngagements, percentage: ytPercentage },
        instagram: { engagements: igEngagements, percentage: igPercentage },
      },
      growthIndicators: {
        subscriberToFollowerRatio,
        crossPlatformPresence,
      },
    };
  }

  /**
   * Ranks top content across both platforms by engagement rate.
   * Returns top 10 items sorted by engagement rate descending.
   */
  private rankTopContent(
    videos: youtube.YouTubeVideo[],
    posts: instagram.InstagramPost[]
  ): TopContentItem[] {
    const ytItems: TopContentItem[] = videos.map(v => ({
      platform: 'youtube' as const,
      contentId: v.videoId,
      title: v.title,
      engagementRate: v.engagementRate,
      totalEngagements: v.stats.likeCount + v.stats.commentCount + v.stats.shareCount,
      publishedAt: v.publishedAt,
    }));

    const igItems: TopContentItem[] = posts.map(p => ({
      platform: 'instagram' as const,
      contentId: p.postId,
      title: p.caption.substring(0, 80) + (p.caption.length > 80 ? '...' : ''),
      engagementRate: p.engagementRate,
      totalEngagements: p.stats.likeCount + p.stats.commentCount + p.stats.shareCount + p.stats.saveCount,
      publishedAt: p.publishedAt,
    }));

    return [...ytItems, ...igItems]
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, 10);
  }

  /**
   * Scores how well content aligns with trending topics.
   * Checks video titles/tags and post captions/hashtags against trend keywords.
   * Returns items with alignment score > 0, sorted descending.
   */
  private scoreTrendAlignment(
    videos: youtube.YouTubeVideo[],
    posts: instagram.InstagramPost[]
  ): TrendAlignmentItem[] {
    const alignments: TrendAlignmentItem[] = [];

    // Score YouTube videos
    for (const video of videos) {
      const titleLower = video.title.toLowerCase();
      const tagsLower = video.tags.map(t => t.toLowerCase());

      for (const keyword of TREND_KEYWORDS) {
        let score = 0;
        if (titleLower.includes(keyword)) score += 0.6;
        if (tagsLower.some(t => t.includes(keyword))) score += 0.4;

        if (score > 0) {
          alignments.push({
            keyword,
            platform: 'youtube',
            contentId: video.videoId,
            contentTitle: video.title,
            alignmentScore: Math.round(score * 100) / 100,
          });
        }
      }
    }

    // Score Instagram posts
    for (const post of posts) {
      const captionLower = post.caption.toLowerCase();
      const hashtagsLower = post.hashtags.map(h => h.toLowerCase().replace('#', ''));

      for (const keyword of TREND_KEYWORDS) {
        let score = 0;
        if (captionLower.includes(keyword)) score += 0.5;
        if (hashtagsLower.some(h => h.includes(keyword))) score += 0.5;

        if (score > 0) {
          alignments.push({
            keyword,
            platform: 'instagram',
            contentId: post.postId,
            contentTitle: post.caption.substring(0, 60),
            alignmentScore: Math.round(score * 100) / 100,
          });
        }
      }
    }

    return alignments
      .sort((a, b) => b.alignmentScore - a.alignmentScore)
      .slice(0, 15);
  }

  /**
   * Persists a dashboard snapshot to DynamoDB for historical tracking.
   * 24-hour TTL — snapshots are ephemeral summaries.
   */
  private async persistSnapshot(
    tenantId: string,
    snapshotId: string,
    dashboard: DashboardResponse
  ): Promise<void> {
    const ttl = Math.floor(Date.now() / 1000) + 86400; // 24 hours
    await this.repo.saveSnapshot({
      tenant_id: tenantId,
      snapshot_id: `snapshot#${snapshotId}`,
      data: JSON.stringify(dashboard),
      created_at: dashboard.generatedAt,
      ttl,
    });
  }
}
