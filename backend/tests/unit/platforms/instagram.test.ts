// Instagram Mock Integration Tests

import {
  fetchProfileMetrics,
  fetchPostMetrics,
  fetchAggregatedPostStats,
} from '../../../src/services/platforms/instagram';

describe('Instagram Mock Integration', () => {
  const tenantId = 'tenant_test_ig_001';

  describe('fetchProfileMetrics', () => {
    it('should return a profile with all required fields', () => {
      const profile = fetchProfileMetrics(tenantId);

      expect(profile).toHaveProperty('profileId');
      expect(profile).toHaveProperty('username');
      expect(profile).toHaveProperty('followersCount');
      expect(profile).toHaveProperty('followingCount');
      expect(profile).toHaveProperty('mediaCount');
      expect(profile).toHaveProperty('biography');
    });

    it('should return positive metrics', () => {
      const profile = fetchProfileMetrics(tenantId);

      expect(profile.followersCount).toBeGreaterThan(0);
      expect(profile.followingCount).toBeGreaterThan(0);
      expect(profile.mediaCount).toBeGreaterThan(0);
    });

    it('should return consistent results for the same tenant', () => {
      const p1 = fetchProfileMetrics(tenantId);
      const p2 = fetchProfileMetrics(tenantId);

      expect(p1.profileId).toBe(p2.profileId);
      expect(p1.username).toBe(p2.username);
    });

    it('should return a copy, not a reference', () => {
      const p1 = fetchProfileMetrics(tenantId);
      const p2 = fetchProfileMetrics(tenantId);

      p1.followersCount = 0;
      expect(p2.followersCount).toBeGreaterThan(0);
    });
  });

  describe('fetchPostMetrics', () => {
    it('should return the requested number of posts', () => {
      const posts = fetchPostMetrics(tenantId, 5);
      expect(posts).toHaveLength(5);
    });

    it('should default to 10 posts', () => {
      const posts = fetchPostMetrics(tenantId);
      expect(posts).toHaveLength(10);
    });

    it('should return posts with all required fields', () => {
      const posts = fetchPostMetrics(tenantId, 1);
      const post = posts[0];

      expect(post).toHaveProperty('postId');
      expect(post).toHaveProperty('caption');
      expect(post).toHaveProperty('mediaType');
      expect(post).toHaveProperty('mediaUrl');
      expect(post).toHaveProperty('permalink');
      expect(post).toHaveProperty('publishedAt');
      expect(post).toHaveProperty('hashtags');
      expect(post).toHaveProperty('stats');
      expect(post).toHaveProperty('engagementRate');
    });

    it('should return valid media types', () => {
      const posts = fetchPostMetrics(tenantId, 6);

      posts.forEach(post => {
        expect(['image', 'video', 'carousel']).toContain(post.mediaType);
      });
    });

    it('should return posts with valid stats', () => {
      const posts = fetchPostMetrics(tenantId, 3);

      posts.forEach(post => {
        expect(post.stats.likeCount).toBeGreaterThanOrEqual(0);
        expect(post.stats.commentCount).toBeGreaterThanOrEqual(0);
        expect(post.stats.shareCount).toBeGreaterThanOrEqual(0);
        expect(post.stats.saveCount).toBeGreaterThanOrEqual(0);
        expect(post.stats.reachCount).toBeGreaterThan(0);
        expect(post.stats.impressionCount).toBeGreaterThan(0);
        expect(post.engagementRate).toBeGreaterThan(0);
        expect(post.engagementRate).toBeLessThan(1);
      });
    });

    it('should return posts with hashtags', () => {
      const posts = fetchPostMetrics(tenantId, 3);

      posts.forEach(post => {
        expect(Array.isArray(post.hashtags)).toBe(true);
        expect(post.hashtags.length).toBeGreaterThan(0);
        post.hashtags.forEach(h => expect(h.startsWith('#')).toBe(true));
      });
    });

    it('should return impressions >= reach', () => {
      const posts = fetchPostMetrics(tenantId, 5);

      posts.forEach(post => {
        expect(post.stats.impressionCount).toBeGreaterThanOrEqual(post.stats.reachCount);
      });
    });
  });

  describe('fetchAggregatedPostStats', () => {
    it('should return aggregated stats with all fields', () => {
      const stats = fetchAggregatedPostStats(tenantId);

      expect(stats).toHaveProperty('totalLikes');
      expect(stats).toHaveProperty('totalComments');
      expect(stats).toHaveProperty('totalShares');
      expect(stats).toHaveProperty('totalSaves');
      expect(stats).toHaveProperty('totalReach');
      expect(stats).toHaveProperty('totalImpressions');
      expect(stats).toHaveProperty('avgEngagementRate');
      expect(stats).toHaveProperty('postCount');
    });

    it('should return positive totals', () => {
      const stats = fetchAggregatedPostStats(tenantId);

      expect(stats.totalLikes).toBeGreaterThan(0);
      expect(stats.totalReach).toBeGreaterThan(0);
      expect(stats.totalImpressions).toBeGreaterThan(0);
      expect(stats.postCount).toBe(20);
    });

    it('should have avgEngagementRate between 0 and 1', () => {
      const stats = fetchAggregatedPostStats(tenantId);

      expect(stats.avgEngagementRate).toBeGreaterThan(0);
      expect(stats.avgEngagementRate).toBeLessThan(1);
    });

    it('should have totalImpressions >= totalReach', () => {
      const stats = fetchAggregatedPostStats(tenantId);
      expect(stats.totalImpressions).toBeGreaterThanOrEqual(stats.totalReach);
    });
  });
});
