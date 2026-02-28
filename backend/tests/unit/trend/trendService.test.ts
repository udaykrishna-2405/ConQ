// TrendService Integration Tests

import { TrendService } from '../../../src/services/trendService';

// Mock DynamoDB to avoid real AWS calls
jest.mock('../../../src/utils/dynamodb', () => ({
  dynamoDb: {
    send: jest.fn().mockResolvedValue({ Items: [] }),
  },
}));

describe('TrendService', () => {
  const service = new TrendService();

  describe('getTrends', () => {
    it('should return trends with default parameters', async () => {
      const result = await service.getTrends();

      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('region', 'india');
      expect(result).toHaveProperty('totalTrends');
      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('summary');
      expect(result.trends.length).toBeGreaterThan(0);
    });

    it('should return trends with summary counts', async () => {
      const result = await service.getTrends();

      expect(result.summary).toHaveProperty('viral');
      expect(result.summary).toHaveProperty('trending');
      expect(result.summary).toHaveProperty('emerging');
      expect(result.summary).toHaveProperty('declining');

      const totalCounted = result.summary.viral + result.summary.trending +
        result.summary.emerging + result.summary.declining;
      expect(totalCounted).toBe(result.totalTrends);
    });

    it('should filter by language', async () => {
      const result = await service.getTrends({ language: 'hi' });

      result.trends.forEach(t => {
        expect(t.language).toBe('hi');
      });
    });

    it('should filter by category', async () => {
      const result = await service.getTrends({ category: 'viral' });

      result.trends.forEach(t => {
        expect(t.category).toBe('viral');
      });
    });

    it('should respect limit parameter', async () => {
      const result = await service.getTrends({ limit: 5 });
      expect(result.trends.length).toBeLessThanOrEqual(5);
    });

    it('should return trend items with all required fields', async () => {
      const result = await service.getTrends({ limit: 1 });

      if (result.trends.length > 0) {
        const trend = result.trends[0];
        expect(trend).toHaveProperty('trendId');
        expect(trend).toHaveProperty('keyword');
        expect(trend).toHaveProperty('category');
        expect(trend).toHaveProperty('score');
        expect(trend).toHaveProperty('normalizedScore');
        expect(trend).toHaveProperty('velocity');
        expect(trend).toHaveProperty('growthRate');
        expect(trend).toHaveProperty('region');
        expect(trend).toHaveProperty('language');
      }
    });

    it('should accept a specific date', async () => {
      const result = await service.getTrends({ date: '2026-01-15' });
      expect(result.date).toBe('2026-01-15');
    });
  });
});
