// Sentiment Analysis Tests

import { analyzeSentiment } from '../../../src/services/nlp/sentimentAnalyzer';

describe('Sentiment Analyzer', () => {
  describe('English sentiment', () => {
    it('should detect positive sentiment', () => {
      const result = analyzeSentiment('This is an amazing and wonderful video', 'en');
      expect(result.sentiment).toBe('positive');
      expect(result.score).toBeGreaterThan(0);
      expect(result.breakdown.positiveWords.length).toBeGreaterThan(0);
    });

    it('should detect negative sentiment', () => {
      const result = analyzeSentiment('This is terrible and horrible content', 'en');
      expect(result.sentiment).toBe('negative');
      expect(result.score).toBeLessThan(0);
      expect(result.breakdown.negativeWords.length).toBeGreaterThan(0);
    });

    it('should detect neutral sentiment', () => {
      const result = analyzeSentiment('The event will take place on Tuesday at the venue', 'en');
      expect(result.sentiment).toBe('neutral');
    });

    it('should handle negation', () => {
      const result = analyzeSentiment('This is not good at all', 'en');
      expect(result.score).toBeLessThanOrEqual(0);
    });

    it('should handle intensifiers', () => {
      const resultNormal = analyzeSentiment('This is good', 'en');
      const resultIntensified = analyzeSentiment('This is very good', 'en');
      expect(resultIntensified.breakdown.positiveScore)
        .toBeGreaterThanOrEqual(resultNormal.breakdown.positiveScore);
    });
  });

  describe('Hindi sentiment (Devanagari)', () => {
    it('should detect positive Hindi sentiment', () => {
      const result = analyzeSentiment('यह शानदार वीडियो है बहुत अच्छा', 'hi');
      expect(result.sentiment).toBe('positive');
      expect(result.breakdown.positiveWords.length).toBeGreaterThan(0);
    });

    it('should detect negative Hindi sentiment', () => {
      const result = analyzeSentiment('यह बकवास और बेकार है', 'hi');
      expect(result.sentiment).toBe('negative');
      expect(result.breakdown.negativeWords.length).toBeGreaterThan(0);
    });
  });

  describe('Romanized Hindi sentiment', () => {
    it('should detect positive Romanized Hindi', () => {
      const result = analyzeSentiment('zabardast video hai lajawab content', 'hi-Latn');
      expect(result.sentiment).toBe('positive');
    });

    it('should detect negative Romanized Hindi', () => {
      const result = analyzeSentiment('bekaar content bakwas video ghatiya', 'hi-Latn');
      expect(result.sentiment).toBe('negative');
    });
  });

  describe('Mixed sentiment', () => {
    it('should detect mixed sentiment', () => {
      const result = analyzeSentiment('The video was amazing but the audio was terrible', 'en');
      expect(['mixed', 'positive', 'negative']).toContain(result.sentiment);
      expect(result.breakdown.positiveWords.length).toBeGreaterThan(0);
      expect(result.breakdown.negativeWords.length).toBeGreaterThan(0);
    });
  });

  describe('Confidence', () => {
    it('should return confidence between 0 and 1', () => {
      const result = analyzeSentiment('great amazing video', 'en');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
});
