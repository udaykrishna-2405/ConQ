// Trend Service – Orchestrator
// Combines trend data generation, scoring, and persistence.
// Simulates a scheduled Lambda that runs daily (EventBridge cron).
// All trends are stored per date for historical tracking.

import { v4 as uuidv4 } from 'uuid';
import { generateTrendData, generateDailyTrendData } from './trend/trendDataGenerator';
import { calculateBatchTrendScores } from './trend/trendCalculator';
import { Trend } from '../models/schemas';
import { TenantRepository } from '../utils/repository';
import { config } from '../config';

export interface TrendQuery {
  region?: string;
  language?: string;
  category?: 'emerging' | 'trending' | 'viral' | 'declining';
  limit?: number;
  date?: string;
}

export interface TrendResponse {
  date: string;
  region: string;
  totalTrends: number;
  trends: TrendItem[];
  summary: {
    viral: number;
    trending: number;
    emerging: number;
    declining: number;
  };
}

export interface TrendItem {
  trendId: string;
  keyword: string;
  category: 'emerging' | 'trending' | 'viral' | 'declining';
  score: number;
  normalizedScore: number;
  velocity: number;
  growthRate: number;
  region: string;
  language: string;
}

class TrendRepository extends TenantRepository {
  constructor() {
    super(config.tables.trends);
  }

  async saveTrend(trend: Trend): Promise<void> {
    await this.put(trend.tenant_id, trend as unknown as Record<string, unknown>);
  }

  async getTrendsByDate(tenantId: string, date: string): Promise<Trend[]> {
    return this.queryWithSortKey<Trend>(
      tenantId,
      'trend_id',
      'begins_with(#sk, :skv)',
      date
    );
  }
}

export class TrendService {
  private repo: TrendRepository;

  constructor() {
    this.repo = new TrendRepository();
  }

  /**
   * Fetches current trends with optional filtering.
   * In production, reads from DynamoDB (populated by scheduled Lambda).
   * In MVP, generates trends on-demand from mock data.
   */
  async getTrends(query: TrendQuery = {}): Promise<TrendResponse> {
    const date = query.date || new Date().toISOString().split('T')[0];
    const region = query.region || 'india';
    const limit = query.limit || 25;

    // Generate trend data (mock — in production, read from DynamoDB)
    const dataPoints = generateDailyTrendData(date, {
      region: query.region,
      language: query.language,
    });

    // Score all trends
    let scoredTrends = calculateBatchTrendScores(dataPoints);

    // Filter by category if specified
    if (query.category) {
      scoredTrends = scoredTrends.filter(t => t.category === query.category);
    }

    // Apply limit
    const limitedTrends = scoredTrends.slice(0, limit);

    // Build response
    const trends: TrendItem[] = limitedTrends.map(t => ({
      trendId: uuidv4(),
      keyword: t.keyword,
      category: t.category,
      score: t.score,
      normalizedScore: t.normalizedScore,
      velocity: t.velocity,
      growthRate: t.growthRate,
      region: t.region,
      language: t.language,
    }));

    // Summary counts (across all scored trends, not just limited)
    const summary = {
      viral: scoredTrends.filter(t => t.category === 'viral').length,
      trending: scoredTrends.filter(t => t.category === 'trending').length,
      emerging: scoredTrends.filter(t => t.category === 'emerging').length,
      declining: scoredTrends.filter(t => t.category === 'declining').length,
    };

    return {
      date,
      region,
      totalTrends: scoredTrends.length,
      trends,
      summary,
    };
  }

  /**
   * Simulates the scheduled Lambda that processes and stores daily trends.
   * In production, this runs on an EventBridge schedule (e.g., every 6 hours).
   */
  async processDailyTrends(tenantId: string): Promise<number> {
    const date = new Date().toISOString().split('T')[0];
    const dataPoints = generateTrendData();
    const scored = calculateBatchTrendScores(dataPoints);

    // Persist each trend to DynamoDB
    const savePromises = scored.map(t => {
      const trend: Trend = {
        tenant_id: tenantId,
        trend_id: `${date}#${uuidv4().slice(0, 8)}`,
        keyword: t.keyword,
        category: t.category,
        score: t.normalizedScore,
        velocity: t.velocity,
        region: t.region,
        language: t.language,
        date,
        created_at: new Date().toISOString(),
      };
      return this.repo.saveTrend(trend);
    });

    await Promise.allSettled(savePromises);
    return scored.length;
  }
}
