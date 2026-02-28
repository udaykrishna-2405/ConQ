import {
  sendTrendAlertEmail,
  detectAlertableTrends,
  TrendAlert,
} from '../../src/services/notificationService';

const mockAlerts: TrendAlert[] = [
  { keyword: 'AI tools', category: 'viral', score: 92, velocity: 150, region: 'India' },
  { keyword: 'React tips', category: 'emerging', score: 65, velocity: 80, region: 'India' },
  { keyword: 'fitness goals', category: 'trending', score: 75, velocity: 40, region: 'India' },
  { keyword: 'old news', category: 'declining', score: 20, velocity: -10, region: 'India' },
];

describe('notificationService', () => {
  describe('detectAlertableTrends', () => {
    it('returns viral trends above score threshold', () => {
      const alerts = detectAlertableTrends(mockAlerts);
      const viral = alerts.filter(a => a.category === 'viral');
      expect(viral).toHaveLength(1);
      expect(viral[0].keyword).toBe('AI tools');
    });

    it('returns emerging trends above velocity threshold', () => {
      const alerts = detectAlertableTrends(mockAlerts);
      const emerging = alerts.filter(a => a.category === 'emerging');
      expect(emerging).toHaveLength(1);
      expect(emerging[0].keyword).toBe('React tips');
    });

    it('excludes regular trending and declining', () => {
      const alerts = detectAlertableTrends(mockAlerts);
      expect(alerts).toHaveLength(2);
      expect(alerts.find(a => a.keyword === 'fitness goals')).toBeUndefined();
      expect(alerts.find(a => a.keyword === 'old news')).toBeUndefined();
    });

    it('respects custom thresholds', () => {
      const alerts = detectAlertableTrends(mockAlerts, {
        viralMinScore: 95,
        emergingMinVelocity: 100,
      });
      expect(alerts).toHaveLength(0);
    });

    it('returns empty array when no trends match', () => {
      const alerts = detectAlertableTrends([
        { keyword: 'some topic', category: 'trending', score: 50, velocity: 20, region: 'India' },
      ]);
      expect(alerts).toHaveLength(0);
    });
  });

  describe('sendTrendAlertEmail', () => {
    it('returns true for empty alerts (no-op)', async () => {
      const result = await sendTrendAlertEmail('test@example.com', 'Test', []);
      expect(result).toBe(true);
    });

    it('returns true in dev mode (logs to console)', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = await sendTrendAlertEmail(
        'creator@example.com',
        'Creator',
        [mockAlerts[0]]
      );
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[NotificationService]')
      );
      consoleSpy.mockRestore();
    });

    it('includes viral count in subject when viral trends present', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await sendTrendAlertEmail('user@test.com', 'User', [mockAlerts[0], mockAlerts[1]]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('1 viral trend detected')
      );
      consoleSpy.mockRestore();
    });

    it('uses generic subject when no viral trends', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await sendTrendAlertEmail('user@test.com', 'User', [mockAlerts[1]]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('1 new trend detected')
      );
      consoleSpy.mockRestore();
    });
  });
});
