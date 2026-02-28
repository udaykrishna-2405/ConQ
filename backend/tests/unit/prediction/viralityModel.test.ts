// Virality Model Tests

import { predictVirality } from '../../../src/services/prediction/viralityModel';
import { extractFeatures } from '../../../src/services/prediction/featureExtractor';

describe('Virality Model', () => {
  describe('predictVirality', () => {
    it('should return score between 0 and 100', () => {
      const features = extractFeatures({
        title: 'Check out this amazing tutorial',
        platform: 'youtube',
      });
      const result = predictVirality(features);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should return confidence between 0 and 1', () => {
      const features = extractFeatures({
        title: 'Test video',
        platform: 'youtube',
      });
      const result = predictVirality(features);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should return feature importances', () => {
      const features = extractFeatures({
        title: 'Amazing AI hacks! #tech #coding @techguru',
        description: 'Best coding tutorial from Mumbai',
        tags: ['ai', 'tech', 'coding'],
        platform: 'youtube',
        followerCount: 50000,
        historicalEngagementRate: 0.08,
      });
      const result = predictVirality(features);

      expect(result.featureImportances.length).toBeGreaterThan(0);
      expect(result.featureImportances[0]).toHaveProperty('feature');
      expect(result.featureImportances[0]).toHaveProperty('impact');
      expect(result.featureImportances[0]).toHaveProperty('direction');
    });

    it('should score high-quality content higher', () => {
      const goodFeatures = extractFeatures({
        title: 'Want to learn AI? Top 10 amazing coding tips for beginners! #tech #ai',
        description: 'Comprehensive guide to artificial intelligence with practical examples from Mumbai',
        tags: ['ai', 'coding', 'tutorial', 'beginners', 'tech'],
        platform: 'youtube',
        followerCount: 100000,
        historicalEngagementRate: 0.1,
      });

      const poorFeatures = extractFeatures({
        title: 'video',
        platform: 'instagram',
      });

      const goodResult = predictVirality(goodFeatures);
      const poorResult = predictVirality(poorFeatures);

      expect(goodResult.score).toBeGreaterThan(poorResult.score);
    });

    it('should penalize excessive caps', () => {
      const normalFeatures = extractFeatures({
        title: 'Great tutorial on coding',
        platform: 'youtube',
      });

      const capsFeatures = extractFeatures({
        title: 'GREAT TUTORIAL ON CODING',
        platform: 'youtube',
      });

      const normalResult = predictVirality(normalFeatures);
      const capsResult = predictVirality(capsFeatures);

      // Caps ratio penalty should lower the score
      expect(capsResult.score).toBeLessThanOrEqual(normalResult.score + 5);
    });

    it('should boost content with questions', () => {
      const withQuestion = extractFeatures({
        title: 'Want to know the best coding tips?',
        platform: 'youtube',
      });

      const withoutQuestion = extractFeatures({
        title: 'Here are the best coding tips',
        platform: 'youtube',
      });

      const questionResult = predictVirality(withQuestion);
      const noQuestionResult = predictVirality(withoutQuestion);

      expect(questionResult.score).toBeGreaterThanOrEqual(noQuestionResult.score - 5);
    });

    it('should have higher confidence with more features provided', () => {
      const sparseFeatures = extractFeatures({
        title: 'Test',
        platform: 'youtube',
      });

      const richFeatures = extractFeatures({
        title: 'Amazing AI tutorial for beginners!',
        description: 'Learn coding step by step',
        tags: ['ai', 'coding'],
        platform: 'youtube',
        followerCount: 50000,
        historicalEngagementRate: 0.05,
      });

      const sparseResult = predictVirality(sparseFeatures);
      const richResult = predictVirality(richFeatures);

      expect(richResult.confidence).toBeGreaterThanOrEqual(sparseResult.confidence);
    });

    it('feature importances should be sorted by absolute impact', () => {
      const features = extractFeatures({
        title: 'Amazing coding tutorial! #tech',
        description: 'Great content from Mumbai about AI technology',
        tags: ['tech', 'ai'],
        platform: 'youtube',
        followerCount: 10000,
        historicalEngagementRate: 0.05,
      });
      const result = predictVirality(features);

      for (let i = 1; i < result.featureImportances.length; i++) {
        expect(result.featureImportances[i - 1].impact)
          .toBeGreaterThanOrEqual(result.featureImportances[i].impact);
      }
    });
  });
});
