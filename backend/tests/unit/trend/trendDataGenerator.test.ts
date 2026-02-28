// Trend Data Generator Tests

import { generateTrendData, generateDailyTrendData } from '../../../src/services/trend/trendDataGenerator';

describe('Trend Data Generator', () => {
  describe('generateTrendData', () => {
    it('should generate trend data points', () => {
      const data = generateTrendData();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('keyword');
      expect(data[0]).toHaveProperty('currentVolume');
      expect(data[0]).toHaveProperty('baselineVolume');
      expect(data[0]).toHaveProperty('previousVolume');
      expect(data[0]).toHaveProperty('region');
      expect(data[0]).toHaveProperty('language');
    });

    it('should return all seed trends when no filter applied', () => {
      const data = generateTrendData();
      expect(data.length).toBeGreaterThanOrEqual(20);
    });

    it('should filter by language', () => {
      const data = generateTrendData({ language: 'hi' });
      expect(data.length).toBeGreaterThan(0);
      data.forEach(d => expect(d.language).toBe('hi'));
    });

    it('should filter by region', () => {
      const data = generateTrendData({ region: 'tamil-nadu' });
      expect(data.length).toBeGreaterThan(0);
      // Should include regional + national (india) trends
      data.forEach(d => {
        expect(['tamil-nadu', 'india']).toContain(d.region);
      });
    });

    it('should generate positive volumes', () => {
      const data = generateTrendData();
      data.forEach(d => {
        expect(d.currentVolume).toBeGreaterThan(0);
        expect(d.baselineVolume).toBeGreaterThan(0);
        expect(d.previousVolume).toBeGreaterThan(0);
      });
    });
  });

  describe('generateDailyTrendData', () => {
    it('should generate data for a specific date', () => {
      const data = generateDailyTrendData('2026-02-27');
      expect(data.length).toBeGreaterThan(0);
    });

    it('should produce consistent results for the same date', () => {
      const data1 = generateDailyTrendData('2026-01-15');
      const data2 = generateDailyTrendData('2026-01-15');

      expect(data1.length).toBe(data2.length);
      // Seeded randomness should produce identical volumes
      data1.forEach((d, i) => {
        expect(d.keyword).toBe(data2[i].keyword);
        expect(d.currentVolume).toBe(data2[i].currentVolume);
      });
    });

    it('should produce different results for different dates', () => {
      const data1 = generateDailyTrendData('2026-01-15');
      const data2 = generateDailyTrendData('2026-01-16');

      // At least some volumes should differ
      const hasDifference = data1.some((d, i) =>
        d.currentVolume !== data2[i].currentVolume
      );
      expect(hasDifference).toBe(true);
    });

    it('should apply filters with date', () => {
      const data = generateDailyTrendData('2026-02-20', { language: 'en' });
      expect(data.length).toBeGreaterThan(0);
      data.forEach(d => expect(d.language).toBe('en'));
    });
  });
});
