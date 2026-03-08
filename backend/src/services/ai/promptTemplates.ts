// AI Prompt Templates
// Reusable, structured prompts for different AI operations

export class PromptTemplates {
  /**
   * Content Generation Prompts
   */
  static contentGeneration = {
    caption: (topic: string, platform: string, tone?: string) => `
Generate 3 engaging ${platform} captions for content about: "${topic}"

Tone: ${tone || 'professional yet approachable'}

Requirements:
- Include relevant hashtags
- Optimize for engagement
- Keep under ${platform === 'instagram' ? '2200' : '5000'} characters
- Make them unique and creative

Return as JSON array with this format:
{
  "captions": [
    {
      "text": "caption text here",
      "hashtags": ["tag1", "tag2"],
      "hook": "opening hook"
    }
  ]
}`,

    hook: (topic: string, platform: string) => `
Generate 3 powerful content hooks for ${platform} about: "${topic}"

These should:
- Grab attention in first 3 seconds
- Create curiosity
- Be platform-optimized
- Include a call-to-action

Return as JSON:
{
  "hooks": [
    {
      "text": "hook text",
      "style": "question/statement/story",
      "target_emotion": "curiosity/excitement/concern"
    }
  ]
}`,

    script: (topic: string, duration: string, platform: string) => `
Write a ${duration} video script for ${platform} about: "${topic}"

Include:
- Engaging introduction (first 5 seconds)
- Main content points with transitions
- Clear call-to-action
- Timestamp suggestions

Return as JSON:
{
  "title": "suggested title",
  "script": {
    "intro": "introduction text",
    "main_points": ["point 1", "point 2", "point 3"],
    "conclusion": "conclusion text",
    "call_to_action": "CTA text"
  },
  "timestamps": [
    {"time": "0:00", "section": "Intro"},
    {"time": "0:15", "section": "Point 1"}
  ]
}`,

    videoAssist: (contentType: string, assistType: string, platform: string) => `
Provide expert ${assistType} advice for creating a ${contentType} on ${platform}.

Include specific, actionable recommendations covering:
- Technical details
- Creative suggestions
- Platform-specific optimizations
- Common mistakes to avoid

Return as JSON:
{
  "suggestions": [
    {
      "category": "category name",
      "recommendation": "detailed recommendation",
      "priority": "high/medium/low",
      "rationale": "why this matters"
    }
  ]
}`,
  };

  /**
   * Content Moderation Prompts
   */
  static moderation = {
    analyze: (text: string, platform: string) => `
Analyze this ${platform} content for policy violations, brand safety issues, and copyright risks:

"${text}"

Check for:
1. Policy violations (hate speech, harassment, violence, misinformation)
2. Copyright risks (music mentions, brand names, copyrighted content)
3. Brand safety issues (controversial topics, sensitive content)
4. Platform-specific guidelines

Return as JSON:
{
  "overall_risk": "low/medium/high/critical",
  "overall_score": 0-100,
  "policy_violations": [
    {
      "category": "category",
      "severity": "low/medium/high/critical",
      "description": "what was detected",
      "matched_phrase": "specific phrase",
      "suggestion": "how to fix"
    }
  ],
  "copyright_risks": [
    {
      "type": "music/image/text/brand/trademark",
      "risk": "low/medium/high",
      "description": "what was detected",
      "detected_element": "specific element",
      "recommendation": "suggestion"
    }
  ],
  "brand_safety_issues": [
    {
      "category": "category",
      "severity": "low/medium/high",
      "description": "issue description",
      "impact": "potential impact"
    }
  ],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`,
  };

  /**
   * NLP Analysis Prompts
   */
  static nlp = {
    analyze: (text: string, platform: string) => `
Perform comprehensive NLP analysis on this ${platform} content:

"${text}"

Analyze:
1. Primary language and any code-mixing
2. Sentiment (positive/negative/neutral/mixed) with confidence score
3. Tone (professional/casual/humorous/serious/motivational)
4. Key topics and themes
5. Named entities (people, places, organizations, hashtags)
6. Intent (inform/entertain/sell/engage)

Return as JSON:
{
  "language": "language code",
  "language_name": "language name",
  "confidence": 0-1,
  "is_code_mixed": boolean,
  "sentiment": "positive/negative/neutral/mixed",
  "sentiment_score": -1 to 1,
  "sentiment_confidence": 0-1,
  "tone": "tone description",
  "topics": ["topic1", "topic2"],
  "entities": [
    {
      "text": "entity text",
      "type": "person/location/organization/hashtag/topic",
      "confidence": 0-1
    }
  ],
  "intent": "primary intent",
  "key_phrases": ["phrase1", "phrase2"]
}`,
  };

