// Automation Center Service
// Content scheduling, smart hashtag generation, and A/B testing simulations.

import { v4 as uuidv4 } from 'uuid';
import { TenantRepository } from '../utils/repository';
import { config } from '../config';

// ── Types ──

export interface ScheduleRequest {
  title: string;
  platform: 'youtube' | 'instagram';
  contentType?: string;
  preferredTime?: string;
  timezone?: string;
  niche?: string;
}

export interface HashtagRequest {
  topic: string;
  platform: 'youtube' | 'instagram';
  niche?: string;
  count?: number;
}

export interface ABTestRequest {
  platform: 'youtube' | 'instagram';
  variantA: { title: string; description?: string };
  variantB: { title: string; description?: string };
  niche?: string;
  followerCount?: number;
}

export interface ScheduleResult {
  scheduleId: string;
  generatedAt: string;
  bestTimes: TimeSlot[];
  weeklyPlan: WeeklySlot[];
  tips: string[];
}

export interface TimeSlot {
  dayOfWeek: string;
  time: string;
  timezone: string;
  expectedReachMultiplier: number;
  reason: string;
}

export interface WeeklySlot {
  day: string;
  slots: { time: string; contentType: string; priority: 'primary' | 'secondary' }[];
}

export interface HashtagResult {
  hashtagId: string;
  generatedAt: string;
  hashtags: HashtagSuggestion[];
  strategy: HashtagStrategy;
}

export interface HashtagSuggestion {
  tag: string;
  category: 'trending' | 'niche' | 'branded' | 'community' | 'location';
  popularity: 'high' | 'medium' | 'low';
  competitiveness: 'high' | 'medium' | 'low';
  recommended: boolean;
}

export interface HashtagStrategy {
  total: number;
  mix: { trending: number; niche: number; branded: number; community: number };
  advice: string;
}

export interface ABTestResult {
  testId: string;
  generatedAt: string;
  variantA: ABVariantPrediction;
  variantB: ABVariantPrediction;
  winner: 'A' | 'B';
  confidence: number;
  reasoning: string[];
  recommendation: string;
}

export interface ABVariantPrediction {
  title: string;
  predictedCtr: number;
  predictedEngagement: number;
  predictedReach: number;
  strengths: string[];
  weaknesses: string[];
  score: number;
}

// ── Data Templates ──

const PEAK_TIMES: Record<string, { youtube: string[]; instagram: string[] }> = {
  Monday: { youtube: ['12:00 PM', '3:00 PM', '8:00 PM'], instagram: ['11:00 AM', '1:00 PM', '7:00 PM'] },
  Tuesday: { youtube: ['2:00 PM', '4:00 PM', '9:00 PM'], instagram: ['10:00 AM', '1:00 PM', '7:00 PM'] },
  Wednesday: { youtube: ['12:00 PM', '3:00 PM', '7:00 PM'], instagram: ['11:00 AM', '2:00 PM', '8:00 PM'] },
  Thursday: { youtube: ['12:00 PM', '5:00 PM', '9:00 PM'], instagram: ['12:00 PM', '3:00 PM', '7:00 PM'] },
  Friday: { youtube: ['3:00 PM', '5:00 PM', '9:00 PM'], instagram: ['10:00 AM', '1:00 PM', '5:00 PM'] },
  Saturday: { youtube: ['9:00 AM', '12:00 PM', '7:00 PM'], instagram: ['10:00 AM', '12:00 PM', '3:00 PM'] },
  Sunday: { youtube: ['10:00 AM', '12:00 PM', '5:00 PM'], instagram: ['10:00 AM', '1:00 PM', '4:00 PM'] },
};

const NICHE_HASHTAGS: Record<string, string[]> = {
  tech: ['#tech', '#technology', '#gadgets', '#innovation', '#coding', '#developer', '#ai', '#machinelearning', '#startup', '#digital', '#techtips', '#programming', '#software', '#techreview', '#futuretech'],
  fitness: ['#fitness', '#workout', '#gym', '#fitfam', '#health', '#training', '#motivation', '#bodybuilding', '#exercise', '#fitlife', '#healthylifestyle', '#gains', '#fitnessjourney', '#yoga', '#strength'],
  food: ['#food', '#foodie', '#cooking', '#recipe', '#homemade', '#foodporn', '#yummy', '#chef', '#delicious', '#foodblogger', '#instafood', '#kitchen', '#healthyfood', '#baking', '#indianfood'],
  fashion: ['#fashion', '#style', '#ootd', '#fashionblogger', '#outfit', '#clothing', '#trendy', '#fashionista', '#streetstyle', '#lookbook', '#fashionstyle', '#designer', '#ethnic', '#indianfashion', '#saree'],
  education: ['#education', '#learning', '#study', '#knowledge', '#students', '#teacher', '#edtech', '#onlinelearning', '#courses', '#skills', '#studytips', '#exam', '#career', '#upsc', '#competitive'],
  default: ['#content', '#creator', '#viral', '#trending', '#explore', '#instagood', '#india', '#followme', '#motivation', '#lifestyle', '#reels', '#shorts', '#youtube', '#instagram', '#growthhacking'],
};

