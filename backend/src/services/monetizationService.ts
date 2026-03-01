// Monetization Hub Service
// Revenue estimation, CPM/RPM forecasting, brand matching, and audience interest mapping.

import { v4 as uuidv4 } from 'uuid';
import { TenantRepository } from '../utils/repository';
import { config } from '../config';
import * as youtube from './platforms/youtube';
import * as instagram from './platforms/instagram';

// ── Types ──

export interface MonetizationRequest {
  platform: 'youtube' | 'instagram';
  followerCount?: number;
  avgViews?: number;
  engagementRate?: number;
  niche?: string;
  region?: string;
}

export interface MonetizationReport {
  reportId: string;
  generatedAt: string;
  revenueEstimate: RevenueEstimate;
  cpmRpmForecast: CpmRpmForecast;
  brandMatches: BrandMatch[];
  sponsoredPostPredictor: SponsoredPostPrediction;
  audienceInterests: AudienceInterest[];
}

export interface RevenueEstimate {
  monthlyLow: number;
  monthlyHigh: number;
  yearlyLow: number;
  yearlyHigh: number;
  currency: string;
  breakdown: { source: string; amount: number; percentage: number }[];
}

export interface CpmRpmForecast {
  currentCpm: number;
  forecastedCpm: number;
  currentRpm: number;
  forecastedRpm: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

export interface BrandMatch {
  brandName: string;
  industry: string;
  matchScore: number;
  estimatedDealValue: number;
  currency: string;
  reason: string;
}

export interface SponsoredPostPrediction {
  estimatedRate: number;
  currency: string;
  performanceScore: number;
  expectedReach: number;
  expectedEngagement: number;
  recommendation: string;
}

export interface AudienceInterest {
  interest: string;
  percentage: number;
  monetizationPotential: 'high' | 'medium' | 'low';
}

// ── Data Templates ──

const NICHE_CPM: Record<string, { cpm: number; rpm: number }> = {
  'tech': { cpm: 12.5, rpm: 8.2 },
  'finance': { cpm: 18.0, rpm: 12.5 },
  'education': { cpm: 9.5, rpm: 6.8 },
  'entertainment': { cpm: 6.0, rpm: 3.5 },
  'gaming': { cpm: 7.5, rpm: 4.2 },
  'fitness': { cpm: 10.0, rpm: 7.0 },
  'food': { cpm: 8.5, rpm: 5.5 },
  'travel': { cpm: 11.0, rpm: 7.8 },
  'fashion': { cpm: 9.0, rpm: 6.2 },
  'default': { cpm: 8.0, rpm: 5.0 },
};

const BRAND_DATABASE: Record<string, BrandMatch[]> = {
  tech: [
    { brandName: 'OnePlus India', industry: 'Consumer Electronics', matchScore: 0.92, estimatedDealValue: 50000, currency: 'INR', reason: 'High tech audience overlap and strong engagement' },
    { brandName: 'Skill Academy', industry: 'EdTech', matchScore: 0.88, estimatedDealValue: 35000, currency: 'INR', reason: 'Learning-focused audience with high purchase intent' },
    { brandName: 'HostGator India', industry: 'Web Hosting', matchScore: 0.82, estimatedDealValue: 25000, currency: 'INR', reason: 'Developer and creator audience alignment' },
  ],
  fitness: [
    { brandName: 'HealthKart', industry: 'Health Supplements', matchScore: 0.95, estimatedDealValue: 40000, currency: 'INR', reason: 'Direct audience interest in health products' },
    { brandName: 'cult.fit', industry: 'Fitness Platform', matchScore: 0.90, estimatedDealValue: 60000, currency: 'INR', reason: 'Strong brand-audience fit for fitness content' },
    { brandName: 'Decathlon India', industry: 'Sports Retail', matchScore: 0.85, estimatedDealValue: 30000, currency: 'INR', reason: 'Sports equipment interest within audience' },
  ],
  default: [
    { brandName: 'Amazon India', industry: 'E-commerce', matchScore: 0.75, estimatedDealValue: 20000, currency: 'INR', reason: 'Broad audience appeal and affiliate potential' },
    { brandName: 'Meesho', industry: 'Social Commerce', matchScore: 0.70, estimatedDealValue: 15000, currency: 'INR', reason: 'Good fit for creator-driven promotions' },
    { brandName: 'PhonePe', industry: 'FinTech', matchScore: 0.68, estimatedDealValue: 25000, currency: 'INR', reason: 'Mass-market appeal and high brand awareness' },
  ],
};

const AUDIENCE_INTERESTS: Record<string, AudienceInterest[]> = {
  tech: [
    { interest: 'Gadget Reviews', percentage: 35, monetizationPotential: 'high' },
    { interest: 'Programming', percentage: 25, monetizationPotential: 'high' },
    { interest: 'AI/ML', percentage: 20, monetizationPotential: 'high' },
    { interest: 'Gaming', percentage: 12, monetizationPotential: 'medium' },
    { interest: 'Productivity', percentage: 8, monetizationPotential: 'medium' },
  ],
  fitness: [
    { interest: 'Workout Routines', percentage: 30, monetizationPotential: 'high' },
    { interest: 'Nutrition', percentage: 25, monetizationPotential: 'high' },
    { interest: 'Supplements', percentage: 20, monetizationPotential: 'high' },
    { interest: 'Weight Loss', percentage: 15, monetizationPotential: 'medium' },
    { interest: 'Yoga/Meditation', percentage: 10, monetizationPotential: 'medium' },
  ],
  default: [
    { interest: 'Entertainment', percentage: 30, monetizationPotential: 'medium' },
    { interest: 'Education', percentage: 25, monetizationPotential: 'high' },
    { interest: 'Lifestyle', percentage: 20, monetizationPotential: 'medium' },
    { interest: 'Shopping', percentage: 15, monetizationPotential: 'high' },
    { interest: 'News', percentage: 10, monetizationPotential: 'low' },
  ],
};

// ── Repository ──

class MonetizationRepository extends TenantRepository {
  constructor() {
    super(config.tables.analytics);
  }

