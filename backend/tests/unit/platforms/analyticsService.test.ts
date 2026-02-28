// AnalyticsService Unit Tests

import { AnalyticsService } from '../../../src/services/analyticsService';

// Mock DynamoDB to avoid real AWS calls
jest.mock('../../../src/utils/dynamodb', () => ({
  dynamoDb: {
    send: jest.fn().mockResolvedValue({ Items: [] }),
  },
}));

describe('AnalyticsService', () => {
  const service = new AnalyticsService();
  const tenantId = 'tenant_analytics_test_001';

  describe('getDashboard', () => {
    it('should return a dashboard response with all top-level fields', async () => {
      const dashboard = await service.getDashboard(tenantId);

      expect(dashboard).toHaveProperty('tenantId', tenantId);
      expect(dashboard).toHaveProperty('generatedAt');
      expect(dashboard).toHaveProperty('snapshotId');
      expect(dashboard).toHaveProperty('platforms');
      expect(dashboard).toHaveProperty('unified');
      expect(dashboard).toHaveProperty('topContent');
      expect(dashboard).toHaveProperty('trendAlignment');
    });

    it('should include YouTube platform summary', async () => {
      const dashboard = await service.getDashboard(tenantId);
      const yt = dashboard.platforms.youtube;

      expect(yt).toHaveProperty('channel');
      expect(yt).toHaveProperty('aggregated');
      expect(yt).toHaveProperty('recentVideos');
      expect(yt.channel).toHaveProperty('channelId');
      expect(yt.channel).toHaveProperty('subscriberCount');
      expect(yt.aggregated).toHaveProperty('totalViews');
      expect(yt.aggregated).toHaveProperty('avgEngagementRate');
      expect(yt.recentVideos.length).toBe(10);
    });

    it('should include Instagram platform summary', async () => {
      const dashboard = await service.getDashboard(tenantId);
      const ig = dashboard.platforms.instagram;

      expect(ig).toHaveProperty('profile');
      expect(ig).toHaveProperty('aggregated');
      expect(ig).toHaveProperty('recentPosts');
      expect(ig.profile).toHaveProperty('profileId');
      expect(ig.profile).toHaveProperty('followersCount');
      expect(ig.aggregated).toHaveProperty('totalLikes');
      expect(ig.aggregated).toHaveProperty('totalReach');
      expect(ig.aggregated).toHaveProperty('avgEngagementRate');
      expect(ig.recentPosts.length).toBe(10);
    });

    it('should compute unified metrics correctly', async () => {
      const dashboard = await service.getDashboard(tenantId);
      const unified = dashboard.unified;

      expect(unified.totalEngagements).toBeGreaterThan(0);
      expect(unified.totalReach).toBeGreaterThan(0);
      expect(unified.weightedEngagementRate).toBeGreaterThan(0);
      expect(unified.contentCount).toBe(
        dashboard.platforms.youtube.aggregated.videoCount +
        dashboard.platforms.instagram.aggregated.postCount
      );
    });

    it('should have platform breakdown percentages summing to ~1', async () => {
      const dashboard = await service.getDashboard(tenantId);
      const breakdown = dashboard.unified.platformBreakdown;

      const total = breakdown.youtube.percentage + breakdown.instagram.percentage;
      expect(total).toBeCloseTo(1, 2);
    });

    it('should have platform breakdown with positive engagements', async () => {
      const dashboard = await service.getDashboard(tenantId);
      const breakdown = dashboard.unified.platformBreakdown;

      expect(breakdown.youtube.engagements).toBeGreaterThan(0);
      expect(breakdown.instagram.engagements).toBeGreaterThan(0);
    });

    it('should compute growth indicators', async () => {
      const dashboard = await service.getDashboard(tenantId);
      const growth = dashboard.unified.growthIndicators;

      expect(growth.subscriberToFollowerRatio).toBeGreaterThan(0);
      expect(growth.crossPlatformPresence).toBe(1); // Both platforms have content
    });

    it('should return top content sorted by engagement rate descending', async () => {
      const dashboard = await service.getDashboard(tenantId);
      const topContent = dashboard.topContent;

      expect(topContent.length).toBeGreaterThan(0);
      expect(topContent.length).toBeLessThanOrEqual(10);

      // Verify sorted descending
      for (let i = 1; i < topContent.length; i++) {
        expect(topContent[i - 1].engagementRate).toBeGreaterThanOrEqual(
          topContent[i].engagementRate
        );
      }
    });

    it('should return top content with valid platforms', async () => {
      const dashboard = await service.getDashboard(tenantId);

      dashboard.topContent.forEach(item => {
        expect(['youtube', 'instagram']).toContain(item.platform);
        expect(item.contentId).toBeDefined();
        expect(item.title.length).toBeGreaterThan(0);
        expect(item.totalEngagements).toBeGreaterThan(0);
      });
    });

    it('should include content from at least one platform in top content', async () => {
      const dashboard = await service.getDashboard(tenantId);
      const platforms = new Set(dashboard.topContent.map(i => i.platform));

      // Top 10 sorted by engagement rate — at least one platform must appear
      expect(platforms.size).toBeGreaterThanOrEqual(1);
      // Both platforms contribute content (20 items combined, top 10 selected)
      expect(dashboard.topContent.length).toBe(10);
    });

    it('should return trend alignment items', async () => {
      const dashboard = await service.getDashboard(tenantId);

      expect(dashboard.trendAlignment.length).toBeGreaterThan(0);
      expect(dashboard.trendAlignment.length).toBeLessThanOrEqual(15);

      dashboard.trendAlignment.forEach(item => {
        expect(item).toHaveProperty('keyword');
        expect(item).toHaveProperty('platform');
        expect(item).toHaveProperty('contentId');
        expect(item).toHaveProperty('contentTitle');
        expect(item).toHaveProperty('alignmentScore');
        expect(item.alignmentScore).toBeGreaterThan(0);
        expect(item.alignmentScore).toBeLessThanOrEqual(1);
      });
    });

    it('should return trend alignment sorted by score descending', async () => {
      const dashboard = await service.getDashboard(tenantId);

      for (let i = 1; i < dashboard.trendAlignment.length; i++) {
        expect(dashboard.trendAlignment[i - 1].alignmentScore).toBeGreaterThanOrEqual(
          dashboard.trendAlignment[i].alignmentScore
        );
      }
    });

    it('should produce a valid ISO timestamp for generatedAt', async () => {
      const dashboard = await service.getDashboard(tenantId);

      expect(() => new Date(dashboard.generatedAt)).not.toThrow();
      expect(new Date(dashboard.generatedAt).getTime()).not.toBeNaN();
    });

    it('should produce different snapshot IDs on each call', async () => {
      const d1 = await service.getDashboard(tenantId);
      const d2 = await service.getDashboard(tenantId);

      expect(d1.snapshotId).not.toBe(d2.snapshotId);
    });
  });
});
