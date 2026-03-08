import React, { useState } from 'react';
import { useI18n } from '../i18n';

type ContentType = 'caption' | 'hook' | 'script_short' | 'script_long' | 'cta' | 'hashtags' | 'repurpose' | 'calendar';
type Platform = 'youtube' | 'instagram';
type Tone = 'professional' | 'casual' | 'humorous' | 'inspirational' | 'educational';
type TabType = 'content' | 'video';
type VideoType = 'camera_angles' | 'shot_breakdown' | 'editing_style' | 'broll' | 'lighting';

const generateMockContent = (topic: string, type: ContentType, platform: Platform, tone: Tone) => {
  const toneWords: Record<Tone, string[]> = {
    professional: ['strategically', 'effectively', 'optimally', 'significantly'],
    casual: ['honestly', 'literally', 'super', 'lowkey'],
    humorous: ['hilariously', 'surprisingly', 'shockingly', 'ridiculously'],
    inspirational: ['powerfully', 'boldly', 'fearlessly', 'brilliantly'],
    educational: ['specifically', 'technically', 'precisely', 'fundamentally'],
  };
  const tw = toneWords[tone][Math.floor(Math.random() * 4)];

  const templates: Record<ContentType, string[]> = {
    caption: [
      `🔥 ${topic} is ${tw} changing the game this year! Here's what you need to know 👇\n\nThe way ${platform === 'youtube' ? 'thumbnails' : 'reels'} work for ${topic} content has shifted dramatically. Are you keeping up?\n\nComment "GUIDE" below and I'll DM you my complete breakdown ⬇️`,
      `Everything you thought you knew about ${topic} is wrong.\n\nI spent 3 months testing this ${tw} and the results shocked me.\n\nSave this post — you'll want to come back to it. 💾`,
      `POV: You discover ${topic} and your engagement ${tw} doubles in 30 days.\n\nThis isn't luck. It's strategy. 🎯\n\nFollow for daily ${platform === 'youtube' ? 'creator' : 'creator'} growth tips.`,
    ],
    hook: [
      `"I went from 0 to 100K followers by doing ONE thing differently with ${topic}…"`,
      `"Stop scrolling. If you're a creator working on ${topic}, this will save you months."`,
      `"The ${topic} strategy top creators use (and nobody talks about)"`,
      `"I tried every ${topic} hack out there. Here's what ${tw} works."`,
    ],
    script_short: [
      `HOOK: "This ${topic} trick changed everything for me."\n\nBODY: Most creators approach ${topic} completely backwards. Instead of [common mistake], you should [correct approach]. I tested this ${tw} and my results: [impressive stat].\n\nCTA: Follow for more ${topic} strategies that actually work.`,
    ],
    script_long: [
      `[INTRO - 0:00-0:30]\nHey everyone, welcome back. Today we're diving deep into ${topic} — specifically the strategy that helped me ${tw} grow this channel.\n\n[MAIN CONTENT - 0:30-8:00]\nFirst, let's understand why most people get ${topic} wrong...\n[Point 1: Common mistake]\n[Point 2: The correct framework]\n[Point 3: Real examples]\n\n[CTA - 8:00-8:30]\nIf you found this valuable, smash that like button and subscribe. Comment your biggest ${topic} challenge below!\n\n[OUTRO - 8:30-9:00]\nSee you in the next one!`,
    ],
    cta: [
      `👉 Follow @myhandle for daily ${topic} tips\n💬 Comment "YES" if this was helpful\n🔔 Turn on notifications so you never miss our ${topic} content\n📲 Share with a creator who needs to see this`,
    ],
    hashtags: [
      `#${topic.replace(/\s+/g, '')} #${platform}Creator #ContentCreator #CreatorTips #${topic.replace(/\s+/g, '')}Tips #ContentStrategy #GrowthHacks #CreatorEconomy #DigitalMarketing #ContentMarketing #${platform.charAt(0).toUpperCase() + platform.slice(1)}Growth #ViralContent #SocialMediaMarketing #CreatorLife #BuildInPublic`,
    ],
    repurpose: [
      `REPURPOSED CONTENT PACK for: "${topic}"\n\n🎬 Long-form YouTube video → 3x Reels/Shorts\n📝 Blog post → 5x Twitter threads\n🎙️ Podcast episode → 10x Instagram carousels\n📊 Case study → LinkedIn article + infographic\n\nYour next 2 weeks of content is already here — just reformat!`,
    ],
    calendar: [
      `CONTENT CALENDAR — ${topic} (2 weeks)\n\nWeek 1:\nMon: "The basics of ${topic}" (educational)\nWed: "My ${topic} results after 30 days" (personal story)\nFri: "${topic} myths debunked" (controversial)\n\nWeek 2:\nMon: "${topic} tools I use daily" (listicle)\nWed: "${topic} Q&A" (community engagement)\nFri: "${topic} advanced strategies" (deep-dive)`,
    ],
  };

  const outputs = templates[type];
  return outputs[Math.floor(Math.random() * outputs.length)];
};

