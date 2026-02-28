// Entity Extraction Module
// Rule-based entity extraction for social media content.
// Extracts: hashtags, mentions, topics, locations, and persons.
//
// For production, replace with fine-tuned NER model (IndicNER or
// multilingual spaCy) via SageMaker endpoint.

import { Entity } from '../../models/schemas';

interface EntityExtractionResult {
  entities: Entity[];
  hashtagCount: number;
  mentionCount: number;
}

// Pattern-based extractors
const HASHTAG_REGEX = /#[\w\u0900-\u0D7F]+/g;
const MENTION_REGEX = /@[\w.]+/g;
const URL_REGEX = /https?:\/\/[\S]+/g;

// Topic keyword lists
const TOPIC_KEYWORDS: Record<string, string[]> = {
  'technology': ['tech', 'ai', 'ml', 'coding', 'programming', 'software', 'app', 'startup', 'digital', 'computer', 'data', 'cloud', 'algorithm'],
  'entertainment': ['movie', 'film', 'music', 'song', 'dance', 'bollywood', 'hollywood', 'drama', 'comedy', 'series', 'web series', 'ott'],
  'food': ['food', 'recipe', 'cooking', 'restaurant', 'khana', 'biryani', 'paneer', 'dal', 'chai', 'coffee', 'street food'],
  'travel': ['travel', 'trip', 'tour', 'destination', 'hotel', 'flight', 'adventure', 'trek', 'beach', 'mountain', 'safari'],
  'fitness': ['fitness', 'gym', 'workout', 'yoga', 'health', 'diet', 'exercise', 'weight', 'protein', 'muscle'],
  'fashion': ['fashion', 'style', 'outfit', 'dress', 'beauty', 'makeup', 'skincare', 'grooming', 'trend'],
  'education': ['education', 'study', 'exam', 'college', 'university', 'course', 'learning', 'class', 'teacher', 'student'],
  'finance': ['finance', 'money', 'invest', 'stock', 'market', 'crypto', 'bitcoin', 'trading', 'mutual fund', 'sip', 'bank'],
  'gaming': ['game', 'gaming', 'esports', 'pubg', 'bgmi', 'valorant', 'minecraft', 'gta', 'ps5', 'xbox'],
  'cricket': ['cricket', 'ipl', 'match', 'wicket', 'run', 'bowler', 'batsman', 'innings', 'test match', 'odi', 't20'],
};

// Indian location patterns
const INDIAN_LOCATIONS = [
  'mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai',
  'kolkata', 'pune', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh',
  'goa', 'kerala', 'kashmir', 'rajasthan', 'gujarat', 'maharashtra',
  'karnataka', 'tamil nadu', 'andhra pradesh', 'telangana', 'west bengal',
  'uttar pradesh', 'madhya pradesh', 'bihar', 'odisha', 'assam',
  'india', 'bharat', 'hindustan',
];

const extractHashtags = (text: string): Entity[] => {
  const matches = text.match(HASHTAG_REGEX) || [];
  return matches.map(tag => ({
    text: tag,
    type: 'hashtag' as const,
    confidence: 1.0,
  }));
};

const extractMentions = (text: string): Entity[] => {
  const matches = text.match(MENTION_REGEX) || [];
  return matches.map(mention => ({
    text: mention,
    type: 'person' as const,
    confidence: 0.7,
  }));
};

const extractTopics = (text: string): Entity[] => {
  const lowerText = text.toLowerCase();
  const topics: Entity[] = [];
  const seen = new Set<string>();

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword) && !seen.has(topic)) {
        seen.add(topic);
        topics.push({
          text: topic,
          type: 'topic',
          confidence: 0.7,
        });
        break;
      }
    }
  }

  return topics;
};

const extractLocations = (text: string): Entity[] => {
  const lowerText = text.toLowerCase();
  const locations: Entity[] = [];
  const seen = new Set<string>();

  for (const location of INDIAN_LOCATIONS) {
    if (lowerText.includes(location) && !seen.has(location)) {
      seen.add(location);
      locations.push({
        text: location.charAt(0).toUpperCase() + location.slice(1),
        type: 'location',
        confidence: 0.75,
      });
    }
  }

  return locations;
};

export const extractEntities = (text: string): EntityExtractionResult => {
  // Remove URLs before processing
  const cleanText = text.replace(URL_REGEX, '');

  const hashtags = extractHashtags(cleanText);
  const mentions = extractMentions(cleanText);
  const topics = extractTopics(cleanText);
  const locations = extractLocations(cleanText);

  const entities = [...hashtags, ...mentions, ...locations, ...topics];

  return {
    entities,
    hashtagCount: hashtags.length,
    mentionCount: mentions.length,
  };
};
