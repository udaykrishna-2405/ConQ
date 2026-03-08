// Creator Scorecard Service
// Comprehensive scoring algorithms, brand strength analysis, and creator assessment.

import { v4 as uuidv4 } from 'uuid';
import { TenantRepository } from '../utils/repository';
import { config } from '../config';
import * as youtube from './platforms/youtube';
import * as instagram from './platforms/instagram';

// ── Types ──

export interface ScorecardRequest {
  platform: 'youtube' | 'instagram';
  niche?: string;
  followerCount?: number;
  engagementRate?: number;
  postsPerWeek?: number;
  avgViews?: number;
  contentQuality?: number;
}

export interface CreatorScorecard {
  scorecardId: string;
  generatedAt: string;
  overallScore: number;
  grade: string;
  tier: 'nano' | 'micro' | 'mid' | 'macro' | 'mega';
  dimensions: ScoreDimension[];
  brandStrength: BrandStrength;
  peerComparison: PeerComparison;
  improvementPlan: ImprovementItem[];
  badges: Badge[];
}

export interface ScoreDimension {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  description: string;
  tips: string[];
}

export interface BrandStrength {
  score: number;
  pillars: { name: string; score: number; description: string }[];
  dealReadiness: 'ready' | 'almost' | 'needs_work';
  estimatedBrandValue: number;
  currency: string;
}

export interface PeerComparison {
  percentile: number;
  nicheName: string;
  avgScore: number;
  topScore: number;
  ranking: string;
}

export interface ImprovementItem {
  priority: number;
  dimension: string;
  currentScore: number;
  targetScore: number;
  action: string;
  expectedImpact: string;
}

export interface Badge {
  name: string;
  icon: string;
  description: string;
  earned: boolean;
  requirement: string;
}

// ── Repository ──

class ScorecardRepository extends TenantRepository {
  constructor() {
    super(config.tables.analytics);
  }

  async saveScorecard(tenantId: string, record: Record<string, unknown>): Promise<void> {
    await this.put(tenantId, record);
  }
}

// ── Service ──

export class CreatorScorecardService {
  private repo: ScorecardRepository;

  constructor() {
    this.repo = new ScorecardRepository();
  }

  async generateScorecard(tenantId: string, request: ScorecardRequest): Promise<CreatorScorecard> {
    const { platform, niche = 'default' } = request;
    const scorecardId = uuidv4();

    // Fetch real metrics
    let followerCount = request.followerCount || 5000;
    let engagementRate = request.engagementRate || 0.04;
    let avgViews = request.avgViews || 2000;
    const postsPerWeek = request.postsPerWeek || 3;
    // contentQuality arrives as 0-10 from frontend, scale to 0-100
    const rawQuality = request.contentQuality;
    const contentQuality = rawQuality !== undefined ? Math.round(rawQuality * 10) : 70;

    try {
      if (platform === 'youtube') {
        const channel = await youtube.fetchChannelMetrics(tenantId);
        followerCount = request.followerCount || channel.subscriberCount;
        avgViews = request.avgViews || Math.round(channel.viewCount / Math.max(channel.videoCount, 1));
      } else {
        const profile = await instagram.fetchProfileMetrics(tenantId);
        followerCount = request.followerCount || profile.followersCount;
      }
    } catch { /* use defaults */ }

    // Determine tier
    const tier = this.determineTier(followerCount);

    // Score dimensions (each out of 100, weighted)
    const dimensions: ScoreDimension[] = [
      {
        name: 'Audience Size',
        score: Math.min(100, Math.round(Math.log10(Math.max(followerCount, 1)) * 20)),
        maxScore: 100,
        weight: 0.2,
        description: `${followerCount.toLocaleString()} followers on ${platform}`,
        tips: followerCount < 10000
          ? ['Collaborate with similar-sized creators', 'Use trending hashtags and Shorts/Reels', 'Cross-promote on other platforms']
          : ['Maintain growth through consistent content', 'Focus on retention over acquisition'],
      },
      {
        name: 'Engagement Quality',
        score: Math.min(100, Math.round(engagementRate * 1200)),
        maxScore: 100,
        weight: 0.25,
        description: `${(engagementRate * 100).toFixed(2)}% engagement rate`,
        tips: engagementRate < 0.04
          ? ['Reply to comments within 1 hour', 'Ask questions in your content', 'Use polls and community posts']
          : ['Maintain your strong engagement', 'Nurture your most active followers'],
      },
      {
        name: 'Content Consistency',
        score: Math.min(100, Math.round(postsPerWeek * 20)),
        maxScore: 100,
        weight: 0.2,
        description: `${postsPerWeek} posts per week`,
        tips: postsPerWeek < 4
          ? ['Create a content calendar', 'Batch create content on weekends', 'Use scheduling tools']
          : ['Keep up the consistent schedule', 'Vary content formats for freshness'],
      },
      {
        name: 'Content Quality',
        score: Math.min(100, contentQuality),
        maxScore: 100,
        weight: 0.2,
        description: `Quality score: ${contentQuality}/100`,
        tips: contentQuality < 70
          ? ['Invest in better lighting and audio', 'Study top creators in your niche', 'Get feedback from your community']
          : ['Experiment with new formats', 'Raise production value gradually'],
      },
      {
        name: 'Reach & Visibility',
        score: Math.min(100, Math.round((avgViews / Math.max(followerCount, 1)) * 200)),
        maxScore: 100,
        weight: 0.15,
        description: `${avgViews.toLocaleString()} average views per post`,
        tips: avgViews < followerCount * 0.3
          ? ['Optimize titles and thumbnails', 'Post at peak hours', 'Use SEO best practices']
          : ['Strong reach — explore new audience segments', 'Test alternate posting times'],
      },
    ];

    const overallScore = Math.round(dimensions.reduce((sum, d) => sum + d.score * d.weight, 0));
    const grade = this.getGrade(overallScore);

    // Brand strength
    const brandStrength = this.calculateBrandStrength(followerCount, engagementRate, overallScore, tier);

    // Peer comparison
    const peerComparison: PeerComparison = {
      percentile: Math.min(99, Math.max(1, overallScore + Math.round((engagementRate - 0.04) * 500))),
      nicheName: niche,
      avgScore: 55,
      topScore: 92,
      ranking: overallScore >= 80 ? 'Top Performer' : overallScore >= 60 ? 'Above Average' : overallScore >= 40 ? 'Average' : 'Growing',
    };

    // Improvement plan (sorted by lowest-scoring dimensions)
    const improvementPlan: ImprovementItem[] = [...dimensions]
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((d, i) => ({
        priority: i + 1,
        dimension: d.name,
        currentScore: d.score,
        targetScore: Math.min(100, d.score + 20),
        action: d.tips[0] || 'Focus on improving this area',
        expectedImpact: `+${Math.round(20 * d.weight)} points to overall score`,
      }));

    // Badges
    const badges = this.calculateBadges(followerCount, engagementRate, postsPerWeek, overallScore, tier);

    const scorecard: CreatorScorecard = {
      scorecardId,
      generatedAt: new Date().toISOString(),
      overallScore,
      grade,
      tier,
      dimensions,
      brandStrength,
      peerComparison,
      improvementPlan,
      badges,
    };

    this.repo.saveScorecard(tenantId, {
      tenant_id: tenantId,
      scorecard_id: `scorecard#${scorecardId}`,
      platform,
      niche,
      overall_score: overallScore,
      grade,
      tier,
      data: JSON.stringify(scorecard),
      created_at: new Date().toISOString(),
    }).catch(err => console.error('Failed to save scorecard:', err));

    return scorecard;
  }

