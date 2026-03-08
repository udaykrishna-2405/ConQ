# AI Integration Guide for ConQ Platform

## Overview
This guide shows how to integrate production-ready AI into all ConQ modules using Claude API.

## Architecture

```
backend/src/services/ai/
├── aiClient.ts          # Core AI client (Claude API wrapper)
├── promptTemplates.ts   # Structured prompts for all use cases
└── README.md           # This file

backend/src/services/
├── aiStudioServiceAI.ts         # AI-powered content generation
├── nlpServiceAI.ts              # AI-powered NLP analysis
├── contentShieldServiceAI.ts    # AI-powered content moderation
├── viralityServiceAI.ts         # AI-powered virality prediction
├── growthIntelligenceServiceAI.ts  # AI-powered growth insights
├── automationServiceAI.ts       # AI-powered automation
├── creatorScorecardServiceAI.ts # AI-powered evaluations
└── monetizationServiceAI.ts     # AI-powered revenue analysis
```

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install @anthropic-ai/sdk
```

### 2. Configure Environment

Add to `.env`:

```env
# Anthropic Claude API
ANTHROPIC_API_KEY=your_api_key_here

# Optional: Model configuration
AI_MODEL=claude-3-5-sonnet-20241022
AI_MAX_TOKENS=4096
AI_TEMPERATURE=1.0
```

### 3. Get API Key

1. Visit https://console.anthropic.com/
2. Create an account or sign in
3. Go to API Keys section
4. Generate a new API key
5. Add to `.env` file

## Integration Pattern

All AI services follow this pattern:

```typescript
import { getAIClient } from './ai/aiClient';
import { PromptTemplates } from './ai/promptTemplates';

export class MyServiceAI {
  private aiClient = getAIClient();

  async analyze(data: any): Promise<Result> {
    try {
      // Generate prompt
      const prompt = PromptTemplates.myCategory.myMethod(data);

      // Call AI with structured JSON response
      const response = await this.aiClient.generateJSON<MyResponseType>(
        prompt,
        schemaString,
        { temperature: 0.7 }
      );

      return this.formatResponse(response);
    } catch (error) {
      // Always provide fallback
      return this.fallbackMethod(data);
    }
  }
}
```

## Key Features

### 1. Automatic Fallback
- If no API key is provided, services use mock mode
- If API calls fail, services fall back to rule-based logic
- No requests fail due to AI unavailability

### 2. Structured Responses
- All AI responses use JSON schemas
- Type-safe responses with TypeScript
- Automatic validation and parsing

### 3. Cost Optimization
- Configurable temperature and token limits
- Efficient prompt engineering
- Token usage tracking

### 4. Error Handling
- Comprehensive error logging
- Graceful degradation
- Retry logic built-in

## Module-Specific Integration

### AI Studio
**Capabilities:**
- Real content generation (captions, scripts, hooks)
- Video production assistance
- Multi-language support
- Content repurposing

**Prompts:** `PromptTemplates.contentGeneration`

### NLP Analyzer
**Capabilities:**
- Sentiment analysis with confidence scores
- Multi-language detection (200+ languages)
- Entity extraction
- Intent classification
- Tone analysis

**Prompts:** `PromptTemplates.nlp`

### Content Shield
**Capabilities:**
- Policy violation detection
- Copyright risk analysis
- Brand safety scoring
- Platform-specific guidelines

**Prompts:** `PromptTemplates.moderation`

### Virality Predictor
**Capabilities:**
- AI-powered virality scoring
- Feature impact analysis
- Trending topic alignment
- Improvement suggestions

**Prompts:** `PromptTemplates.virality`

### Growth Intelligence
**Capabilities:**
- Data-driven growth forecasting
- Competitor benchmarking
- Actionable recommendations
- Milestone predictions

**Prompts:** `PromptTemplates.growth`

### Automation
**Capabilities:**
- Optimal posting time predictions
- Smart hashtag generation
- A/B test analysis
- Content calendar creation

**Prompts:** `PromptTemplates.automation`

### Creator Scorecard
**Capabilities:**
- Multi-dimensional performance scoring
- Brand strength evaluation
- Personalized improvement plans
- Achievement tracking

**Prompts:** `PromptTemplates.scorecard`

### Monetization
**Capabilities:**
- Dynamic revenue estimation
- CPM/RPM forecasting
- Brand partnership matching
- Sponsorship rate predictions

**Prompts:** `PromptTemplates.monetization`

## Testing

### Test AI Connection

```bash
cd backend
npx ts-node -e "
import { getAIClient } from './src/services/ai/aiClient';