const generateVideoAdvice = (type: VideoType, contentType: string, platform: Platform) => {
  const advice: Record<VideoType, string> = {
    camera_angles: `📹 CAMERA ANGLE GUIDE for "${contentType}" on ${platform}\n\n1. WIDE SHOT (0:00–0:05): Establish setting, show full environment\n2. MEDIUM SHOT (most of video): Main content delivery, eye-level\n3. CLOSE-UP (key moments): Emphasize emotion and product details\n4. OVER-THE-SHOULDER: Great for tutorials and demonstrations\n\n💡 Pro tip: Change angles every 15–30 seconds to maintain attention.`,
    shot_breakdown: `🎬 SHOT BREAKDOWN for "${contentType}"\n\nOpening (0:00–0:10): Hook shot — dramatic reveal or bold statement\nIntro (0:10–0:40): Talking head, medium shot, clean background\nMain Content (0:40–end): Mix of B-roll + talking head\nCTA (last 30s): Direct camera, medium close-up\n\nTotal recommended shots: 8-15 for ${platform === 'youtube' ? 'long-form' : 'Reels'}`,
    editing_style: `✂️ EDITING STYLE for ${platform}\n\nCut rhythm: Every 3–5 seconds (keep energy high)\nTransitions: Jump cuts + smash cuts (avoid cheesy wipes)\nText overlays: Bold, high contrast, max 6 words\nMusic: Upbeat background, -15 to -20 dB under voice\nColor grade: Warm tones boost watch time by ~8%\n\nTools: CapCut (mobile), DaVinci Resolve (free, desktop)`,
    broll: `🎥 B-ROLL CHECKLIST for "${contentType}"\n\n✅ Screen recordings (show don't tell)\n✅ Over-shoulder shots (creates intimacy)\n✅ Close-ups of hands/product\n✅ Lifestyle shots (morning routine, workspace)\n✅ Before/after comparisons\n✅ Text animations and callouts\n\nAim for 50% B-roll, 50% talking head for ${platform} content.`,
    lighting: `💡 LIGHTING GUIDE for ${platform} Content\n\nIdeal setup: Ring light OR window light (soft, diffused)\nPosition: Light source in FRONT of you, slightly above eye level\nAvoid: Overhead lighting (creates harsh shadows)\nBackground: 2 stops darker than your face = professional look\n\nBudget options:\n• $30: Ring light from Amazon\n• $0: Face a window during golden hour (6–9 AM or 4–7 PM)`,
  };
  return advice[type];
};

