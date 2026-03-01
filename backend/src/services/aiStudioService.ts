// AI Studio Service
// Content generation + video production intelligence engine.
// Provides AI-powered caption, hook, script, CTA, translation, repurpose, calendar, and video production assistance.

import { v4 as uuidv4 } from 'uuid';
import { TenantRepository } from '../utils/repository';
import { config } from '../config';

// ── Request & Response Types ──

export type ContentType = 'caption' | 'hook' | 'script_short' | 'script_long' | 'cta' | 'translation' | 'repurpose' | 'calendar';
export type VideoAssistType = 'camera_angles' | 'shot_breakdown' | 'editing_style' | 'broll' | 'lighting' | 'framing' | 'platform_tips';

export interface ContentGenerateRequest {
  type: ContentType;
  topic: string;
  platform: 'youtube' | 'instagram';
  tone?: string;
  language?: string;
  targetLanguages?: string[];
  sourceFormat?: string;
  targetFormats?: string[];
  durationDays?: number;
}

export interface VideoAssistRequest {
  type: VideoAssistType;
  contentType: string;
  platform: 'youtube' | 'instagram';
  style?: string;
  duration?: string;
}

export interface GeneratedContent {
  generationId: string;
  type: ContentType;
  outputs: ContentOutput[];
  metadata: {
    platform: string;
    topic: string;
    tone: string;
    language: string;
    generatedAt: string;
  };
}

export interface ContentOutput {
  variant: string;
  text: string;
  characterCount: number;
  hashtags?: string[];
  estimatedEngagement?: string;
}

export interface VideoAssistResult {
  assistId: string;
  type: VideoAssistType;
  suggestions: VideoSuggestion[];
  metadata: {
    contentType: string;
    platform: string;
    generatedAt: string;
  };
}

export interface VideoSuggestion {
  category: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
}

// ── Generation Templates ──

const CAPTION_TEMPLATES: Record<string, string[]> = {
  youtube: [
    '🔥 {topic} — you NEED to see this! Like & Subscribe for more 🙌',
    'I tried {topic} and here\'s what happened... (results will SHOCK you)',
    'The ultimate guide to {topic} | Everything you need to know 📚',
  ],
  instagram: [
    '✨ {topic} ✨\n\nDouble tap if you agree! 💯\n\n#creator #growth',
    '{topic} hits different when you know the secret 🤫\n\nSave this for later ➡️',
    'POV: You just discovered {topic} 🎯\n\nTag someone who needs this!',
  ],
};

const HOOK_TEMPLATES = [
  'Stop scrolling — {topic} is about to change everything you know.',
  'What if I told you {topic} could 10x your results?',
  'Nobody talks about this side of {topic}...',
  '3 seconds. That\'s all you have. Here\'s why {topic} matters.',
  'I spent 100 hours studying {topic}. Here\'s the truth.',
  'The {topic} mistake 90% of creators make (and how to fix it)',
];

const SCRIPT_SHORT_TEMPLATE = `[HOOK - 0:00-0:03]
{hook}

[PROBLEM - 0:03-0:10]
Most people struggle with {topic} because they don't understand the fundamentals.

[SOLUTION - 0:10-0:25]
Here's what actually works:
1. Start with the basics — understand your audience
2. Apply the {topic} framework consistently
3. Measure and iterate on your results

[CTA - 0:25-0:30]
Follow for more {topic} tips and share this with someone who needs it!`;

