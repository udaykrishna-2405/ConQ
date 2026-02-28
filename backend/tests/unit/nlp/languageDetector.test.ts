// Language Detection Tests

import { detectLanguage } from '../../../src/services/nlp/languageDetector';

describe('Language Detector', () => {
  describe('English text', () => {
    it('should detect English text', () => {
      const result = detectLanguage('This is a great video about technology');
      expect(result.language).toBe('en');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.isCodeMixed).toBe(false);
    });
  });

  describe('Hindi text (Devanagari)', () => {
    it('should detect Hindi text in Devanagari script', () => {
      const result = detectLanguage('यह एक बहुत अच्छा वीडियो है');
      expect(result.language).toBe('hi');
      expect(result.script).toBe('Devanagari');
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Code-mixed text', () => {
    it('should detect Devanagari-Latin code mixing', () => {
      const result = detectLanguage('This video बहुत अच्छा है and I loved it');
      expect(result.isCodeMixed).toBe(true);
      expect(result.detectedLanguages.length).toBeGreaterThan(1);
    });

    it('should detect Romanized Hindi (Hinglish)', () => {
      const result = detectLanguage('yeh bahut accha hai bhai kya mast video hai');
      expect(result.language).toBe('hi-Latn');
      expect(result.isCodeMixed).toBe(true);
    });
  });

  describe('Regional languages', () => {
    it('should detect Bengali script', () => {
      const result = detectLanguage('এটি একটি ভিডিও');
      expect(result.language).toBe('bn');
      expect(result.script).toBe('Bengali');
    });

    it('should detect Tamil script', () => {
      const result = detectLanguage('இது ஒரு வீடியோ');
      expect(result.language).toBe('ta');
      expect(result.script).toBe('Tamil');
    });

    it('should detect Telugu script', () => {
      const result = detectLanguage('ఇది ఒక వీడియో');
      expect(result.language).toBe('te');
      expect(result.script).toBe('Telugu');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty-like text (numbers/symbols only)', () => {
      const result = detectLanguage('12345 !@#$%');
      expect(result.language).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    it('should handle single word', () => {
      const result = detectLanguage('hello');
      expect(result.language).toBe('en');
    });
  });
});