// ── Repository ──

class AutomationRepository extends TenantRepository {
  constructor() {
    super(config.tables.content);
  }

  async saveResult(tenantId: string, record: Record<string, unknown>): Promise<void> {
    await this.put(tenantId, record);
  }
}

// ── Service ──

export class AutomationService {
  private repo: AutomationRepository;

  constructor() {
    this.repo = new AutomationRepository();
  }

  async generateSchedule(tenantId: string, request: ScheduleRequest): Promise<ScheduleResult> {
    const { platform, timezone = 'IST', contentType = 'video' } = request;
    const scheduleId = uuidv4();

    const days = Object.keys(PEAK_TIMES);
    const bestTimes: TimeSlot[] = days.slice(0, 5).map((day, i) => {
      const times = PEAK_TIMES[day][platform];
      return {
        dayOfWeek: day,
        time: times[0],
        timezone,
        expectedReachMultiplier: Math.round((1.2 + Math.random() * 0.6) * 100) / 100,
        reason: `Peak audience activity on ${platform} for ${day}`,
      };
    });

    const weeklyPlan: WeeklySlot[] = days.map(day => {
      const times = PEAK_TIMES[day][platform];
      return {
        day,
        slots: [
          { time: times[0], contentType: contentType, priority: 'primary' as const },
          { time: times[1], contentType: 'story/short', priority: 'secondary' as const },
        ],
      };
    });

    const tips = [
      `Best days for ${platform}: ${bestTimes.sort((a, b) => b.expectedReachMultiplier - a.expectedReachMultiplier).slice(0, 3).map(t => t.dayOfWeek).join(', ')}`,
      `Post ${platform === 'youtube' ? '3-5' : '5-7'} times per week for optimal growth`,
      'Maintain a consistent schedule — your audience learns when to expect new content',
      `Use ${platform === 'youtube' ? 'Shorts' : 'Stories'} between main posts to stay visible in feeds`,
      'Schedule posts during lunch hours (12-2 PM IST) for maximum Indian audience reach',
    ];

    const result: ScheduleResult = { scheduleId, generatedAt: new Date().toISOString(), bestTimes, weeklyPlan, tips };

    this.repo.saveResult(tenantId, {
      tenant_id: tenantId,
      result_id: `schedule#${scheduleId}`,
      platform,
      data: JSON.stringify(result),
      created_at: new Date().toISOString(),
    }).catch(err => console.error('Failed to save schedule:', err));

    return result;
  }

  async generateHashtags(tenantId: string, request: HashtagRequest): Promise<HashtagResult> {
    const { topic, platform, niche = 'default', count = 20 } = request;
    const hashtagId = uuidv4();

    const nicheHashtags = NICHE_HASHTAGS[niche.toLowerCase()] || NICHE_HASHTAGS.default;
    const topicTag = `#${topic.replace(/\s+/g, '').toLowerCase()}`;

    const suggestions: HashtagSuggestion[] = [];

    // Topic-based tags
    suggestions.push(
      { tag: topicTag, category: 'niche', popularity: 'medium', competitiveness: 'low', recommended: true },
      { tag: `#${topic.replace(/\s+/g, '')}tips`, category: 'niche', popularity: 'low', competitiveness: 'low', recommended: true },
    );

    // Trending tags
    suggestions.push(
      { tag: '#trending', category: 'trending', popularity: 'high', competitiveness: 'high', recommended: platform === 'instagram' },
      { tag: '#viral', category: 'trending', popularity: 'high', competitiveness: 'high', recommended: false },
      { tag: platform === 'youtube' ? '#shorts' : '#reels', category: 'trending', popularity: 'high', competitiveness: 'medium', recommended: true },
    );

    // Niche tags
    for (const tag of nicheHashtags.slice(0, Math.min(10, count - 5))) {
      suggestions.push({
        tag,
        category: 'niche',
        popularity: nicheHashtags.indexOf(tag) < 5 ? 'high' : 'medium',
        competitiveness: nicheHashtags.indexOf(tag) < 3 ? 'high' : 'medium',
        recommended: nicheHashtags.indexOf(tag) < 7,
      });
    }

    // Community tags
    suggestions.push(
      { tag: '#india', category: 'location', popularity: 'high', competitiveness: 'high', recommended: true },
      { tag: '#indiancreator', category: 'community', popularity: 'medium', competitiveness: 'low', recommended: true },
      { tag: '#creatorcommunity', category: 'community', popularity: 'medium', competitiveness: 'medium', recommended: true },
    );

    const limited = suggestions.slice(0, count);
    const recommended = limited.filter(h => h.recommended);

    const strategy: HashtagStrategy = {
      total: limited.length,
      mix: {
        trending: limited.filter(h => h.category === 'trending').length,
        niche: limited.filter(h => h.category === 'niche').length,
        branded: limited.filter(h => h.category === 'branded').length,
        community: limited.filter(h => h.category === 'community' || h.category === 'location').length,
      },
      advice: platform === 'instagram'
        ? `Use ${Math.min(30, limited.length)} hashtags. Mix ${recommended.length} recommended tags with niche-specific ones.`
        : `Use 3-5 targeted hashtags in your YouTube description. Focus on niche tags for discoverability.`,
    };

    const result: HashtagResult = { hashtagId, generatedAt: new Date().toISOString(), hashtags: limited, strategy };

    this.repo.saveResult(tenantId, {
      tenant_id: tenantId,
      result_id: `hashtags#${hashtagId}`,
      platform,
      topic,
      data: JSON.stringify(result),
      created_at: new Date().toISOString(),
    }).catch(err => console.error('Failed to save hashtags:', err));

    return result;
  }