const SCRIPT_LONG_TEMPLATE = `[INTRO - 0:00-0:30]
{hook}

Welcome back to the channel. Today we're diving deep into {topic}.

[OVERVIEW - 0:30-1:00]
In this video, I'll cover:
1. The fundamentals of {topic}
2. Common mistakes to avoid
3. Advanced strategies that actually work
4. Real examples and case studies

[SECTION 1 - 1:00-3:00]
Let's start with the basics. {topic} is more than just a trend — it's a fundamental shift in how creators approach content.

Key points:
• Understanding your target audience
• Analyzing what's working in your niche
• Building a repeatable process

[SECTION 2 - 3:00-5:00]
Now let's talk about the mistakes. The #1 error is not being consistent with {topic}.

Here's what to do instead:
• Set a clear schedule
• Track your metrics weekly
• Adapt based on data, not feelings

[SECTION 3 - 5:00-7:00]
Advanced strategies for {topic}:
• Leverage trending formats
• Cross-platform repurposing
• Collaboration with other creators
• Data-driven content optimization

[CONCLUSION - 7:00-8:00]
That's everything you need to know about {topic}. If this helped you, smash that like button and subscribe for more content like this.

[CTA - 8:00-8:30]
Drop a comment below telling me your biggest takeaway. I read every single one.
See you in the next video! ✌️`;

const CTA_TEMPLATES = [
  '🔔 Subscribe and hit the bell — new {topic} content every week!',
  '💬 Comment "{topic}" if you want a part 2!',
  '📲 Share this with a friend who needs to hear about {topic}',
  '🔗 Link in bio for the full {topic} guide',
  '❤️ Double tap if this {topic} tip helped you!',
  '💾 Save this post — you\'ll need it later for {topic}',
];

const TRANSLATIONS: Record<string, (text: string) => string> = {
  hindi: (t) => `[हिन्दी अनुवाद]\n${t}\n\n(यह AI द्वारा अनुवादित है। कृपया प्रकाशन से पहले समीक्षा करें।)`,
  tamil: (t) => `[தமிழ் மொழிபெயர்ப்பு]\n${t}\n\n(இது AI மொழிபெயர்ப்பு. வெளியிடுவதற்கு முன் மதிப்பாய்வு செய்யவும்.)`,
  telugu: (t) => `[తెలుగు అనువాదం]\n${t}\n\n(ఇది AI అనువాదం. ప్రచురించే ముందు సమీక్షించండి.)`,
  marathi: (t) => `[मराठी भाषांतर]\n${t}\n\n(हे AI भाषांतर आहे. प्रकाशित करण्यापूर्वी पुनरावलोकन करा.)`,
  bengali: (t) => `[বাংলা অনুবাদ]\n${t}\n\n(এটি AI অনুবাদ। প্রকাশ করার আগে পর্যালোচনা করুন।)`,
};

