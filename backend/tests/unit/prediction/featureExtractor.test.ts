// Feature Extractor Tests

import { extractFeatures, featuresToVector, getFeatureNames } from '../../../src/services/prediction/featureExtractor';

describe('Feature Extractor', () => {
  describe('extractFeatures', () => {
    it('should extract all features from a YouTube content input', () => {
      const features = extractFeatures({
        title: 'Amazing AI Tutorial for Beginners! #coding',
        description: 'Learn artificial intelligence step by step in this comprehensive guide from Mumbai',
        tags: ['ai', 'tutorial', 'coding', 'beginners'],
        platform: 'youtube',
        followerCount: 10000,
        historicalEngagementRate: 0.05,
      });

      expect(features.titleLength).toBeGreaterThan(0);
      expect(features.descriptionLength).toBeGreaterThan(0);
      expect(features.titleWordCount).toBeGreaterThan(0);
      expect(features.hashtagCount).toBeGreaterThanOrEqual(1);
      expect(features.tagCount).toBe(4);
      expect(features.platform).toBe('youtube');
      expect(features.followerCount).toBe(10000);
      expect(features.historicalEngagementRate).toBe(0.05);
    });

    it('should handle minimal input', () => {
      const features = extractFeatures({
        title: 'Hello world',
        platform: 'instagram',
      });

      expect(features.titleLength).toBe(11);
      expect(features.descriptionLength).toBe(0);
      expect(features.tagCount).toBe(0);
      expect(features.platform).toBe('instagram');
      expect(features.followerCount).toBe(0);
      expect(features.historicalEngagementRate).toBe(0);
    });

    it('should detect sentiment from content', () => {
      const features = extractFeatures({
        title: 'This is an amazing and wonderful tutorial',
        platform: 'youtube',
      });

      expect(features.sentimentScore).toBeGreaterThan(0);
      expect(features.sentimentLabel).toBe('positive');
    });

    it('should count hashtags and mentions', () => {
      const features = extractFeatures({
        title: '#tech #coding @creator Check this out! #viral',
        platform: 'instagram',
      });

      expect(features.hashtagCount).toBe(3);
      expect(features.mentionCount).toBe(1);
    });

    it('should detect code-mixed content', () => {
      const features = extractFeatures({
        title: 'यह bahut accha hai bhai kya mast tutorial hai',
        platform: 'youtube',
      });

      expect(features.isCodeMixed).toBe(true);
    });

    it('should compute caps ratio', () => {
      const features = extractFeatures({
        title: 'THIS IS ALL CAPS',
        platform: 'youtube',
      });

      expect(features.capsRatio).toBeGreaterThan(0.9);
    });

    it('should compute title engagement potential', () => {
      const featuresGood = extractFeatures({
        title: 'Want to know the best coding tips for beginners?',
        platform: 'youtube',
      });

      const featuresBad = extractFeatures({
        title: 'hi',
        platform: 'youtube',
      });

      expect(featuresGood.titleEngagementPotential).toBeGreaterThan(
        featuresBad.titleEngagementPotential
      );
    });
  });

  describe('featuresToVector', () => {
    it('should return a numeric array matching feature names length', () => {
      const features = extractFeatures({
        title: 'Test video',
        platform: 'youtube',
      });

      const vector = featuresToVector(features);
      const names = getFeatureNames();

      expect(vector).toHaveLength(names.length);
      expect(vector.every(v => typeof v === 'number')).toBe(true);
    });
  });

  describe('getFeatureNames', () => {
    it('should return 25 feature names', () => {
      const names = getFeatureNames();
      expect(names).toHaveLength(25);
      expect(names).toContain('sentiment_score');
      expect(names).toContain('hashtag_count');
      expect(names).toContain('follower_count');
    });
  });
});