  async runABTest(tenantId: string, request: ABTestRequest): Promise<ABTestResult> {
    const { platform, variantA, variantB, followerCount = 10000 } = request;
    const testId = uuidv4();

    const scoreVariant = (title: string, desc?: string): ABVariantPrediction => {
      const text = `${title} ${desc || ''}`;
      const strengths: string[] = [];
      const weaknesses: string[] = [];

      let score = 50;

      // Length scoring
      if (title.length >= 30 && title.length <= 70) { score += 10; strengths.push('Optimal title length'); }
      else if (title.length < 20) { score -= 5; weaknesses.push('Title too short — may lack context'); }
      else if (title.length > 100) { score -= 5; weaknesses.push('Title too long — may get truncated'); }

      // Emotional triggers
      if (/[!?]/.test(title)) { score += 5; strengths.push('Uses emotional punctuation'); }
      if (/\b(how|why|what|best|top|ultimate|secret|truth)\b/i.test(title)) { score += 8; strengths.push('Contains curiosity-driving keywords'); }
      if (/\b(\d+|one|two|three|five|ten)\b/i.test(title)) { score += 7; strengths.push('Contains numbers — proven CTR booster'); }

      // Emoji presence
      if (/[\u{1F600}-\u{1F9FF}]/u.test(title)) { score += 3; strengths.push('Uses emojis for visual appeal'); }

      // Platform-specific
      if (platform === 'youtube' && /\||-|:/.test(title)) { score += 3; strengths.push('Uses separator characters for YouTube SEO'); }
      if (platform === 'instagram' && /#/.test(text)) { score += 4; strengths.push('Includes hashtags for discoverability'); }

      // Negative signals
      if (/\b(click\s*bait|fake|scam)\b/i.test(text)) { score -= 15; weaknesses.push('Contains negative-sentiment keywords'); }
      if (title === title.toUpperCase() && title.length > 5) { score -= 5; weaknesses.push('ALL CAPS may appear spammy'); }

      if (weaknesses.length === 0) weaknesses.push('No significant weaknesses detected');

      score = Math.max(10, Math.min(100, score));
      const ctr = Math.round((score / 100) * 8 * 100) / 100;
      const engagement = Math.round(score * followerCount * 0.00004 * 100) / 100;
      const reach = Math.round(followerCount * (score / 100) * 0.4);

      return { title, predictedCtr: ctr, predictedEngagement: engagement, predictedReach: reach, strengths, weaknesses, score };
    };

    const predA = scoreVariant(variantA.title, variantA.description);
    const predB = scoreVariant(variantB.title, variantB.description);
    const winner = predA.score >= predB.score ? 'A' as const : 'B' as const;
    const confidence = Math.min(0.95, Math.max(0.55, 0.5 + Math.abs(predA.score - predB.score) / 100));

    const reasoning = [
      `Variant ${winner} scores ${Math.abs(predA.score - predB.score)} points higher overall`,
      `Variant A CTR: ${predA.predictedCtr}% vs Variant B CTR: ${predB.predictedCtr}%`,
      `Predicted reach difference: ${Math.abs(predA.predictedReach - predB.predictedReach).toLocaleString()} viewers`,
    ];

    const winnerPred = winner === 'A' ? predA : predB;
    const recommendation = confidence > 0.8
      ? `Strong recommendation: Use Variant ${winner} — "${winnerPred.title}"`
      : `Slight edge to Variant ${winner}. Consider testing both with a small audience first.`;

    const result: ABTestResult = { testId, generatedAt: new Date().toISOString(), variantA: predA, variantB: predB, winner, confidence: Math.round(confidence * 100) / 100, reasoning, recommendation };

    this.repo.saveResult(tenantId, {
      tenant_id: tenantId,
      result_id: `abtest#${testId}`,
      platform,
      data: JSON.stringify(result),
      created_at: new Date().toISOString(),
    }).catch(err => console.error('Failed to save A/B test:', err));

    return result;
  }
}
