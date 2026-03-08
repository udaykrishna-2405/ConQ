// Growth Intelligence Service
// Growth forecasting, competitor benchmarking, and strategic recommendations.

import { v4 as uuidv4 } from 'uuid';
import { TenantRepository } from '../utils/repository';
import { config } from '../config';
import * as youtube from './platforms/youtube';
import * as instagram from './platforms/instagram';

// ── Types ──

export interface GrowthForecastRequest {
  platform: 'youtube' | 'instagram';
  timeframeMonths?: number;
  currentFollowers?: number;
  currentEngagementRate?: number;
  postsPerWeek?: number;
  niche?: string;
}

export interface CompetitorBenchmarkRequest {
  platform: 'youtube' | 'instagram';
  niche?: string;
  followerCount?: number;
  engagementRate?: number;
}

export interface GrowthForecastReport {
  reportId: string;
  generatedAt: string;
  forecast: GrowthProjection[];
  milestones: Milestone[];
  growthDrivers: GrowthDriver[];
  actionPlan: ActionItem[];
}

export interface GrowthProjection {
  month: number;
  label: string;
  projectedFollowers: number;
  projectedEngagementRate: number;
  projectedMonthlyViews: number;
  confidence: number;
}

export interface Milestone {
  label: string;
  targetFollowers: number;
  estimatedMonths: number;
  unlockedBenefits: string[];
}

export interface GrowthDriver {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  currentScore: number;
  recommendation: string;
}

export interface ActionItem {
  priority: number;
  action: string;
  expectedImpact: string;
  category: string;
}

export interface CompetitorBenchmarkReport {
  reportId: string;
  generatedAt: string;
  yourMetrics: BenchmarkMetrics;
  nicheAverage: BenchmarkMetrics;
  topPerformers: BenchmarkMetrics;
  percentileRank: number;
  gaps: BenchmarkGap[];
  opportunities: string[];
}

export interface BenchmarkMetrics {
  followers: number;
  engagementRate: number;
  postsPerWeek: number;
  avgViewsPerPost: number;
  growthRateMonthly: number;
}

export interface BenchmarkGap {
  metric: string;
  yourValue: number;
  benchmarkValue: number;
  gap: number;
  recommendation: string;
}

// ── Niche Data ──

const NICHE_BENCHMARKS: Record<string, { avgFollowers: number; avgEngagement: number; avgPosts: number; avgViews: number; growthRate: number }> = {
  tech: { avgFollowers: 85000, avgEngagement: 0.045, avgPosts: 4, avgViews: 12000, growthRate: 0.08 },
  fitness: { avgFollowers: 120000, avgEngagement: 0.055, avgPosts: 5, avgViews: 18000, growthRate: 0.10 },
  food: { avgFollowers: 95000, avgEngagement: 0.06, avgPosts: 5, avgViews: 15000, growthRate: 0.09 },
  fashion: { avgFollowers: 150000, avgEngagement: 0.05, avgPosts: 6, avgViews: 20000, growthRate: 0.12 },
  education: { avgFollowers: 60000, avgEngagement: 0.04, avgPosts: 3, avgViews: 8000, growthRate: 0.06 },
  gaming: { avgFollowers: 200000, avgEngagement: 0.035, avgPosts: 5, avgViews: 30000, growthRate: 0.15 },
  travel: { avgFollowers: 110000, avgEngagement: 0.05, avgPosts: 3, avgViews: 16000, growthRate: 0.07 },
  finance: { avgFollowers: 70000, avgEngagement: 0.038, avgPosts: 4, avgViews: 10000, growthRate: 0.09 },
  default: { avgFollowers: 75000, avgEngagement: 0.045, avgPosts: 4, avgViews: 10000, growthRate: 0.08 },
};

const MILESTONES_TEMPLATE = [
  { threshold: 1000, label: '1K Followers', benefits: ['Community tab access (YouTube)', 'Swipe-up stories (Instagram)', 'Basic analytics unlocked'] },
  { threshold: 10000, label: '10K Followers', benefits: ['YouTube Partner eligibility', 'Brand collaboration opportunities', 'Advanced audience insights'] },
  { threshold: 50000, label: '50K Followers', benefits: ['Mid-tier influencer status', 'Higher CPM rates', 'Platform creator programs'] },
  { threshold: 100000, label: '100K Silver Play Button', benefits: ['Silver Play Button (YouTube)', 'Premium brand deals', 'Event invitations'] },
  { threshold: 500000, label: '500K Followers', benefits: ['Major sponsorship opportunities', 'Merchandise potential', 'Speaking engagements'] },
  { threshold: 1000000, label: '1M Gold Play Button', benefits: ['Gold Play Button (YouTube)', 'Top-tier partnerships', 'Media coverage potential'] },
];

// ── Repository ──

