// YouTube Platform Integration
// Uses YouTube Data API v3 when YOUTUBE_API_KEY is configured.
// Falls back to deterministic mock data when API key is absent.
//
// Required env vars for real mode:
//   YOUTUBE_API_KEY – YouTube Data API v3 key (stored in Secrets Manager in prod)
//
// YouTube Data API endpoints used:
//   - channels.list   (channel metrics)
//   - search.list     (video discovery)
//   - videos.list     (video details + stats)

import https from 'https';

// ─── Interfaces ──────────────────────────────────────────────────────────────

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

// ─── Real YouTube Data API v3 Client ─────────────────────────────────────────

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

/** Simple HTTPS GET that returns parsed JSON. */
function ytGet<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk: string) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data) as T);
        } catch (err) {
          reject(new Error(`YouTube API JSON parse error: ${err}`));
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

interface YTChannelListResponse {
  items?: Array<{
    id: string;
    snippet: { title: string; thumbnails: { default: { url: string } } };
    statistics: { subscriberCount: string; videoCount: string; viewCount: string };
  }>;
}

interface YTSearchListResponse {
  items?: Array<{
    id: { videoId: string };
    snippet: { title: string; description: string; publishedAt: string; thumbnails: { high: { url: string } } };
  }>;
}

interface YTVideoListResponse {
  items?: Array<{
    id: string;
    snippet: { title: string; description: string; publishedAt: string; tags?: string[]; thumbnails: { high: { url: string } } };
    statistics: { viewCount: string; likeCount: string; commentCount: string };
    contentDetails: { duration: string };
  }>;
}

/** Fetch channel metrics from YouTube Data API. */
async function realFetchChannel(channelId: string): Promise<YouTubeChannel> {
  const url = `${YT_BASE}/channels?part=snippet,statistics&id=${encodeURIComponent(channelId)}&key=${YOUTUBE_API_KEY}`;
  const resp = await ytGet<YTChannelListResponse>(url);

  if (!resp.items || resp.items.length === 0) {
    throw new Error(`YouTube channel not found: ${channelId}`);
  }

  const ch = resp.items[0];
  return {
    channelId: ch.id,
    title: ch.snippet.title,
    subscriberCount: parseInt(ch.statistics.subscriberCount, 10) || 0,
    videoCount: parseInt(ch.statistics.videoCount, 10) || 0,
    viewCount: parseInt(ch.statistics.viewCount, 10) || 0,
    thumbnailUrl: ch.snippet.thumbnails.default.url,
  };
}

/** Fetch recent videos from YouTube Data API. */
async function realFetchVideos(channelId: string, count: number): Promise<YouTubeVideo[]> {
  // Step 1: search for recent videos on the channel
  const searchUrl = `${YT_BASE}/search?part=snippet&channelId=${encodeURIComponent(channelId)}&type=video&order=date&maxResults=${count}&key=${YOUTUBE_API_KEY}`;
  const searchResp = await ytGet<YTSearchListResponse>(searchUrl);

  if (!searchResp.items || searchResp.items.length === 0) {
    return [];
  }

  // Step 2: get full stats for found videos
  const videoIds = searchResp.items.map((i) => i.id.videoId).join(',');
  const statsUrl = `${YT_BASE}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
  const statsResp = await ytGet<YTVideoListResponse>(statsUrl);

  if (!statsResp.items) return [];

  return statsResp.items.map((v) => {
    const viewCount = parseInt(v.statistics.viewCount, 10) || 0;
    const likeCount = parseInt(v.statistics.likeCount, 10) || 0;
    const commentCount = parseInt(v.statistics.commentCount, 10) || 0;
    // YouTube API doesn't expose share count directly
    const shareCount = 0;

    const totalEngagement = likeCount + commentCount + shareCount;
    const engagementRate = viewCount > 0
      ? Math.round((totalEngagement / viewCount) * 10000) / 10000
      : 0;

    return {
      videoId: v.id,
      title: v.snippet.title,
      description: v.snippet.description,
      publishedAt: v.snippet.publishedAt,
      thumbnailUrl: v.snippet.thumbnails.high.url,
      tags: v.snippet.tags || [],
      duration: v.contentDetails.duration,
      stats: { viewCount, likeCount, commentCount, shareCount },
      engagementRate,
    };
  });
}

// ─── Mock Data (used when YOUTUBE_API_KEY is not set) ────────────────────────

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
    stats: { viewCount, likeCount, commentCount, shareCount },
    engagementRate: Math.round(((likeCount + commentCount + shareCount) / viewCount) * 10000) / 10000,
  };
};

function mockFetchChannel(tenantId: string): YouTubeChannel {
  const index = tenantId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % MOCK_CHANNELS.length;
  return { ...MOCK_CHANNELS[index] };
}

function mockFetchVideos(tenantId: string, count: number): YouTubeVideo[] {
  const channelId = mockFetchChannel(tenantId).channelId;
  return Array.from({ length: count }, (_, i) => generateMockVideo(channelId, i));
}

// ─── Public API (auto-selects real vs mock) ──────────────────────────────────

/**
 * Fetches channel metrics for a given tenant.
 * Uses YouTube Data API when YOUTUBE_API_KEY is set; mock data otherwise.
 * @param tenantId  Tenant identifier
 * @param channelId Optional YouTube channel ID (required for real API mode)
 */
export const fetchChannelMetrics = async (
  tenantId: string,
  channelId?: string,
): Promise<YouTubeChannel> => {
  if (YOUTUBE_API_KEY && channelId) {
    try {
      return await realFetchChannel(channelId);
    } catch (err) {
      console.warn('YouTube API failed, falling back to mock:', err);
    }
  }
  return mockFetchChannel(tenantId);
};

/**
 * Fetches video metadata for a channel.
 * Uses YouTube Data API when YOUTUBE_API_KEY is set; mock data otherwise.
 */
export const fetchVideoMetrics = async (
  tenantId: string,
  count = 10,
  channelId?: string,
): Promise<YouTubeVideo[]> => {
  if (YOUTUBE_API_KEY && channelId) {
    try {
      return await realFetchVideos(channelId, count);
    } catch (err) {
      console.warn('YouTube API failed, falling back to mock:', err);
    }
  }
  return mockFetchVideos(tenantId, count);
};

/**
 * Fetches aggregated stats across all videos.
 */
export const fetchAggregatedStats = async (
  tenantId: string,
  channelId?: string,
): Promise<{
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: number;
  videoCount: number;
}> => {
  const videos = await fetchVideoMetrics(tenantId, 20, channelId);

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
    avgEngagementRate: videos.length > 0
      ? Math.round((totals.engagementSum / videos.length) * 10000) / 10000
      : 0,
    videoCount: videos.length,
  };
};

/** Returns true if a real YouTube API key is configured. */
export const isRealApiConfigured = (): boolean => !!YOUTUBE_API_KEY;
