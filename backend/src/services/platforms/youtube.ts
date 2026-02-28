// YouTube Mock Integration
// Simulates YouTube Data API v3 responses for channel and video metadata.
//
// In production, replace with actual YouTube Data API calls:
//   - channels.list (channel metrics)
//   - search.list (video discovery)
//   - videos.list (video details + stats)
//
// API Key stored in Secrets Manager, not in code.

export interface YouTubeChannel {
  channelId: string;
  title: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  thumbnailUrl: string;
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  tags: string[];
  duration: string;
  stats: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
  };
  engagementRate: number;
}

// Mock channel data pool
const MOCK_CHANNELS: YouTubeChannel[] = [
  {
    channelId: 'UC_mock_tech_01',
    title: 'TechGuru India',
    subscriberCount: 250000,
    videoCount: 340,
    viewCount: 45000000,
    thumbnailUrl: 'https://placeholder.conq/yt/channel/tech01.jpg',
  },
  {
    channelId: 'UC_mock_food_01',
    title: 'Desi Kitchen',
    subscriberCount: 180000,
    videoCount: 210,
    viewCount: 32000000,
    thumbnailUrl: 'https://placeholder.conq/yt/channel/food01.jpg',
  },
  {
    channelId: 'UC_mock_edu_01',
    title: 'Study IQ Hindi',
    subscriberCount: 500000,
    videoCount: 650,
    viewCount: 95000000,
    thumbnailUrl: 'https://placeholder.conq/yt/channel/edu01.jpg',
  },
];

// Mock video templates
const VIDEO_TEMPLATES = [
  { titleTemplate: 'Top 10 {topic} Tips for Beginners', category: 'education' },
  { titleTemplate: '{topic} Complete Guide 2026', category: 'education' },
  { titleTemplate: '{topic} vs {topic2} - Which is Better?', category: 'comparison' },
  { titleTemplate: 'I Tried {topic} for 30 Days', category: 'challenge' },
  { titleTemplate: '{topic} Tutorial in Hindi', category: 'tutorial' },
  { titleTemplate: 'Why {topic} is Trending in India', category: 'trending' },
  { titleTemplate: '{topic} Honest Review', category: 'review' },
  { titleTemplate: '{topic} Masterclass - Free Course', category: 'course' },
];

const TOPICS = [
  'AI', 'Python', 'JavaScript', 'React', 'Web Development',
  'Machine Learning', 'Data Science', 'Cloud Computing',
  'Cooking', 'Fitness', 'Stock Market', 'Crypto',
];

const generateMockVideo = (channelId: string, index: number): YouTubeVideo => {
  const template = VIDEO_TEMPLATES[index % VIDEO_TEMPLATES.length];
  const topic = TOPICS[index % TOPICS.length];
  const topic2 = TOPICS[(index + 3) % TOPICS.length];

  const title = template.titleTemplate
    .replace('{topic}', topic)
    .replace('{topic2}', topic2);

  const viewCount = 5000 + Math.floor(Math.random() * 500000);
  const likeCount = Math.floor(viewCount * (0.03 + Math.random() * 0.05));
  const commentCount = Math.floor(viewCount * (0.005 + Math.random() * 0.01));
  const shareCount = Math.floor(viewCount * (0.001 + Math.random() * 0.005));

  const daysAgo = Math.floor(Math.random() * 90);
  const publishedAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

  return {
    videoId: `vid_${channelId}_${index}`,
    title,
    description: `Learn about ${topic} in this comprehensive guide. Subscribe for more content!`,
    publishedAt,
    thumbnailUrl: `https://placeholder.conq/yt/video/${channelId}_${index}.jpg`,
    tags: [topic.toLowerCase(), template.category, 'india', 'hindi'],
    duration: `PT${10 + Math.floor(Math.random() * 20)}M${Math.floor(Math.random() * 60)}S`,
    stats: {
      viewCount,
      likeCount,
      commentCount,
      shareCount,
    },
    engagementRate: Math.round(((likeCount + commentCount + shareCount) / viewCount) * 10000) / 10000,
  };
};

/**
 * Fetches channel metrics for a given tenant.
 * In production: YouTube Data API channels.list
 */
export const fetchChannelMetrics = (tenantId: string): YouTubeChannel => {
  // Select a mock channel based on tenant hash
  const index = tenantId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % MOCK_CHANNELS.length;
  return { ...MOCK_CHANNELS[index] };
};

/**
 * Fetches video metadata for a channel.
 * In production: YouTube Data API search.list + videos.list
 */
export const fetchVideoMetrics = (tenantId: string, count = 10): YouTubeVideo[] => {
  const channelId = fetchChannelMetrics(tenantId).channelId;
  return Array.from({ length: count }, (_, i) => generateMockVideo(channelId, i));
};

/**
 * Fetches aggregated stats across all videos.
 */
export const fetchAggregatedStats = (tenantId: string): {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: number;
  videoCount: number;
} => {
  const videos = fetchVideoMetrics(tenantId, 20);

  const totals = videos.reduce(
    (acc, v) => ({
      views: acc.views + v.stats.viewCount,
      likes: acc.likes + v.stats.likeCount,
      comments: acc.comments + v.stats.commentCount,
      shares: acc.shares + v.stats.shareCount,
      engagementSum: acc.engagementSum + v.engagementRate,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, engagementSum: 0 }
  );

  return {
    totalViews: totals.views,
    totalLikes: totals.likes,
    totalComments: totals.comments,
    totalShares: totals.shares,
    avgEngagementRate: Math.round((totals.engagementSum / videos.length) * 10000) / 10000,
    videoCount: videos.length,
  };
};