  async saveReport(tenantId: string, record: Record<string, unknown>): Promise<void> {
    await this.put(tenantId, record);
  }
}

// ── Service ──

export class MonetizationService {
  private repo: MonetizationRepository;

  constructor() {
    this.repo = new MonetizationRepository();
  }

  async generateReport(tenantId: string, request: MonetizationRequest): Promise<MonetizationReport> {
    const { platform, niche = 'default', region = 'India' } = request;
    const reportId = uuidv4();

    // Fetch platform data for realistic calculations
    let followerCount = request.followerCount || 10000;
    let avgViews = request.avgViews || 5000;
    let engagementRate = request.engagementRate || 0.04;

    try {
      if (platform === 'youtube') {
        const channel = await youtube.fetchChannelMetrics(tenantId);
        followerCount = request.followerCount || channel.subscriberCount;
        avgViews = request.avgViews || channel.viewCount / Math.max(channel.videoCount, 1);
      } else {
        const profile = await instagram.fetchProfileMetrics(tenantId);
        followerCount = request.followerCount || profile.followersCount;
      }
    } catch { /* use defaults */ }

    // Revenue estimation
    const nicheData = NICHE_CPM[niche.toLowerCase()] || NICHE_CPM.default;
    const monthlyViews = avgViews * 30;
    const adRevenue = Math.round((monthlyViews / 1000) * nicheData.rpm);
    const sponsorRevenue = Math.round(followerCount * 0.005 * engagementRate * 1000);
    const affiliateRevenue = Math.round(adRevenue * 0.3);
    const totalMonthly = adRevenue + sponsorRevenue + affiliateRevenue;

    const revenueEstimate: RevenueEstimate = {
      monthlyLow: Math.round(totalMonthly * 0.7),
      monthlyHigh: Math.round(totalMonthly * 1.4),
      yearlyLow: Math.round(totalMonthly * 0.7 * 12),
      yearlyHigh: Math.round(totalMonthly * 1.4 * 12),
      currency: 'INR',
      breakdown: [
        { source: 'Ad Revenue', amount: adRevenue, percentage: Math.round((adRevenue / totalMonthly) * 100) },
        { source: 'Sponsorships', amount: sponsorRevenue, percentage: Math.round((sponsorRevenue / totalMonthly) * 100) },
        { source: 'Affiliate', amount: affiliateRevenue, percentage: Math.round((affiliateRevenue / totalMonthly) * 100) },
      ],
    };

    // CPM/RPM forecast
    const cpmRpmForecast: CpmRpmForecast = {
      currentCpm: nicheData.cpm,
      forecastedCpm: Math.round(nicheData.cpm * (1 + (engagementRate - 0.04) * 5) * 100) / 100,
      currentRpm: nicheData.rpm,
      forecastedRpm: Math.round(nicheData.rpm * (1 + (engagementRate - 0.04) * 5) * 100) / 100,
      trend: engagementRate > 0.05 ? 'up' : engagementRate < 0.03 ? 'down' : 'stable',
      confidence: 0.78,
    };

    // Brand matches
    const brandMatches = (BRAND_DATABASE[niche.toLowerCase()] || BRAND_DATABASE.default).map(b => ({
      ...b,
      estimatedDealValue: Math.round(b.estimatedDealValue * (followerCount / 10000)),
    }));

    // Sponsored post prediction
    const sponsoredPostPredictor: SponsoredPostPrediction = {
      estimatedRate: Math.round(followerCount * 0.01 * (1 + engagementRate * 10)),
      currency: 'INR',
      performanceScore: Math.min(100, Math.round(engagementRate * 1000 + followerCount / 1000)),
      expectedReach: Math.round(followerCount * 0.3),
      expectedEngagement: Math.round(followerCount * engagementRate),
      recommendation: engagementRate > 0.05
        ? 'Strong engagement — charge premium rates for sponsored content'
        : 'Focus on increasing engagement before pursuing sponsorships',
    };

    // Audience interests
    const audienceInterests = AUDIENCE_INTERESTS[niche.toLowerCase()] || AUDIENCE_INTERESTS.default;

    const report: MonetizationReport = {
      reportId,
      generatedAt: new Date().toISOString(),
      revenueEstimate,
      cpmRpmForecast,
      brandMatches,
      sponsoredPostPredictor,
      audienceInterests,
    };

    this.repo.saveReport(tenantId, {
      tenant_id: tenantId,
      report_id: `monetization#${reportId}`,
      platform,
      niche,
      region,
      data: JSON.stringify(report),
      created_at: new Date().toISOString(),
    }).catch(err => console.error('Failed to save monetization report:', err));

    return report;
  }
}