  private determineTier(followers: number): CreatorScorecard['tier'] {
    if (followers >= 1000000) return 'mega';
    if (followers >= 100000) return 'macro';
    if (followers >= 10000) return 'mid';
    if (followers >= 1000) return 'micro';
    return 'nano';
  }

  private getGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  }

  private calculateBrandStrength(followers: number, engagement: number, overallScore: number, tier: string): BrandStrength {
    const audiencePillar = Math.min(100, Math.round(Math.log10(Math.max(followers, 1)) * 18));
    const engagementPillar = Math.min(100, Math.round(engagement * 1500));
    const consistencyPillar = Math.min(100, Math.round(overallScore * 1.1));
    const authenticityPillar = Math.min(100, Math.round(70 + engagement * 300));

    const brandScore = Math.round((audiencePillar * 0.25 + engagementPillar * 0.3 + consistencyPillar * 0.25 + authenticityPillar * 0.2));

    let dealReadiness: BrandStrength['dealReadiness'] = 'needs_work';
    if (brandScore >= 70 && followers >= 10000) dealReadiness = 'ready';
    else if (brandScore >= 50 && followers >= 5000) dealReadiness = 'almost';

    const baseDealValue = followers * engagement * 50;
    const tierMultiplier = { nano: 0.5, micro: 0.8, mid: 1.2, macro: 2.0, mega: 5.0 }[tier] || 1;

    return {
      score: brandScore,
      pillars: [
        { name: 'Audience Reach', score: audiencePillar, description: 'Size and growth of your audience' },
        { name: 'Engagement Power', score: engagementPillar, description: 'Quality and depth of audience interaction' },
        { name: 'Consistency', score: consistencyPillar, description: 'Regularity and reliability of content' },
        { name: 'Authenticity', score: authenticityPillar, description: 'Genuine connection with audience' },
      ],
      dealReadiness,
      estimatedBrandValue: Math.round(baseDealValue * tierMultiplier),
      currency: 'INR',
    };
  }

  private calculateBadges(followers: number, engagement: number, postsPerWeek: number, score: number, tier: string): Badge[] {
    return [
      { name: 'Rising Star', icon: 'star', description: 'Reached 1,000 followers', earned: followers >= 1000, requirement: '1,000+ followers' },
      { name: 'Community Builder', icon: 'users', description: 'Achieved 5% engagement rate', earned: engagement >= 0.05, requirement: '5%+ engagement rate' },
      { name: 'Consistency King', icon: 'calendar', description: 'Posts 5+ times per week', earned: postsPerWeek >= 5, requirement: '5+ posts/week' },
      { name: 'Brand Ready', icon: 'briefcase', description: 'Scored 70+ overall with 10K followers', earned: score >= 70 && followers >= 10000, requirement: 'Score 70+ & 10K followers' },
      { name: 'Top Performer', icon: 'trophy', description: 'Scored 85+ overall', earned: score >= 85, requirement: 'Overall score 85+' },
      { name: 'Viral Potential', icon: 'zap', description: 'Mid-tier or higher with strong engagement', earned: ['mid', 'macro', 'mega'].includes(tier) && engagement >= 0.04, requirement: 'Mid-tier+ & 4%+ engagement' },
      { name: 'Content Machine', icon: 'film', description: 'Produces 7+ pieces of content weekly', earned: postsPerWeek >= 7, requirement: '7+ posts/week' },
      { name: 'Engagement Expert', icon: 'heart', description: 'Engagement rate above 8%', earned: engagement >= 0.08, requirement: '8%+ engagement rate' },
    ];
  }
}
