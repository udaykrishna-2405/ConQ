// Dashboard Aggregator Handler
// GET /api/dashboard — Combines all creator intelligence data into a single response.

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthContext, withAuth } from '../middleware/auth';
import { AnalyticsService } from '../services/analyticsService';
import { GrowthIntelligenceService } from '../services/growthIntelligenceService';
import { CreatorScorecardService } from '../services/creatorScorecardService';
import { MonetizationService } from '../services/monetizationService';
import { success } from '../utils/response';

const analyticsService = new AnalyticsService();
const growthService = new GrowthIntelligenceService();
const scorecardService = new CreatorScorecardService();
const monetizationService = new MonetizationService();

export const dashboardHandler = withAuth(
  async (
    _event: APIGatewayProxyEvent,
    context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    const { tenantId } = context;

    // Fetch all modules in parallel — gracefully degrade on partial failures
    const [analyticsData, growthData, scorecardData, monetizationData] = await Promise.allSettled([
      analyticsService.getDashboard(tenantId),
      growthService.generateForecast(tenantId, { platform: 'youtube', timeframeMonths: 3 }),
      scorecardService.generateScorecard(tenantId, { platform: 'youtube' }),
      monetizationService.generateReport(tenantId, { platform: 'youtube' }),
    ]);

    const dashboard = {
      tenantId,
      generatedAt: new Date().toISOString(),

      // Analytics summary
      analytics: analyticsData.status === 'fulfilled'
        ? {
            totalReach: analyticsData.value.unified.totalReach,
            totalEngagements: analyticsData.value.unified.totalEngagements,
            weightedEngagementRate: analyticsData.value.unified.weightedEngagementRate,
            platforms: {
              youtube: { subscribers: analyticsData.value.platforms.youtube.channel.subscriberCount },
              instagram: { followers: analyticsData.value.platforms.instagram.profile.followersCount },
            },
            topContent: analyticsData.value.topContent.slice(0, 3),
          }
        : { error: 'Analytics temporarily unavailable' },

      // Growth intelligence summary
      growth: growthData.status === 'fulfilled'
        ? {
            projectedFollowers: growthData.value.forecast[growthData.value.forecast.length - 1]?.projectedFollowers || 0,
            engagementScore: Math.round((growthData.value.forecast[0]?.projectedEngagementRate || 0) * 10000) / 100,
            growthPrediction: growthData.value.milestones[0]?.label || 'Steady growth',
            recommendedPostingTime: growthData.value.actionPlan[0]?.action || 'Post at optimal times',
            topActionItem: growthData.value.actionPlan[0]?.action || '',
          }
        : { error: 'Growth data temporarily unavailable' },

      // Creator scorecard summary
      scorecard: scorecardData.status === 'fulfilled'
        ? {
            creatorScore: scorecardData.value.overallScore,
            grade: scorecardData.value.grade,
            level: scorecardData.value.tier,
            improvementSuggestions: scorecardData.value.improvementPlan.map(item => item.action),
            earnedBadges: scorecardData.value.badges.filter(b => b.earned).map(b => b.name),
          }
        : { error: 'Scorecard temporarily unavailable' },

      // Monetization summary
      monetization: monetizationData.status === 'fulfilled'
        ? {
            estimatedRevenue: {
              monthlyLow: monetizationData.value.revenueEstimate.monthlyLow,
              monthlyHigh: monetizationData.value.revenueEstimate.monthlyHigh,
              currency: monetizationData.value.revenueEstimate.currency,
            },
            cpmUsed: monetizationData.value.cpmRpmForecast.currentCpm,
            topBrandMatch: monetizationData.value.brandMatches[0]?.brandName || '',
          }
        : { error: 'Monetization data temporarily unavailable' },
    };

    return success(dashboard);
  }
);