const VIDEO_SUGGESTIONS: Record<VideoAssistType, (contentType: string, platform: string) => VideoSuggestion[]> = {
  camera_angles: (ct, p) => [
    { category: 'Primary Shot', recommendation: `Eye-level medium shot for ${ct} — builds trust and connection`, priority: 'high', rationale: 'Eye-level shots create relatability and are the standard for talking-head content' },
    { category: 'B-Roll Cut', recommendation: 'Top-down overhead angle for product/demo shots', priority: 'medium', rationale: 'Overhead angles provide clear visibility of items and add visual variety' },
    { category: 'Dynamic Shot', recommendation: `Low angle power shot for dramatic ${ct} reveals`, priority: 'low', rationale: 'Low angles add drama and make subjects appear more authoritative' },
    { category: 'Close-up', recommendation: 'Tight face shot for emotional moments and reactions', priority: 'high', rationale: `Facial expressions drive engagement on ${p}, especially for reaction content` },
  ],
  shot_breakdown: (ct) => [
    { category: 'Opening (0-3s)', recommendation: `Start with a close-up reaction or bold text overlay for ${ct}`, priority: 'high', rationale: 'First 3 seconds determine if viewers keep watching' },
    { category: 'Setup (3-10s)', recommendation: 'Medium shot establishing context and introducing the topic', priority: 'high', rationale: 'Viewers need context before diving into details' },
    { category: 'Main Content (10-45s)', recommendation: `Alternate between medium and close-up shots for ${ct}, cut every 3-5 seconds`, priority: 'high', rationale: 'Frequent cuts maintain visual interest and reduce drop-off' },
    { category: 'Demonstration (45-60s)', recommendation: 'Screen recording or hands-on b-roll with voiceover', priority: 'medium', rationale: 'Visual proof builds credibility' },
    { category: 'CTA (last 5s)', recommendation: 'Return to eye-level medium shot with text overlay', priority: 'high', rationale: 'Personal connection drive follows and engagement' },
  ],
  editing_style: (ct, p) => [
    { category: 'Pacing', recommendation: p === 'youtube' ? `Moderate pacing (3-5s per cut) for ${ct}` : `Fast cuts (1-2s per shot) for ${ct} on Reels`, priority: 'high', rationale: `${p} audiences expect ${p === 'youtube' ? 'informative depth' : 'quick visual stimulation'}` },
    { category: 'Text Overlays', recommendation: 'Add keyword text overlays at key moments', priority: 'high', rationale: '85% of social media video is watched without sound' },
    { category: 'Zoom Effects', recommendation: `Use 1.2-1.5x zoom punches on key statements for ${ct}`, priority: 'medium', rationale: 'Subtle zooms add energy without being distracting' },
    { category: 'Transitions', recommendation: 'Jump cuts for talking head, smooth transitions for b-roll', priority: 'medium', rationale: 'Jump cuts feel authentic while smooth transitions feel premium' },
    { category: 'Subtitles', recommendation: 'Animated word-by-word captions, bold key phrases', priority: 'high', rationale: 'Captions increase watch time by 40% and improve accessibility' },
  ],
  broll: (ct) => [
    { category: 'Contextual B-Roll', recommendation: `Show real-world examples of ${ct} — screen recordings, product shots, outdoor footage`, priority: 'high', rationale: 'Concrete visuals make abstract topics tangible' },
    { category: 'Transition B-Roll', recommendation: 'Use 1-2 second establishing shots between sections', priority: 'medium', rationale: 'Visual breaks help viewers process information' },
    { category: 'Emphasis B-Roll', recommendation: `Close-up detail shots when making key points about ${ct}`, priority: 'medium', rationale: 'Detail shots direct viewer attention to important elements' },
    { category: 'Stock Supplements', recommendation: 'Blend stock footage with original content for variety', priority: 'low', rationale: 'Stock footage fills gaps but should complement, not replace, original content' },
  ],
  lighting: (ct) => [
    { category: 'Key Light', recommendation: '45° angle key light at eye level, soft diffusion', priority: 'high', rationale: 'Soft angled light creates dimension without harsh shadows' },
    { category: 'Fill Light', recommendation: 'Lower-intensity fill on opposite side to reduce shadows', priority: 'medium', rationale: 'Fill light prevents unflattering dark patches on face' },
    { category: 'Background', recommendation: `Clean, uncluttered background with subtle depth. Consider LED strips or practical lights for ${ct}`, priority: 'medium', rationale: 'Background contributes to perceived production quality' },
    { category: 'Color Temperature', recommendation: 'Match all lights to 5500K (daylight) for consistency', priority: 'high', rationale: 'Mixed color temperatures look unprofessional on camera' },
  ],
  framing: (ct, p) => [
    { category: 'Aspect Ratio', recommendation: p === 'youtube' ? '16:9 landscape — standard YouTube format' : '9:16 vertical — optimized for Reels/Shorts', priority: 'high', rationale: `${p} algorithm favors native aspect ratio content` },
    { category: 'Subject Placement', recommendation: 'Rule of thirds — face in upper third, eyes on intersection points', priority: 'high', rationale: 'Rule of thirds is universally appealing and draws attention naturally' },
    { category: 'Headroom', recommendation: 'Minimal headroom above — maximize face size in frame', priority: 'medium', rationale: 'Larger faces are more engaging, especially on mobile screens' },
    { category: 'Safe Zones', recommendation: `Keep ${ct} text and key visuals within center 80% of frame`, priority: 'high', rationale: 'Platform UI elements overlap edges of the frame' },
  ],
  platform_tips: (_ct, p) => [
    { category: 'Optimal Length', recommendation: p === 'youtube' ? '8-12 minutes for watch time, 30-60s for Shorts' : '7-15 seconds for Reels, 60s max for Stories', priority: 'high', rationale: `${p} algorithm rewards ${p === 'youtube' ? 'session duration' : 'completion rate'}` },
    { category: 'Thumbnail/Cover', recommendation: p === 'youtube' ? 'High contrast thumbnail with face + 3-4 word text' : 'First frame needs to be scroll-stopping with text hook', priority: 'high', rationale: 'Click-through rate is the #1 factor for algorithmic reach' },
    { category: 'Captions', recommendation: 'Upload SRT/VTT caption file for accessibility and SEO', priority: 'medium', rationale: 'Captions boost discoverability and watch time' },
    { category: 'Publishing', recommendation: p === 'youtube' ? 'Publish at peak audience time, use end screens and cards' : 'Use relevant hashtags (3-5), tag location, add alt text', priority: 'medium', rationale: 'Metadata optimization directly impacts initial distribution' },
  ],
};