class GrowthRepository extends TenantRepository {
  constructor() {
    super(config.tables.analytics);
  }

  async saveReport(tenantId: string, record: Record<string, unknown>): Promise<void> {
    await this.put(tenantId, record);
  }
}

// ── Service ──

export class GrowthIntelligenceService {
  private repo: GrowthRepository;

  constructor() {
    this.repo = new GrowthRepository();
  }

  async generateForecast(tenantId: string, request: GrowthForecastRequest): Promise<GrowthForecastReport> {
    const { platform, timeframeMonths = 6, niche = 'default', postsPerWeek = 4 } = request;
    const reportId = uuidv4();

    // Fetch real metrics
    let currentFollowers = request.currentFollowers || 5000;
    let currentEngagementRate = request.currentEngagementRate || 0.04;

    try {
      if (platform === 'youtube') {
        const channel = await youtube.fetchChannelMetrics(tenantId);
        currentFollowers = request.currentFollowers || channel.subscriberCount;
      } else {
        const profile = await instagram.fetchProfileMetrics(tenantId);
        currentFollowers = request.currentFollowers || profile.followersCount;
      }
    } catch { /* use defaults */ }

    const nicheBench = NICHE_BENCHMARKS[niche.toLowerCase()] || NICHE_BENCHMARKS.default;
    const contentMultiplier = Math.min(2, postsPerWeek / nicheBench.avgPosts);
    const engagementMultiplier = currentEngagementRate / nicheBench.avgEngagement;
    const baseGrowthRate = nicheBench.growthRate * contentMultiplier * Math.max(0.5, engagementMultiplier);

    // Growth projections
    const forecast: GrowthProjection[] = [];
    for (let m = 1; m <= timeframeMonths; m++) {
      const decayFactor = 1 - (m * 0.005);
      const monthlyGrowth = baseGrowthRate * decayFactor;
      const projectedFollowers = Math.round(currentFollowers * Math.pow(1 + monthlyGrowth, m));
      const projectedEngagement = Math.max(0.015, currentEngagementRate * (1 - m * 0.002));
      const projectedViews = Math.round(projectedFollowers * 0.15 * 30);

      const date = new Date();
      date.setMonth(date.getMonth() + m);
      forecast.push({
        month: m,
        label: date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        projectedFollowers,
        projectedEngagementRate: Math.round(projectedEngagement * 10000) / 10000,
        projectedMonthlyViews: projectedViews,
        confidence: Math.max(0.5, 0.95 - m * 0.05),
      });
    }

    // Milestones
    const endFollowers = forecast[forecast.length - 1]?.projectedFollowers || currentFollowers;
    const milestones: Milestone[] = MILESTONES_TEMPLATE
      .filter(m => m.threshold > currentFollowers && m.threshold <= endFollowers * 1.5)
      .map(m => {
        const monthsToReach = Math.ceil(Math.log(m.threshold / currentFollowers) / Math.log(1 + baseGrowthRate));
        return {
          label: m.label,
          targetFollowers: m.threshold,
          estimatedMonths: Math.max(1, monthsToReach),
          unlockedBenefits: m.benefits,
        };
      });

    // Growth drivers
    const growthDrivers: GrowthDriver[] = [
      { factor: 'Content Frequency', impact: postsPerWeek >= nicheBench.avgPosts ? 'high' : 'medium', currentScore: Math.min(100, Math.round((postsPerWeek / nicheBench.avgPosts) * 100)), recommendation: postsPerWeek >= nicheBench.avgPosts ? 'Maintain your current posting schedule' : `Increase from ${postsPerWeek} to ${nicheBench.avgPosts} posts/week for your niche` },
      { factor: 'Engagement Quality', impact: currentEngagementRate > nicheBench.avgEngagement ? 'high' : 'low', currentScore: Math.min(100, Math.round((currentEngagementRate / nicheBench.avgEngagement) * 100)), recommendation: currentEngagementRate > nicheBench.avgEngagement ? 'Engagement is above niche average — maintain quality' : 'Boost engagement with polls, questions, and community posts' },
      { factor: 'Consistency', impact: 'high', currentScore: 70, recommendation: 'Post at consistent times. Use scheduling tools to maintain regularity.' },
      { factor: 'Cross-Platform Presence', impact: 'medium', currentScore: 50, recommendation: 'Repurpose content across YouTube and Instagram to maximize reach' },
      { factor: 'SEO & Discoverability', impact: 'high', currentScore: 60, recommendation: 'Optimize titles, descriptions, and hashtags for search and discovery' },
    ];

    // Action plan
    const actionPlan: ActionItem[] = [
      { priority: 1, action: 'Optimize posting schedule based on audience peak hours', expectedImpact: '15-25% more reach', category: 'Content Strategy' },
      { priority: 2, action: 'Create a content series to boost subscriber loyalty', expectedImpact: '10-20% higher retention', category: 'Content Strategy' },
      { priority: 3, action: 'Engage with comments within first 30 minutes of posting', expectedImpact: '20-30% engagement boost', category: 'Community' },
      { priority: 4, action: `Collaborate with 2-3 creators in ${niche} niche`, expectedImpact: '500-2000 new followers per collab', category: 'Partnerships' },
      { priority: 5, action: 'Repurpose long-form content into Shorts/Reels', expectedImpact: '3-5x more impressions', category: 'Content Strategy' },
    ];

    const report: GrowthForecastReport = { reportId, generatedAt: new Date().toISOString(), forecast, milestones, growthDrivers, actionPlan };

    this.repo.saveReport(tenantId, {
      tenant_id: tenantId,
      report_id: `growth#${reportId}`,
      platform,
      niche,
      data: JSON.stringify(report),
      created_at: new Date().toISOString(),
    }).catch(err => console.error('Failed to save growth report:', err));

    return report;
  }