  /**
   * Virality Prediction Prompts
   */
  static virality = {
    predict: (title: string, description: string, tags: string[], platform: string) => `
Predict the virality potential of this ${platform} content:

Title: "${title}"
Description: "${description}"
Tags: ${tags.join(', ')}

Analyze based on:
1. Title effectiveness (hooks, keywords, curiosity gap)
2. Description quality and SEO
3. Tag relevance and trending potential
4. Emotional appeal
5. Shareability factors
6. Platform algorithm compatibility

Return as JSON:
{
  "score": 0-100,
  "confidence": 0-1,
  "prediction": "low/moderate/high/viral",
  "explanation": [
    {
      "feature": "feature name",
      "impact": -10 to 10,
      "direction": "positive/negative",
      "reason": "explanation"
    }
  ],
  "improvements": ["suggestion1", "suggestion2"],
  "trending_alignment": {
    "score": 0-100,
    "trending_topics": ["topic1", "topic2"]
  }
}`,
  };

  /**
   * Growth Intelligence Prompts
   */
  static growth = {
    forecast: (data: any) => `
Generate a growth forecast and action plan for this creator:

Platform: ${data.platform}
Current Followers: ${data.currentFollowers || 'unknown'}
Engagement Rate: ${(data.currentEngagementRate * 100).toFixed(2)}%
Posts Per Week: ${data.postsPerWeek}
Niche: ${data.niche}
Timeframe: ${data.timeframeMonths} months

Provide:
1. Month-by-month growth projections
2. Key milestones and when they'll be reached
3. Growth drivers to focus on
4. Prioritized action plan

Return as JSON:
{
  "forecast": [
    {
      "month": 1,
      "projected_followers": number,
      "projected_engagement_rate": 0-1,
      "projected_monthly_views": number,
      "confidence": 0-1
    }
  ],
  "milestones": [
    {
      "label": "milestone name",
      "target_followers": number,
      "estimated_months": number,
      "benefits": ["benefit1", "benefit2"]
    }
  ],
  "growth_drivers": [
    {
      "factor": "driver name",
      "impact": "high/medium/low",
      "current_score": number,
      "recommendation": "specific advice"
    }
  ],
  "action_plan": [
    {
      "priority": 1-5,
      "action": "specific action",
      "expected_impact": "impact description",
      "category": "content/distribution/engagement/analytics"
    }
  ]
}`,

    benchmark: (data: any) => `
Benchmark this creator against their niche:

Platform: ${data.platform}
Niche: ${data.niche || 'general'}
Their Followers: ${data.followerCount || 'unknown'}
Their Engagement Rate: ${data.engagementRate ? (data.engagementRate * 100).toFixed(2) + '%' : 'unknown'}

Provide:
1. Comparison to niche averages
2. Percentile ranking
3. Specific gaps with recommendations
4. Growth opportunities

Return as JSON:
{
  "percentile_rank": 0-100,
  "performance_tier": "struggling/developing/competitive/leading/elite",
  "gaps": [
    {
      "metric": "metric name",
      "your_value": number,
      "niche_average": number,
      "top_performer": number,
      "gap_percentage": number,
      "recommendation": "specific advice"
    }
  ],
  "strengths": ["strength1", "strength2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "next_milestone": {
    "target": "milestone name",
    "actions_needed": ["action1", "action2"]
  }
}`,
  };

  /**
   * Automation Prompts
   */
  static automation = {
    scheduling: (data: any) => `
Generate optimal posting schedule for:

Platform: ${data.platform}
Content Type: ${data.contentType || 'general'}
Niche: ${data.niche || 'general'}
Timezone: ${data.timezone || 'UTC'}

Provide weekly posting schedule with:
- Best days and times
- Expected reach multipliers
- Content type recommendations per slot
- Reasoning for each recommendation

Return as JSON:
{
  "best_times": [
    {
      "day_of_week": "Monday",
      "time": "HH:MM",
      "timezone": "timezone",
      "expected_reach_multiplier": 1.0-2.0,
      "reason": "why this time is optimal"
    }
  ],
  "weekly_plan": [
    {
      "day": "Monday",
      "slots": [
        {
          "time": "HH:MM",
          "content_type": "type",
          "priority": "high/medium/low"
        }
      ]
    }
  ],
  "tips": ["tip1", "tip2"]
}`,

    hashtags: (topic: string, platform: string, niche: string) => `
Generate optimized hashtag strategy for:

Topic: "${topic}"
Platform: ${platform}
Niche: ${niche}

Provide mix of:
- Trending hashtags (high competition, high reach)
- Niche hashtags (medium competition, targeted audience)
- Branded hashtags (low competition, community building)

Return as JSON:
{
  "hashtags": [
    {
      "tag": "hashtag without #",
      "category": "trending/niche/branded/community",
      "popularity": "very_high/high/medium/low",
      "competitiveness": "very_high/high/medium/low",
      "recommended": boolean,
      "reason": "why use this"
    }
  ],
  "strategy": {
    "total_recommended": number,
    "mix": {
      "trending": number,
      "niche": number,
      "branded": number,
      "community": number
    },
    "advice": "overall strategy advice"
  }
}`,

    abTest: (variantA: any, variantB: any, platform: string) => `
Compare these two content variants for A/B testing on ${platform}:

Variant A:
Title: "${variantA.title}"
Description: "${variantA.description || 'N/A'}"

Variant B:
Title: "${variantB.title}"
Description: "${variantB.description || 'N/A'}"

Analyze:
1. Predicted CTR for each
2. Engagement potential
3. Reach potential
4. Strengths and weaknesses
5. Which will likely perform better

Return as JSON:
{
  "variant_a": {
    "predicted_ctr": 0-1,
    "predicted_engagement": 0-1,
    "predicted_reach_multiplier": 0.5-2.0,
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "score": 0-100
  },
  "variant_b": {
    "predicted_ctr": 0-1,
    "predicted_engagement": 0-1,
    "predicted_reach_multiplier": 0.5-2.0,
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "score": 0-100
  },
  "winner": "A/B",
  "confidence": 0-1,
  "reasoning": ["reason1", "reason2"],
  "recommendation": "final recommendation"
}`,
  };