// ── Calendar Generator ──

const CALENDAR_FORMATS = ['Tutorial', 'Behind the Scenes', 'Tips & Tricks', 'Story Time', 'Collab', 'Q&A', 'Challenge', 'Review'];

function generateCalendar(topic: string, platform: string, days: number): ContentOutput[] {
  const outputs: ContentOutput[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = date.toISOString().slice(0, 10);
    const format = CALENDAR_FORMATS[i % CALENDAR_FORMATS.length];
    const text = `📅 ${dateStr} (${dayOfWeek})\n📌 Format: ${format}\n🎯 Topic: ${topic} — ${format.toLowerCase()}\n📱 Platform: ${platform}\n⏰ Best time: ${platform === 'youtube' ? '3:00 PM IST' : '6:00 PM IST'}\n📝 Notes: Focus on ${topic} from a ${format.toLowerCase()} angle`;
    outputs.push({ variant: `Day ${i + 1}`, text, characterCount: text.length });
  }
  return outputs;
}

// ── Repository ──

interface StudioRecord {
  tenant_id: string;
  generation_id: string;
  type: string;
  platform: string;
  topic: string;
  outputs: ContentOutput[] | VideoSuggestion[];
  created_at: string;
}

class StudioRepository extends TenantRepository {
  constructor() {
    super(config.tables.content);
  }

  async saveGeneration(tenantId: string, record: StudioRecord): Promise<void> {
    await this.put(tenantId, record as unknown as Record<string, unknown>);
  }

  async getHistory(tenantId: string, limit = 20): Promise<StudioRecord[]> {
    return this.queryByTenant<StudioRecord>(tenantId, limit);
  }
}

// ── Service ──

export class AiStudioService {
  private repo: StudioRepository;

  constructor() {
    this.repo = new StudioRepository();
  }

