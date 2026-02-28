// Instagram Mock Integration
// Simulates Instagram Graph API responses for post metadata and insights.
//
// In production, replace with actual Instagram Graph API calls:
//   - /me (profile info)
//   - /me/media (recent posts)
//   - /{media-id}/insights (engagement metrics)
//
// Access token stored in Secrets Manager, not in code.

export interface InstagramProfile {
  profileId: string;
  username: string;
  followersCount: number;
  followingCount: number;
  mediaCount: number;
  biography: string;
}

export interface InstagramPost {
  postId: string;
  caption: string;
  mediaType: 'image' | 'video' | 'carousel';
  mediaUrl: string;
  permalink: string;
  publishedAt: string;
  hashtags: string[];
  stats: {
    likeCount: number;
    commentCount: number;
    shareCount: number;
    saveCount: number;
    reachCount: number;
    impressionCount: number;
  };
  engagementRate: number;
}

// Mock profile data pool
const MOCK_PROFILES: InstagramProfile[] = [
  {
    profileId: 'ig_mock_lifestyle_01',
    username: 'mumbai_lifestyle',
    followersCount: 85000,
    followingCount: 450,
    mediaCount: 520,
    biography: 'Mumbai lifestyle | Food | Travel | Culture',
  },
  {
    profileId: 'ig_mock_fitness_01',
    username: 'fit_india_daily',
    followersCount: 120000,
    followingCount: 320,
    mediaCount: 890,
    biography: 'Fitness | Yoga | Wellness | Transform your life',
  },
  {
    profileId: 'ig_mock_tech_01',
    username: 'tech_bytes_india',
    followersCount: 65000,
    followingCount: 200,
    mediaCount: 340,
    biography: 'Tech reviews | Gadgets | AI | Startups',
  },
];

const CAPTION_TEMPLATES = [
  'New post about {topic}! What do you think? Drop a comment below',
  '{topic} goals! Tag someone who needs to see this',
  'Just discovered something amazing about {topic}',
  'Your guide to {topic} - Save this for later!',
  '{topic} tips that actually work. Link in bio for more',
  'Morning motivation: {topic} edition',
  'POV: You finally understand {topic}',
  '{topic} in 2026 hits different. Here is why',
];

const IG_TOPICS = [
  'fitness routine', 'street food', 'startup life', 'travel hacks',
  'skincare', 'coding tips', 'morning routine', 'budget fashion',
  'home cooking', 'mental health', 'book recommendations', 'photography',
];

const IG_HASHTAG_POOLS: Record<string, string[]> = {
  'fitness routine': ['#fitness', '#workout', '#fitindia', '#gym', '#health'],
  'street food': ['#streetfood', '#foodie', '#indianfood', '#yummy', '#foodgasm'],
  'startup life': ['#startup', '#entrepreneur', '#hustle', '#business', '#india'],
  'travel hacks': ['#travel', '#wanderlust', '#explore', '#travelindia', '#adventure'],
  'skincare': ['#skincare', '#beauty', '#glowup', '#selfcare', '#skincareroutine'],
  'coding tips': ['#coding', '#programming', '#developer', '#tech', '#learntocode'],
  'morning routine': ['#morningroutine', '#productivity', '#lifestyle', '#wellness'],
  'budget fashion': ['#fashion', '#style', '#ootd', '#budgetfashion', '#trending'],
  'home cooking': ['#homecooking', '#recipe', '#cooking', '#foodlover', '#delicious'],
  'mental health': ['#mentalhealth', '#selfcare', '#mindfulness', '#wellness', '#peace'],
  'book recommendations': ['#books', '#reading', '#booklover', '#bookstagram', '#library'],
  'photography': ['#photography', '#photo', '#camera', '#photooftheday', '#art'],
};

const generateMockPost = (profileId: string, index: number): InstagramPost => {
  const template = CAPTION_TEMPLATES[index % CAPTION_TEMPLATES.length];
  const topic = IG_TOPICS[index % IG_TOPICS.length];
  const caption = template.replace(/\{topic\}/g, topic);

  const hashtags = IG_HASHTAG_POOLS[topic] || ['#india', '#trending', '#viral'];

  const reachCount = 2000 + Math.floor(Math.random() * 100000);
  const impressionCount = Math.floor(reachCount * (1.2 + Math.random() * 0.5));
  const likeCount = Math.floor(reachCount * (0.05 + Math.random() * 0.1));
  const commentCount = Math.floor(reachCount * (0.005 + Math.random() * 0.01));
  const shareCount = Math.floor(reachCount * (0.002 + Math.random() * 0.005));
  const saveCount = Math.floor(reachCount * (0.01 + Math.random() * 0.02));

  const daysAgo = Math.floor(Math.random() * 60);
  const mediaTypes: InstagramPost['mediaType'][] = ['image', 'video', 'carousel'];

  return {
    postId: `post_${profileId}_${index}`,
    caption: `${caption} ${hashtags.join(' ')}`,
    mediaType: mediaTypes[index % 3],
    mediaUrl: `https://placeholder.conq/ig/post/${profileId}_${index}.jpg`,
    permalink: `https://www.instagram.com/p/mock_${index}/`,
    publishedAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    hashtags,
    stats: {
      likeCount,
      commentCount,
      shareCount,
      saveCount,
      reachCount,
      impressionCount,
    },
    engagementRate: Math.round(((likeCount + commentCount + shareCount + saveCount) / reachCount) * 10000) / 10000,
  };
};

/**
 * Fetches Instagram profile info for a given tenant.
 * In production: Instagram Graph API /me
 */
export const fetchProfileMetrics = (tenantId: string): InstagramProfile => {
  const index = tenantId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % MOCK_PROFILES.length;
  return { ...MOCK_PROFILES[index] };
};

/**
 * Fetches recent post metadata.
 * In production: Instagram Graph API /me/media
 */
export const fetchPostMetrics = (tenantId: string, count = 10): InstagramPost[] => {
  const profileId = fetchProfileMetrics(tenantId).profileId;
  return Array.from({ length: count }, (_, i) => generateMockPost(profileId, i));
};

/**
 * Fetches aggregated stats across all recent posts.
 */
export const fetchAggregatedPostStats = (tenantId: string): {
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  totalReach: number;
  totalImpressions: number;
  avgEngagementRate: number;
  postCount: number;
} => {
  const posts = fetchPostMetrics(tenantId, 20);

  const totals = posts.reduce(
    (acc, p) => ({
      likes: acc.likes + p.stats.likeCount,
      comments: acc.comments + p.stats.commentCount,
      shares: acc.shares + p.stats.shareCount,
      saves: acc.saves + p.stats.saveCount,
      reach: acc.reach + p.stats.reachCount,
      impressions: acc.impressions + p.stats.impressionCount,
      engagementSum: acc.engagementSum + p.engagementRate,
    }),
    { likes: 0, comments: 0, shares: 0, saves: 0, reach: 0, impressions: 0, engagementSum: 0 }
  );

  return {
    totalLikes: totals.likes,
    totalComments: totals.comments,
    totalShares: totals.shares,
    totalSaves: totals.saves,
    totalReach: totals.reach,
    totalImpressions: totals.impressions,
    avgEngagementRate: Math.round((totals.engagementSum / posts.length) * 10000) / 10000,
    postCount: posts.length,
  };
};