  async generateBenchmark(tenantId: string, request: CompetitorBenchmarkRequest): Promise<CompetitorBenchmarkReport> {
    const { platform, niche, followerCount = 10000, engagementRate = 0.04 } = request;
    const reportId = uuidv4();

    // Fetch real metrics
    let actualFollowers = followerCount;
    let actualEngagement = engagementRate;
    try {
      if (platform === 'youtube') {
        const channel = await youtube.fetchChannelMetrics(tenantId);
        actualFollowers = followerCount || channel.subscriberCount;
      } else {
        const profile = await instagram.fetchProfileMetrics(tenantId);
        actualFollowers = followerCount || profile.followersCount;
      }
    } catch { /* use provided values */ }

    const bench = NICHE_BENCHMARKS[(niche || 'default').toLowerCase()] || NICHE_BENCHMARKS.default;

    const yourMetrics: BenchmarkMetrics = {
      followers: actualFollowers,
      engagementRate: actualEngagement,
      postsPerWeek: 4,
      avgViewsPerPost: Math.round(actualFollowers * 0.15),
      growthRateMonthly: bench.growthRate * (actualEngagement / bench.avgEngagement),
    };

    const nicheAverage: BenchmarkMetrics = {
      followers: bench.avgFollowers,
      engagementRate: bench.avgEngagement,
      postsPerWeek: bench.avgPosts,
      avgViewsPerPost: bench.avgViews,
      growthRateMonthly: bench.growthRate,
    };

    const topPerformers: BenchmarkMetrics = {
      followers: Math.round(bench.avgFollowers * 3),
      engagementRate: Math.round(bench.avgEngagement * 1.8 * 1000) / 1000,
      postsPerWeek: Math.round(bench.avgPosts * 1.5),
      avgViewsPerPost: Math.round(bench.avgViews * 2.5),
      growthRateMonthly: Math.round(bench.growthRate * 1.5 * 100) / 100,
    };

    const percentileRank = Math.min(99, Math.max(1, Math.round(
      (actualFollowers / bench.avgFollowers) * 30 +
      (actualEngagement / bench.avgEngagement) * 40 +
      30
    )));

    const gaps: BenchmarkGap[] = [];
    if (actualFollowers < bench.avgFollowers) {
      gaps.push({ metric: 'Followers', yourValue: actualFollowers, benchmarkValue: bench.avgFollowers, gap: Math.round(((bench.avgFollowers - actualFollowers) / bench.avgFollowers) * 100), recommendation: 'Focus on discoverability and collaborations to grow followers' });
    }
    if (actualEngagement < bench.avgEngagement) {
      gaps.push({ metric: 'Engagement Rate', yourValue: actualEngagement, benchmarkValue: bench.avgEngagement, gap: Math.round(((bench.avgEngagement - actualEngagement) / bench.avgEngagement) * 100), recommendation: 'Improve content quality and community interaction' });
    }

    const opportunities = [
      `Your niche (${niche}) has a ${Math.round(bench.growthRate * 100)}% monthly growth potential`,
      percentileRank > 50 ? 'You are above average — focus on consistency to maintain momentum' : 'Room to grow — analyze top performers in your niche for content ideas',
      `Top performers post ${topPerformers.postsPerWeek} times/week — adjust your schedule accordingly`,
    ];

    const report: CompetitorBenchmarkReport = { reportId, generatedAt: new Date().toISOString(), yourMetrics, nicheAverage, topPerformers, percentileRank, gaps, opportunities };

    this.repo.saveReport(tenantId, {
      tenant_id: tenantId,
      report_id: `benchmark#${reportId}`,
      platform,
      niche,
      data: JSON.stringify(report),
      created_at: new Date().toISOString(),
    }).catch(err => console.error('Failed to save benchmark report:', err));

    return report;
  }
}
