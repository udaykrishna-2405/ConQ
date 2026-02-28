// Trend Calculator Tests

import { calculateTrendScore, calculateBatchTrendScores, TrendDataPoint } from '../../../src/services/trend/trendCalculator';

describe('Trend Calculator', () => {
  describe('calculateTrendScore', () => {
    it('should classify a spiking trend as viral', () => {
      const result = calculateTrendScore({
        keyword: 'AI Tutorial',
        currentVolume: 25000,
        baselineVolume: 5000,
        previousVolume: 10000,
        region: 'india',
        language: 'en',
      });

      expect(result.category).toBe('viral');
      expect(result.normalizedScore).toBeGreaterThanOrEqual(60);
      expect(result.growthRate).toBeGreaterThan(0);
      expect(result.velocity).toBeGreaterThan(1);
    });

    it('should classify moderate growth with positive score', () => {
      const result = calculateTrendScore({
        keyword: 'Coding Tips',
        currentVolume: 8000,
        baselineVolume: 5000,
        previousVolume: 6000,
        region: 'india',
        language: 'en',
      });

      expect(result.normalizedScore).toBeGreaterThan(0);
      expect(result.growthRate).toBeGreaterThan(0);
      expect(['emerging', 'trending', 'viral']).toContain(result.category);
    });

    it('should classify slight growth as non-viral', () => {
      const result = calculateTrendScore({
        keyword: 'New Framework',
        currentVolume: 5800,
        baselineVolume: 5000,
        previousVolume: 5200,
        region: 'india',
        language: 'en',
      });

      expect(result.normalizedScore).toBeLessThan(60);
      expect(result.growthRate).toBeGreaterThan(0);
    });

    it('should classify declining volume as declining', () => {
      const result = calculateTrendScore({
        keyword: 'Old Tech',
        currentVolume: 2000,
        baselineVolume: 5000,
        previousVolume: 3000,
        region: 'india',
        language: 'en',
      });

      expect(result.category).toBe('declining');
      expect(result.normalizedScore).toBe(0);
      expect(result.growthRate).toBeLessThan(0);
    });

    it('should handle zero baseline gracefully', () => {
      const result = calculateTrendScore({
        keyword: 'Zero Base',
        currentVolume: 100,
        baselineVolume: 0,
        previousVolume: 0,
        region: 'india',
        language: 'en',
      });

      expect(result.normalizedScore).toBe(0);
      expect(result.category).toBe('declining');
    });

    it('should return correct region and language', () => {
      const result = calculateTrendScore({
        keyword: 'Tamil Vlog',
        currentVolume: 5000,
        baselineVolume: 3000,
        previousVolume: 3500,
        region: 'tamil-nadu',
        language: 'ta',
      });

      expect(result.region).toBe('tamil-nadu');
      expect(result.language).toBe('ta');
      expect(result.keyword).toBe('Tamil Vlog');
    });

    it('should compute velocity correctly for accelerating trends', () => {
      const result = calculateTrendScore({
        keyword: 'Accelerating',
        currentVolume: 15000,
        baselineVolume: 5000,
        previousVolume: 8000,
        region: 'india',
        language: 'en',
      });

      // Current growth = (15000-5000)/5000 = 2.0
      // Previous growth = (8000-5000)/5000 = 0.6
      // Velocity = 2.0/0.6 = 3.33
      expect(result.velocity).toBeGreaterThan(1);
    });
  });

  describe('calculateBatchTrendScores', () => {
    it('should score and sort multiple trends by normalizedScore descending', () => {
      const dataPoints: TrendDataPoint[] = [
        { keyword: 'Low', currentVolume: 5100, baselineVolume: 5000, previousVolume: 5050, region: 'india', language: 'en' },
        { keyword: 'High', currentVolume: 25000, baselineVolume: 5000, previousVolume: 10000, region: 'india', language: 'en' },
        { keyword: 'Mid', currentVolume: 8000, baselineVolume: 5000, previousVolume: 6000, region: 'india', language: 'en' },
      ];

      const results = calculateBatchTrendScores(dataPoints);

      expect(results).toHaveLength(3);
      expect(results[0].keyword).toBe('High');
      expect(results[0].normalizedScore).toBeGreaterThanOrEqual(results[1].normalizedScore);
      expect(results[1].normalizedScore).toBeGreaterThanOrEqual(results[2].normalizedScore);
    });

    it('should handle empty input', () => {
      const results = calculateBatchTrendScores([]);
      expect(results).toHaveLength(0);
    });
  });
});