const AiStudio: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [variants, setVariants] = useState<string[]>([]);
  const [activeVariant, setActiveVariant] = useState(0);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    topic: '',
    type: 'caption' as ContentType,
    platform: 'youtube' as Platform,
    tone: 'casual' as Tone,
    count: '3',
  });

  const [videoForm, setVideoForm] = useState({
    contentType: '',
    type: 'camera_angles' as VideoType,
    platform: 'youtube' as Platform,
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topic.trim()) return;
    setLoading(true);
    setResult(null);
    setVariants([]);
    await new Promise(r => setTimeout(r, 1200));
    const count = parseInt(form.count) || 1;
    const generated = Array.from({ length: count }, () =>
      generateMockContent(form.topic, form.type, form.platform, form.tone)
    );
    setVariants(generated);
    setResult(generated[0]);
    setActiveVariant(0);
    setLoading(false);
  };

  const handleVideoGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoForm.contentType.trim()) return;
    setLoading(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 1000));
    const advice = generateVideoAdvice(videoForm.type, videoForm.contentType, videoForm.platform);
    setResult(advice);
    setVariants([advice]);
    setLoading(false);
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setResult(null);
    setVariants([]);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>🎨 {t('aiStudio.title')}</h2>
        <p className="page-subtitle">{t('aiStudio.subtitle')}</p>
      </div>

      {/* Tab Selector */}
      <div className="form-row" style={{ marginBottom: '1.5rem', gap: '0.75rem' }}>
        <button
          type="button"
          className={activeTab === 'content' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => handleTabChange('content')}
        >
          ✍️ {t('aiStudio.contentTab')}
        </button>
        <button
          type="button"
          className={activeTab === 'video' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => handleTabChange('video')}
        >
          🎬 {t('aiStudio.videoTab')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1.5rem' }}>
        {/* Form */}
        <div className="card">
          {activeTab === 'content' ? (
            <form onSubmit={handleGenerate}>
              <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>{t('aiStudio.contentSettings')}</h3>

              <div className="form-group">
                <label className="form-label">{t('aiStudio.topicLabel')}</label>
                <input
                  className="form-input"
                  value={form.topic}
                  onChange={e => setForm({ ...form, topic: e.target.value })}
                  placeholder={t('aiStudio.topicPlaceholder')}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('aiStudio.contentTypeLabel')}</label>
                <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ContentType })}>
                  <option value="caption">📝 {t('aiStudio.type.caption')}</option>
                  <option value="hook">🪝 {t('aiStudio.type.hook')}</option>
                  <option value="script_short">📋 {t('aiStudio.type.script_short')}</option>
                  <option value="script_long">📄 {t('aiStudio.type.script_long')}</option>
                  <option value="cta">📣 {t('aiStudio.type.cta')}</option>
                  <option value="hashtags">🏷️ {t('aiStudio.type.hashtags')}</option>
                  <option value="repurpose">♻️ {t('aiStudio.type.repurpose')}</option>
                  <option value="calendar">📅 {t('aiStudio.type.calendar')}</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('aiStudio.platformLabel')}</label>
                  <select className="form-select" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value as Platform })}>
                    <option value="youtube">▶️ {t('common.youtube')}</option>
                    <option value="instagram">📷 {t('common.instagram')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('aiStudio.toneLabel')}</label>
                  <select className="form-select" value={form.tone} onChange={e => setForm({ ...form, tone: e.target.value as Tone })}>
                    <option value="casual">😎 {t('aiStudio.tone.casual')}</option>
                    <option value="professional">👔 {t('aiStudio.tone.professional')}</option>
                    <option value="humorous">😄 {t('aiStudio.tone.humorous')}</option>
                    <option value="inspirational">🌟 {t('aiStudio.tone.inspirational')}</option>
                    <option value="educational">🎓 {t('aiStudio.tone.educational')}</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('aiStudio.variantsLabel')}</label>
                <select className="form-select" value={form.count} onChange={e => setForm({ ...form, count: e.target.value })}>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                {loading ? `⏳ ${t('aiStudio.generatingBtn')}` : `✨ ${t('aiStudio.generateBtn')}`}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVideoGenerate}>
              <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>{t('aiStudio.videoSettings')}</h3>

              <div className="form-group">
                <label className="form-label">{t('aiStudio.videoContentLabel')}</label>
                <input
                  className="form-input"
                  value={videoForm.contentType}
                  onChange={e => setVideoForm({ ...videoForm, contentType: e.target.value })}
                  placeholder={t('aiStudio.videoContentPlaceholder')}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('aiStudio.videoTypeLabel')}</label>
                <select className="form-select" value={videoForm.type} onChange={e => setVideoForm({ ...videoForm, type: e.target.value as VideoType })}>
                  <option value="camera_angles">📹 {t('aiStudio.video.camera_angles')}</option>
                  <option value="shot_breakdown">🎬 {t('aiStudio.video.shot_breakdown')}</option>
                  <option value="editing_style">✂️ {t('aiStudio.video.editing_style')}</option>
                  <option value="broll">🎥 {t('aiStudio.video.broll')}</option>
                  <option value="lighting">💡 {t('aiStudio.video.lighting')}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('aiStudio.platformLabel')}</label>
                <select className="form-select" value={videoForm.platform} onChange={e => setVideoForm({ ...videoForm, platform: e.target.value as Platform })}>
                  <option value="youtube">▶️ {t('common.youtube')}</option>
                  <option value="instagram">📷 {t('common.instagram')}</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                {loading ? `⏳ ${t('aiStudio.generatingBtn')}` : `🎬 ${t('aiStudio.videoGenerateBtn')}`}
              </button>
            </form>
          )}
        </div>

        {/* Results */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>{t('aiStudio.generatedOutput')}</h3>
            {result && (
              <button onClick={handleCopy} className="btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
                {copied ? `✅ ${t('aiStudio.copiedBtn')}` : `📋 ${t('aiStudio.copyBtn')}`}
              </button>
            )}
          </div>

          {/* Variant tabs */}
          {variants.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {variants.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveVariant(i); setResult(variants[i]); }}
                  className={activeVariant === i ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem' }}
                >
                  {t('aiStudio.variant')} {i + 1}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✨</div>
              <p>{t('aiStudio.generatingBtn')}</p>
            </div>
          )}

          {result && !loading && (
            <pre style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              padding: '1.25rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '0.875rem',
              lineHeight: '1.7',
              color: 'var(--text-primary)',
              minHeight: '200px',
              fontFamily: 'inherit',
              border: '1px solid var(--border-color)',
            }}>{result}</pre>
          )}

          {!result && !loading && (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎨</div>
              <p>{t('aiStudio.fillForm')}</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.6 }}>{t('aiStudio.fillFormSub')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiStudio;
