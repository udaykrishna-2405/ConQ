import React, { useState } from 'react';
import { useI18n } from '../i18n';

type Platform = 'youtube' | 'instagram';
type Niche = 'tech' | 'fitness' | 'food' | 'fashion' | 'education' | 'gaming' | 'travel' | 'finance' | 'default';
type Tier = 'nano' | 'micro' | 'mid' | 'macro' | 'mega';

const getTier = (followers: number): Tier => {
  if (followers >= 1_000_000) return 'mega';
  if (followers >= 100_000) return 'macro';
  if (followers >= 10_000) return 'mid';
  if (followers >= 1_000) return 'micro';
  return 'nano';
};

const TIER_INFO: Record<Tier, { label: string; emoji: string; color: string; bg: string }> = {
  nano: { label: 'Nano Creator', emoji: '🌱', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  micro: { label: 'Micro Creator', emoji: '⚡', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  mid: { label: 'Mid Tier', emoji: '🔥', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  macro: { label: 'Macro Creator', emoji: '🚀', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  mega: { label: 'Mega Creator', emoji: '👑', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
};

function computeScorecard(followers: number, engagement: number, postsPerWeek: number, avgViews: number, niche: Niche, platform: Platform) {
  const engRate = engagement / 100;
  const tier = getTier(followers);

  const audienceScore = Math.min(100, Math.round(Math.log10(Math.max(followers, 1)) * 20));
  const engagementScore = Math.min(100, Math.round(engRate * 1200));
  const consistencyScore = Math.min(100, Math.round(postsPerWeek * 20));
  const reachScore = Math.min(100, Math.round((avgViews / Math.max(followers, 1)) * 200));
  const contentQualityScore = Math.min(100, Math.round(65 + Math.random() * 20));

  const overall = Math.round(
    audienceScore * 0.2 + engagementScore * 0.25 + consistencyScore * 0.2 + reachScore * 0.15 + contentQualityScore * 0.2
  );

  const getGrade = (s: number) => {
    if (s >= 90) return 'A+'; if (s >= 80) return 'A'; if (s >= 70) return 'B+';
    if (s >= 60) return 'B'; if (s >= 50) return 'C+'; if (s >= 40) return 'C';
    return 'D';
  };

  const percentile = Math.min(99, Math.max(1, Math.round(overall * 0.6 + (engRate / 0.04) * 25 + (followers > 10000 ? 15 : 0))));
  const brandValue = Math.round(followers * engRate * 50 * { nano: 0.5, micro: 0.8, mid: 1.2, macro: 2, mega: 5 }[tier]);

  const dimensions = [
    { nameKey: 'scorecard.audience', score: audienceScore, icon: '👥', tip: audienceScore < 60 ? 'Collaborate and use trending topics to grow faster' : 'Strong audience — focus on retention' },
    { nameKey: 'scorecard.engagement', score: engagementScore, icon: '❤️', tip: engagementScore < 60 ? 'Reply to comments within 1 hour, ask questions in content' : 'Great engagement! Nurture your most active fans' },
    { nameKey: 'scorecard.consistency', score: consistencyScore, icon: '📅', tip: consistencyScore < 60 ? 'Create a content calendar and batch-create on weekends' : 'Excellent consistency — keep the momentum' },
    { nameKey: 'scorecard.reach', score: reachScore, icon: '📡', tip: reachScore < 60 ? 'Optimize titles/thumbnails: first 3 seconds determine reach' : 'Great reach! Experiment with new content formats' },
    { nameKey: 'scorecard.quality', score: contentQualityScore, icon: '✨', tip: contentQualityScore < 70 ? 'Invest in better audio — it impacts retention more than visual quality' : 'High quality content! Try advanced storytelling techniques' },
  ];

  const badges = [
    { name: 'Rising Star', icon: '⭐', earned: followers >= 1000, desc: '1K+ followers' },
    { name: 'Community Builder', icon: '🤝', earned: engRate >= 0.05, desc: '5%+ engagement' },
    { name: 'Consistency King', icon: '👑', earned: postsPerWeek >= 5, desc: '5+ posts/week' },
    { name: 'Brand Ready', icon: '💼', earned: overall >= 70 && followers >= 10000, desc: 'Score 70+ & 10K followers' },
    { name: 'Viral Potential', icon: '🔥', earned: ['mid', 'macro', 'mega'].includes(tier) && engRate >= 0.04, desc: 'Mid tier+ & 4%+ engagement' },
    { name: 'Top Performer', icon: '🏆', earned: overall >= 85, desc: 'Overall score 85+' },
    { name: 'Engagement Expert', icon: '💬', earned: engRate >= 0.08, desc: '8%+ engagement rate' },
    { name: 'Content Machine', icon: '🎬', earned: postsPerWeek >= 7, desc: '7+ posts/week' },
  ];

  const improvements = [...dimensions]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((d, i) => ({ priority: i + 1, nameKey: d.nameKey, score: d.score, action: d.tip }));

  return { overall, grade: getGrade(overall), tier, percentile, brandValue, dimensions, badges, improvements };
}

const CreatorScorecard: React.FC = () => {
  const { t } = useI18n();
  const [form, setForm] = useState({
    platform: 'youtube' as Platform,
    niche: 'tech' as Niche,
    followers: 15000,
    engagement: 4.2,
    postsPerWeek: 3,
    avgViews: 5000,
  });
  const [scorecard, setScorecard] = useState<ReturnType<typeof computeScorecard> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setScorecard(computeScorecard(form.followers, form.engagement, form.postsPerWeek, form.avgViews, form.niche, form.platform));
    setLoading(false);
  };

  const scoreColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#3b82f6' : s >= 40 ? '#f59e0b' : '#ef4444';
  const gradeColor = (g: string) => g.startsWith('A') ? '#10b981' : g.startsWith('B') ? '#3b82f6' : g.startsWith('C') ? '#f59e0b' : '#ef4444';

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>🏆 {t('scorecard.title')}</h2>
        <p className="page-subtitle">{t('scorecard.subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', marginBottom: '1.25rem' }}>{t('scorecard.title')}</h3>
          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label className="form-label">{t('scorecard.platformLabel')}</label>
              <select className="form-select" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value as Platform })}>
                <option value="youtube">▶️ {t('common.youtube')}</option>
                <option value="instagram">📷 {t('common.instagram')}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('scorecard.nicheLabel')}</label>
              <select className="form-select" value={form.niche} onChange={e => setForm({ ...form, niche: e.target.value as Niche })}>
                {['tech','fitness','food','fashion','education','gaming','travel','finance','default'].map(n => (
                  <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('scorecard.followersLabel')}</label>
              <input type="number" className="form-input" value={form.followers}
                onChange={e => setForm({ ...form, followers: parseInt(e.target.value) || 0 })} min={0} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('scorecard.engagementLabel')}</label>
              <input type="number" className="form-input" value={form.engagement} step={0.1}
                onChange={e => setForm({ ...form, engagement: parseFloat(e.target.value) || 0 })} min={0} max={100} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('scorecard.postsWeekLabel')}</label>
              <input type="number" className="form-input" value={form.postsPerWeek}
                onChange={e => setForm({ ...form, postsPerWeek: parseInt(e.target.value) || 1 })} min={1} max={21} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('scorecard.avgViewsLabel')}</label>
              <input type="number" className="form-input" value={form.avgViews}
                onChange={e => setForm({ ...form, avgViews: parseInt(e.target.value) || 0 })} min={0} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? `⏳ ${t('scorecard.generatingBtn')}` : `🏆 ${t('scorecard.generateBtn')}`}
            </button>
          </form>
        </div>

        {scorecard ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card" style={{ textAlign: 'center', background: `linear-gradient(135deg, ${TIER_INFO[scorecard.tier].bg}, var(--bg-card))`, border: `2px solid ${TIER_INFO[scorecard.tier].color}` }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{TIER_INFO[scorecard.tier].emoji}</div>
              <div style={{ fontSize: '0.875rem', color: TIER_INFO[scorecard.tier].color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                {TIER_INFO[scorecard.tier].label}
              </div>
              <div style={{ fontSize: '5rem', fontWeight: 900, lineHeight: 1, color: gradeColor(scorecard.grade) }}>{scorecard.grade}</div>
              <div style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>
                {t('scorecard.overallScore')}: <strong style={{ color: 'var(--text-primary)' }}>{scorecard.overall}/100</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '0.75rem', fontSize: '0.82rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#3b82f6' }}>{scorecard.percentile}th</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{t('scorecard.percentile')}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#10b981' }}>₹{scorecard.brandValue.toLocaleString('en-IN')}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{t('scorecard.brandDealValue')}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>📊 {t('scorecard.dimensions')}</h3>
              {scorecard.dimensions.map(d => (
                <div key={d.nameKey} style={{ marginBottom: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.85rem' }}>{d.icon} {t(d.nameKey)}</span>
                    <span style={{ fontWeight: 700, color: scoreColor(d.score), fontSize: '0.85rem' }}>{d.score}/100</span>
                  </div>
                  <div style={{ height: '10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${d.score}%`, height: '100%', backgroundColor: scoreColor(d.score), borderRadius: '5px', transition: 'width 0.7s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.875rem' }}>🏅 {t('scorecard.earnedBadges')}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {scorecard.badges.map(b => (
                  <div key={b.name} style={{
                    textAlign: 'center', padding: '0.75rem 0.5rem', borderRadius: '8px',
                    backgroundColor: b.earned ? 'rgba(59,130,246,0.1)' : 'var(--bg-secondary)',
                    border: `1px solid ${b.earned ? '#3b82f6' : 'var(--border-color)'}`,
                    opacity: b.earned ? 1 : 0.5,
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem', filter: b.earned ? 'none' : 'grayscale(1)' }}>{b.icon}</div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 600 }}>{b.name}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{b.desc}</div>
                    {b.earned && <div style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 700, marginTop: '0.25rem' }}>✅</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, #0f2027, #1e3a5f)', border: '1px solid #3b82f6' }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.875rem', color: '#93c5fd' }}>🚀 {t('scorecard.growthRoadmap')}</h3>
              {scorecard.improvements.map(item => (
                <div key={item.priority} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: '#3b82f6', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>
                    {item.priority}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e2e8f0' }}>
                      {t(item.nameKey)} <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>({t('automation.score')}: {item.score}/100)</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem', lineHeight: 1.5 }}>{item.action}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
            <p>{t('scorecard.fillForm')}</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.6 }}>{t('scorecard.fillFormSub')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorScorecard;
