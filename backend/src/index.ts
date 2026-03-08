// ConQ Backend – Application Entry Point
// This file exports all Lambda handlers for deployment.

export { authHandler, registerHandler, loginHandler, refreshHandler, logoutHandler } from './handlers/auth';
export { userHandler } from './handlers/user';
export { nlpHandler } from './handlers/nlp';
export { predictionHandler } from './handlers/prediction';
export { trendHandler } from './handlers/trend';
export { analyticsHandler } from './handlers/analytics';
export { aiStudioGenerateHandler, aiStudioVideoAssistHandler, aiStudioHistoryHandler } from './handlers/aiStudio';
export { monetizationHandler } from './handlers/monetization';
export { contentShieldHandler } from './handlers/contentShield';
export { growthForecastHandler, competitorBenchmarkHandler } from './handlers/growthIntelligence';
export { automationScheduleHandler, automationHashtagHandler, automationAbTestHandler } from './handlers/automation';
export { creatorScorecardHandler } from './handlers/creatorScorecard';