  /**
   * Creator Evaluation Prompts
   */
  static scorecard = {
    evaluate: (data: any) => `
Evaluate this creator's performance and provide detailed scorecard:

Platform: ${data.platform}
Niche: ${data.niche || 'general'}
Followers: ${data.followerCount || 'unknown'}
Engagement Rate: ${data.engagementRate ? (data.engagementRate * 100).toFixed(2) + '%' : 'unknown'}
Posts Per Week: ${data.postsPerWeek || 'unknown'}
Avg Views: ${data.avgViews || 'unknown'}
Content Quality (self-rated): ${data.contentQuality || 'unknown'}/10

Provide comprehensive evaluation with:
1. Overall score (0-100) and grade
2. Tier classification
3. Scores across 5 dimensions: audience size, engagement, consistency, quality, reach
4. Brand strength and deal readiness
5. Detailed improvement plan
6. Achievements and badges

Return as JSON:
{
  "overall_score": 0-100,
  "grade": "A+/A/A-/B+/B/B-/C+/C/C-/D/F",
  "tier": "nano/micro/mid/macro/mega",
  "dimensions": [
    {
      "name": "Audience Size",
      "score": 0-100,
      "max_score": 100,
      "weight": 0-1,
      "description": "description",
      "tips": ["tip1", "tip2"]
    }
  ],
  "brand_strength": {
    "score": 0-100,
    "pillars": [
      {
        "name": "pillar name",
        "score": 0-100,
        "description": "description"
      }
    ],
    "deal_readiness": "not_ready/developing/ready/highly_attractive",
    "estimated_brand_value": number
  },
  "peer_comparison": {
    "percentile": 0-100,
    "niche_name": "niche",
    "avg_score": number,
    "top_score": number,
    "ranking": "below_average/average/above_average/excellent/elite"
  },
  "improvement_plan": [
    {
      "priority": 1-5,
      "dimension": "dimension name",
      "current_score": number,
      "target_score": number,
      "action": "specific action",
      "expected_impact": "impact description"
    }
  ],
  "badges": [
    {
      "name": "badge name",
      "icon": "emoji",
      "description": "description",
      "earned": boolean,
      "requirement": "requirement to earn"
    }
  ]
}`,
  };

  /**
   * Monetization Analysis Prompts
   */
  static monetization = {
    analyze: (data: any) => `
Analyze monetization potential for this creator:

Platform: ${data.platform}
Niche: ${data.niche || 'general'}
Followers: ${data.followerCount || 'unknown'}
Engagement Rate: ${data.engagementRate ? (data.engagementRate * 100).toFixed(2) + '%' : 'unknown'}
Avg Views: ${data.avgViews || 'unknown'}

Provide:
1. Revenue estimates (ad revenue, sponsorships, affiliates)
2. CPM/RPM forecasts with trends
3. Brand partnership matches
4. Sponsored post rate predictions
5. Audience monetization potential

Return as JSON:
{
  "revenue_estimate": {
    "monthly_low": number,
    "monthly_high": number,
    "yearly_low": number,
    "yearly_high": number,
    "currency": "USD",
    "breakdown": [
      {"source": "source name", "amount": number, "percentage": number}
    ]
  },
  "cpm_rpm_forecast": {
    "current_cpm": number,
    "forecasted_cpm": number,
    "current_rpm": number,
    "forecasted_rpm": number,
    "trend": "increasing/stable/decreasing",
    "confidence": 0-1
  },
  "brand_matches": [
    {
      "brand_name": "brand name",
      "industry": "industry",
      "match_score": 0-100,
      "estimated_deal_value": number,
      "currency": "USD",
      "reason": "why good match"
    }
  ],
  "sponsored_post_predictor": {
    "estimated_rate": number,
    "currency": "USD",
    "performance_score": 0-100,
    "expected_reach": number,
    "expected_engagement": number,
    "recommendation": "advice for negotiations"
  },
  "audience_interests": [
    {
      "interest": "interest name",
      "percentage": number,
      "monetization_potential": "high/medium/low"
    }
  ]
}`,
  };
}