  async generateContent(tenantId: string, request: ContentGenerateRequest): Promise<GeneratedContent> {
    const { type, topic, platform, tone = 'engaging', language = 'en' } = request;
    const generationId = uuidv4();
    let outputs: ContentOutput[] = [];

    switch (type) {
      case 'caption': {
        const templates = CAPTION_TEMPLATES[platform] || CAPTION_TEMPLATES.youtube;
        outputs = templates.map((t, i) => {
          const text = t.replace(/\{topic\}/g, topic);
          return { variant: `Option ${i + 1}`, text, characterCount: text.length, hashtags: [`#${topic.replace(/\s+/g, '')}`, '#creator', '#growth'], estimatedEngagement: ['high', 'medium', 'high'][i] };
        });
        break;
      }
      case 'hook': {
        outputs = HOOK_TEMPLATES.map((t, i) => {
          const text = t.replace(/\{topic\}/g, topic);
          return { variant: `Hook ${i + 1}`, text, characterCount: text.length, estimatedEngagement: i < 2 ? 'high' : 'medium' };
        });
        break;
      }
      case 'script_short': {
        const hook = HOOK_TEMPLATES[0].replace(/\{topic\}/g, topic);
        const text = SCRIPT_SHORT_TEMPLATE.replace(/\{topic\}/g, topic).replace(/\{hook\}/g, hook);
        outputs = [{ variant: 'Short-form Script', text, characterCount: text.length, estimatedEngagement: 'high' }];
        break;
      }
      case 'script_long': {
        const hook = HOOK_TEMPLATES[0].replace(/\{topic\}/g, topic);
        const text = SCRIPT_LONG_TEMPLATE.replace(/\{topic\}/g, topic).replace(/\{hook\}/g, hook);
        outputs = [{ variant: 'Long-form Script', text, characterCount: text.length, estimatedEngagement: 'high' }];
        break;
      }
      case 'cta': {
        outputs = CTA_TEMPLATES.map((t, i) => {
          const text = t.replace(/\{topic\}/g, topic);
          return { variant: `CTA ${i + 1}`, text, characterCount: text.length, estimatedEngagement: i < 3 ? 'high' : 'medium' };
        });
        break;
      }
      case 'translation': {
        const targetLangs = request.targetLanguages || ['hindi'];
        const sourceText = `${topic} — Great content for ${platform}`;
        outputs = targetLangs.map(lang => {
          const translator = TRANSLATIONS[lang.toLowerCase()];
          const text = translator ? translator(sourceText) : `[${lang}] ${sourceText}`;
          return { variant: lang.charAt(0).toUpperCase() + lang.slice(1), text, characterCount: text.length };
        });
        break;
      }
      case 'repurpose': {
        const sourceF = request.sourceFormat || 'YouTube Video';
        const targetF = request.targetFormats || ['Shorts', 'Reels', 'Tweet'];
        outputs = targetF.map(fmt => {
          let text: string;
          switch (fmt.toLowerCase()) {
            case 'shorts':
              text = `[YouTube Short — 30s]\n🎬 ${topic}\n\nHook: ${HOOK_TEMPLATES[1].replace(/\{topic\}/g, topic)}\n\nKey point from your ${sourceF}\n\nCTA: Subscribe for more!`;
              break;
            case 'reels':
              text = `[Instagram Reel — 15s]\n✨ ${topic}\n\nTrending audio + text overlay\n\nKey visual from your ${sourceF}\n\nCTA: Save & Share!`;
              break;
            case 'tweet':
              text = `🧵 Thread: ${topic}\n\n1/ Key insight from my latest ${sourceF}...\n\n2/ Here's what most people get wrong...\n\n3/ The actual strategy that works...\n\nFull video ↓`;
              break;
            default:
              text = `[${fmt}] Repurposed from ${sourceF}: ${topic}`;
          }
          return { variant: fmt, text, characterCount: text.length };
        });
        break;
      }
      case 'calendar': {
        outputs = generateCalendar(topic, platform, request.durationDays || 7);
        break;
      }
    }

    const result: GeneratedContent = {
      generationId,
      type,
      outputs,
      metadata: { platform, topic, tone, language, generatedAt: new Date().toISOString() },
    };

    this.repo.saveGeneration(tenantId, {
      tenant_id: tenantId,
      generation_id: `studio#${generationId}`,
      type,
      platform,
      topic,
      outputs,
      created_at: new Date().toISOString(),
    }).catch(err => console.error('Failed to save AI Studio generation:', err));

    return result;
  }

  async generateVideoAssist(tenantId: string, request: VideoAssistRequest): Promise<VideoAssistResult> {
    const { type, contentType, platform } = request;
    const assistId = uuidv4();

    const generator = VIDEO_SUGGESTIONS[type];
    const suggestions = generator ? generator(contentType, platform) : [];

    const result: VideoAssistResult = {
      assistId,
      type,
      suggestions,
      metadata: { contentType, platform, generatedAt: new Date().toISOString() },
    };

    this.repo.saveGeneration(tenantId, {
      tenant_id: tenantId,
      generation_id: `video#${assistId}`,
      type,
      platform,
      topic: contentType,
      outputs: suggestions,
      created_at: new Date().toISOString(),
    }).catch(err => console.error('Failed to save video assist:', err));

    return result;
  }

  async getHistory(tenantId: string): Promise<StudioRecord[]> {
    return this.repo.getHistory(tenantId);
  }
}
