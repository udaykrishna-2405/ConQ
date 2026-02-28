// Entity Extraction Tests

import { extractEntities } from '../../../src/services/nlp/entityExtractor';

describe('Entity Extractor', () => {
  describe('Hashtag extraction', () => {
    it('should extract English hashtags', () => {
      const result = extractEntities('Check out #TechTips and #CodingLife');
      expect(result.hashtagCount).toBe(2);
      const hashtags = result.entities.filter(e => e.type === 'hashtag');
      expect(hashtags).toHaveLength(2);
      expect(hashtags[0].text).toBe('#TechTips');
      expect(hashtags[1].text).toBe('#CodingLife');
      expect(hashtags[0].confidence).toBe(1.0);
    });

    it('should extract Hindi hashtags (Devanagari)', () => {
      const result = extractEntities('देखो #तकनीक और #कोडिंग');
      expect(result.hashtagCount).toBe(2);
    });
  });

  describe('Mention extraction', () => {
    it('should extract @mentions', () => {
      const result = extractEntities('Thanks @creator123 and @techguru for the collab');
      expect(result.mentionCount).toBe(2);
      const mentions = result.entities.filter(e => e.type === 'person');
      expect(mentions).toHaveLength(2);
    });
  });

  describe('Topic detection', () => {
    it('should detect technology topic', () => {
      const result = extractEntities('New AI and machine learning coding tutorial');
      const topics = result.entities.filter(e => e.type === 'topic');
      expect(topics.some(t => t.text === 'technology')).toBe(true);
    });

    it('should detect entertainment topic', () => {
      const result = extractEntities('New Bollywood movie review and drama series');
      const topics = result.entities.filter(e => e.type === 'topic');
      expect(topics.some(t => t.text === 'entertainment')).toBe(true);
    });

    it('should detect multiple topics', () => {
      const result = extractEntities('tech startup in Mumbai focusing on fitness app');
      const topics = result.entities.filter(e => e.type === 'topic');
      expect(topics.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Location detection', () => {
    it('should detect Indian cities', () => {
      const result = extractEntities('Traveling from Mumbai to Delhi');
      const locations = result.entities.filter(e => e.type === 'location');
      expect(locations.length).toBeGreaterThanOrEqual(2);
    });

    it('should detect Indian states', () => {
      const result = extractEntities('Best places to visit in Kerala and Rajasthan');
      const locations = result.entities.filter(e => e.type === 'location');
      expect(locations.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('URL handling', () => {
    it('should not extract URLs as entities', () => {
      const result = extractEntities('Check https://example.com for #updates');
      expect(result.hashtagCount).toBe(1);
      const hashtags = result.entities.filter(e => e.type === 'hashtag');
      expect(hashtags[0].text).toBe('#updates');
    });
  });

  describe('Combined extraction', () => {
    it('should extract all entity types from rich content', () => {
      const text = '@TechCreator shares #AITutorial from Mumbai about coding and technology';
      const result = extractEntities(text);

      expect(result.hashtagCount).toBeGreaterThanOrEqual(1);
      expect(result.mentionCount).toBeGreaterThanOrEqual(1);
      expect(result.entities.filter(e => e.type === 'location').length).toBeGreaterThanOrEqual(1);
      expect(result.entities.filter(e => e.type === 'topic').length).toBeGreaterThanOrEqual(1);
    });
  });
});