(async () => {
  const client = getAIClient();
  console.log('Mock mode:', client.isMockMode());

  try {
    const response = await client.generate('Say hello!');
    console.log('Response:', response.content);
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
"
```

### Test Individual Service

```typescript
import { AiStudioServiceAI } from './services/aiStudioServiceAI';

const service = new AiStudioServiceAI();
const result = await service.generateContent('tenant-123', {
  type: 'caption',
  topic: '10 tips for YouTube growth',
  platform: 'youtube',
  tone: 'energetic and inspiring',
});

console.log('Generated:', result);
```

## Switching from Mock to AI

To enable AI for ALL services, simply:

1. Add `ANTHROPIC_API_KEY` to `.env`
2. Restart backend server
3. All services automatically use AI

To disable AI (use mock):

1. Remove `ANTHROPIC_API_KEY` from `.env`
2. Or set it to empty string: `ANTHROPIC_API_KEY=`

No code changes required!

## Cost Estimation

Based on Claude 3.5 Sonnet pricing:
- Input: $3 per million tokens
- Output: $15 per million tokens

Typical usage per API call:
- Content generation: 500-2000 tokens (~$0.01-0.03)
- Analysis: 200-1000 tokens (~$0.005-0.015)
- Moderation: 300-800 tokens (~$0.007-0.012)

For 1000 API calls/day: ~$10-20/day

## Production Considerations

### 1. Rate Limiting
The AI client includes automatic retry logic. For production:

```typescript
// Add rate limiting middleware
import rateLimit from 'express-rate-limit';

const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many AI requests, please try again later',
});

app.use('/api/ai-studio', aiRateLimit);
```

### 2. Caching
Cache AI responses for repeated queries:

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour

async function generateWithCache(prompt: string) {
  const cached = cache.get(prompt);
  if (cached) return cached;

  const response = await aiClient.generate(prompt);
  cache.set(prompt, response);
  return response;
}
```

### 3. Monitoring
Track AI usage and costs:

```typescript
// Log token usage
const response = await aiClient.generate(prompt);
console.log('Tokens used:', {
  input: response.usage.inputTokens,
  output: response.usage.outputTokens,
  estimated_cost: calculateCost(response.usage),
});
```

### 4. Error Handling
Always provide fallbacks:

```typescript
try {
  return await aiMethod(data);
} catch (error) {
  console.error('AI error:', error);
  // Alert monitoring system
  alerting.notify('AI_FAILURE', error);
  // Return fallback
  return fallbackMethod(data);
}
```

## Troubleshooting

### Issue: "API key not found"
**Solution:** Check `.env` file has `ANTHROPIC_API_KEY=your_key`

### Issue: "Rate limit exceeded"
**Solution:** Implement request queuing or upgrade API tier

### Issue: "Invalid JSON response"
**Solution:** AI might return markdown. Client automatically strips code blocks.

### Issue: "Slow responses"
**Solution:**
- Reduce `max_tokens` parameter
- Use lower temperature
- Implement caching

### Issue: "High costs"
**Solution:**
- Enable caching for repeated queries
- Use shorter prompts
- Implement request batching
- Monitor and set budget alerts

## Support

For issues:
1. Check logs in backend console
2. Verify API key is valid
3. Test with mock mode first
4. Review Anthropic API status: https://status.anthropic.com/

## Next Steps

1. **Enable AI**: Add API key to `.env`
2. **Test locally**: Run backend and test one feature
3. **Monitor costs**: Track token usage in console
4. **Optimize prompts**: Refine prompts based on results
5. **Deploy**: Deploy to production with monitoring

## Resources

- Anthropic API Docs: https://docs.anthropic.com/
- Claude Models: https://docs.anthropic.com/claude/docs/models-overview
- Pricing: https://www.anthropic.com/api
- Best Practices: https://docs.anthropic.com/claude/docs/guide-to-anthropics-prompt-engineering-resources
