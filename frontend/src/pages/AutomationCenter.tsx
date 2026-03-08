import React, { useState } from 'react';
import { useI18n } from '../i18n';

type Platform = 'youtube' | 'instagram' | 'both';
type Niche = 'tech' | 'fitness' | 'food' | 'fashion' | 'education' | 'gaming' | 'travel' | 'finance' | 'default';
type ActiveTab = 'schedule' | 'hashtags' | 'abtest';

const OPTIMAL_TIMES: Record<string, { day: string; time: string; reach: string; reason: string }[]> = {
  youtube: [
    { day: 'Thursday', time: '2:00 PM – 4:00 PM IST', reach: '+48% avg reach', reason: 'Mid-week engagement peak, subscribers online after work' },
    { day: 'Saturday', time: '11:00 AM – 1:00 PM IST', reach: '+62% avg reach', reason: 'Weekend browsing peak — highest watch time globally' },
    { day: 'Sunday', time: '3:00 PM – 5:00 PM IST', reach: '+55% avg reach', reason: 'Pre-week content catch-up, family viewing time' },
  ],
  instagram: [
    { day: 'Tuesday', time: '9:00 AM – 11:00 AM IST', reach: '+51% avg reach', reason: 'Morning scroll habit strong on weekdays' },
    { day: 'Wednesday', time: '6:00 PM – 8:00 PM IST', reach: '+67% avg reach', reason: 'Post-work dopamine peak — highest saves & shares' },
    { day: 'Friday', time: '12:00 PM – 2:00 PM IST', reach: '+58% avg reach', reason: 'End-of-week energy, weekend planning mindset' },
  ],
  both: [
    { day: 'Wednesday', time: '12:00 PM – 2:00 PM IST', reach: '+55% avg reach', reason: 'Cross-platform engagement peak mid-week' },
    { day: 'Saturday', time: '10:00 AM – 12:00 PM IST', reach: '+63% avg reach', reason: 'Weekend browsing — both platforms peak simultaneously' },
    { day: 'Sunday', time: '6:00 PM – 8:00 PM IST', reach: '+50% avg reach', reason: 'Sunday evening relaxation browsing window' },
  ],
};

const HASHTAG_PACKS: Record<Niche, { tag: string; volume: string; competition: string }[]> = {
  tech: [
    { tag: '#TechTips', volume: '2.1M posts', competition: 'High' },
    { tag: '#TechReview', volume: '1.8M posts', competition: 'High' },
    { tag: '#GadgetReview', volume: '890K posts', competition: 'Medium' },
    { tag: '#TechIndia', volume: '450K posts', competition: 'Low' },
    { tag: '#AndroidTips', volume: '320K posts', competition: 'Low' },
    { tag: '#SmartphoneReview', volume: '760K posts', competition: 'Medium' },
    { tag: '#TechCreator', volume: '210K posts', competition: 'Low' },
    { tag: '#TechYouTuber', volume: '180K posts', competition: 'Low' },
    { tag: '#IndianTech', volume: '290K posts', competition: 'Low' },
    { tag: '#TechNews', volume: '3.2M posts', competition: 'High' },
  ],
  fitness: [
    { tag: '#FitnessMotivation', volume: '5.2M posts', competition: 'High' },
    { tag: '#WorkoutTips', volume: '1.9M posts', competition: 'High' },
    { tag: '#FitIndia', volume: '680K posts', competition: 'Medium' },
    { tag: '#HomeWorkout', volume: '2.1M posts', competition: 'High' },
    { tag: '#GymLife', volume: '4.5M posts', competition: 'High' },
    { tag: '#FitnessJourney', volume: '3.1M posts', competition: 'High' },
    { tag: '#HealthyLifestyle', volume: '6.8M posts', competition: 'High' },
    { tag: '#IndianFitness', volume: '450K posts', competition: 'Low' },
    { tag: '#Calisthenics', volume: '1.2M posts', competition: 'Medium' },
    { tag: '#NutritionTips', volume: '890K posts', competition: 'Medium' },
  ],
  food: [
    { tag: '#FoodPhotography', volume: '8.1M posts', competition: 'High' },
    { tag: '#IndianFood', volume: '5.4M posts', competition: 'High' },
    { tag: '#RecipeVideo', volume: '2.3M posts', competition: 'High' },
    { tag: '#CookingTips', volume: '1.8M posts', competition: 'High' },
    { tag: '#HomeCooking', volume: '3.4M posts', competition: 'High' },
    { tag: '#StreetFood', volume: '4.2M posts', competition: 'High' },
    { tag: '#VeganIndia', volume: '420K posts', competition: 'Low' },
    { tag: '#QuickRecipes', volume: '1.1M posts', competition: 'Medium' },
    { tag: '#FoodBlogger', volume: '6.7M posts', competition: 'High' },
    { tag: '#MumbaiFoodie', volume: '380K posts', competition: 'Low' },
  ],
  finance: [
    { tag: '#PersonalFinance', volume: '2.8M posts', competition: 'High' },
    { tag: '#InvestingTips', volume: '1.6M posts', competition: 'High' },
    { tag: '#StockMarket', volume: '3.2M posts', competition: 'High' },
    { tag: '#FinancialFreedom', volume: '4.1M posts', competition: 'High' },
    { tag: '#MoneyTips', volume: '2.4M posts', competition: 'High' },
    { tag: '#IndianInvestor', volume: '560K posts', competition: 'Medium' },
    { tag: '#MutualFunds', volume: '890K posts', competition: 'Medium' },
    { tag: '#SIPInvesting', volume: '320K posts', competition: 'Low' },
    { tag: '#FinancialPlanning', volume: '1.2M posts', competition: 'Medium' },
    { tag: '#Zerodha', volume: '280K posts', competition: 'Low' },
  ],
  default: [
    { tag: '#ContentCreator', volume: '4.5M posts', competition: 'High' },
    { tag: '#YouTubeIndia', volume: '2.1M posts', competition: 'High' },
    { tag: '#IndianCreator', volume: '890K posts', competition: 'Medium' },
    { tag: '#CreatorEconomy', volume: '560K posts', competition: 'Medium' },
    { tag: '#SocialMedia', volume: '8.9M posts', competition: 'High' },
    { tag: '#ContentMarketing', volume: '3.4M posts', competition: 'High' },
    { tag: '#DigitalIndia', volume: '1.2M posts', competition: 'Medium' },
    { tag: '#GrowthHacking', volume: '780K posts', competition: 'Medium' },
    { tag: '#Viral', volume: '12M posts', competition: 'High' },
    { tag: '#Trending', volume: '15M posts', competition: 'High' },
  ],
  education: [
    { tag: '#LearningEveryDay', volume: '2.3M posts', competition: 'High' },
    { tag: '#EdTech', volume: '1.4M posts', competition: 'High' },
    { tag: '#StudyTips', volume: '3.1M posts', competition: 'High' },
    { tag: '#OnlineLearning', volume: '2.8M posts', competition: 'High' },
    { tag: '#SkillDevelopment', volume: '890K posts', competition: 'Medium' },
    { tag: '#IndianStudents', volume: '560K posts', competition: 'Low' },
    { tag: '#Education', volume: '10.2M posts', competition: 'High' },
    { tag: '#TeacherLife', volume: '1.1M posts', competition: 'Medium' },
    { tag: '#ELearning', volume: '2.1M posts', competition: 'High' },
    { tag: '#Motivation', volume: '18M posts', competition: 'High' },
  ],
  gaming: [
    { tag: '#Gaming', volume: '25M posts', competition: 'High' },
    { tag: '#GameReview', volume: '2.1M posts', competition: 'High' },
    { tag: '#IndianGamer', volume: '780K posts', competition: 'Medium' },
    { tag: '#BGMI', volume: '4.5M posts', competition: 'High' },
    { tag: '#GamingCommunity', volume: '5.2M posts', competition: 'High' },
    { tag: '#GameStreamer', volume: '1.3M posts', competition: 'High' },
    { tag: '#PCGaming', volume: '3.8M posts', competition: 'High' },
    { tag: '#MobileGaming', volume: '4.1M posts', competition: 'High' },
    { tag: '#GamingSetup', volume: '2.9M posts', competition: 'High' },
    { tag: '#FreeFire', volume: '8.2M posts', competition: 'High' },
  ],
  travel: [
    { tag: '#TravelIndia', volume: '6.8M posts', competition: 'High' },
    { tag: '#Wanderlust', volume: '12M posts', competition: 'High' },
    { tag: '#TravelPhotography', volume: '9.4M posts', competition: 'High' },
    { tag: '#IncredibleIndia', volume: '5.1M posts', competition: 'High' },
    { tag: '#BudgetTravel', volume: '2.3M posts', competition: 'High' },
    { tag: '#SoloTravel', volume: '4.7M posts', competition: 'High' },
    { tag: '#HiddenGems', volume: '1.8M posts', competition: 'Medium' },
    { tag: '#TravelVlog', volume: '3.2M posts', competition: 'High' },
    { tag: '#TravelTips', volume: '4.5M posts', competition: 'High' },
    { tag: '#RoadTrip', volume: '5.6M posts', competition: 'High' },
  ],
  fashion: [
    { tag: '#Fashion', volume: '32M posts', competition: 'High' },
    { tag: '#OOTD', volume: '18M posts', competition: 'High' },
    { tag: '#IndianFashion', volume: '3.4M posts', competition: 'High' },
    { tag: '#StyleTips', volume: '4.1M posts', competition: 'High' },
    { tag: '#FashionBlogger', volume: '8.2M posts', competition: 'High' },
    { tag: '#Ethnic', volume: '2.8M posts', competition: 'Medium' },
    { tag: '#SareeStyle', volume: '1.9M posts', competition: 'Medium' },
    { tag: '#StreetStyle', volume: '5.6M posts', competition: 'High' },
    { tag: '#FashionInspiration', volume: '7.3M posts', competition: 'High' },
    { tag: '#DesignerWear', volume: '1.2M posts', competition: 'Medium' },
  ],
};

function generateABTest(titleA: string, titleB: string, platform: string) {
  const scoreA = Math.round(50 + Math.random() * 35 + (titleA.includes('?') ? 8 : 0) + (titleA.length < 60 ? 5 : 0));
  const scoreB = Math.round(50 + Math.random() * 35 + (titleB.includes('!') ? 5 : 0) + (titleB.length < 60 ? 5 : 0));
  const winner = scoreA >= scoreB ? 'A' : 'B';
  return {
    variantA: { title: titleA, ctrScore: Math.min(100, scoreA), clickability: Math.round(scoreA * 0.95), curiosityGap: Math.round(scoreA * 0.8 + Math.random() * 15) },
    variantB: { title: titleB, ctrScore: Math.min(100, scoreB), clickability: Math.round(scoreB * 0.95), curiosityGap: Math.round(scoreB * 0.8 + Math.random() * 15) },
    winner,
    recommendation: winner === 'A'
      ? `"${titleA.slice(0, 40)}…" is predicted to perform better. It has stronger click signals.`
      : `"${titleB.slice(0, 40)}…" is predicted to perform better. It has stronger emotional triggers.`,
    tips: [
      'Add a number (e.g. "7 Ways") to boost CTR by ~23%',
      'Start with a power word: Secret, Surprising, Essential, Ultimate',
      platform === 'youtube' ? 'Keep under 60 chars — YouTube truncates longer titles' : 'Use emojis in Instagram captions for +15% engagement',
      'Use "you/your" to create a personal connection',
    ],
  };
}

const AutomationCenter: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<ActiveTab>('schedule');
  const [loading, setLoading] = useState(false);

  const [schedForm, setSchedForm] = useState({ platform: 'youtube' as Platform, niche: 'tech' as Niche, contentTitle: '', frequency: '3' });
  const [schedule, setSchedule] = useState<typeof OPTIMAL_TIMES.youtube | null>(null);

  const [hashForm, setHashForm] = useState({ niche: 'tech' as Niche, platform: 'instagram' as 'youtube' | 'instagram', count: '10' });
  const [hashtags, setHashtags] = useState<typeof HASHTAG_PACKS.tech | null>(null);

  const [abForm, setAbForm] = useState({ titleA: '', titleB: '', platform: 'youtube' });
  const [abResult, setAbResult] = useState<ReturnType<typeof generateABTest> | null>(null);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setSchedule(OPTIMAL_TIMES[schedForm.platform]);
    setLoading(false);
  };

  const handleHashtags = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const all = HASHTAG_PACKS[hashForm.niche] || HASHTAG_PACKS.default;
    setHashtags(all.slice(0, parseInt(hashForm.count)));
    setLoading(false);
  };

  const handleABTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!abForm.titleA.trim() || !abForm.titleB.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setAbResult(generateABTest(abForm.titleA, abForm.titleB, abForm.platform));
    setLoading(false);
  };

  const competitionColor = (c: string) => c === 'Low' ? '#10b981' : c === 'Medium' ? '#f59e0b' : '#ef4444';

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>⚡ {t('automation.title')}</h2>
        <p className="page-subtitle">{t('automation.subtitle')}</p>
      </div>

      <div className="form-row" style={{ marginBottom: '1.5rem', gap: '0.75rem' }}>
        <button type="button" className={activeTab === 'schedule' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('schedule')}>
          📅 {t('automation.scheduleTab')}
        </button>
        <button type="button" className={activeTab === 'hashtags' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('hashtags')}>
          🏷️ {t('automation.hashtagTab')}
        </button>
        <button type="button" className={activeTab === 'abtest' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('abtest')}>
          🔬 {t('automation.abTab')}
        </button>
      </div>

      {/* Smart Schedule */}
      {activeTab === 'schedule' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <div className="card">
            <form onSubmit={handleSchedule}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>{t('automation.scheduleTab')}</h3>
              <div className="form-group">
                <label className="form-label">{t('automation.platformLabel')}</label>
                <select className="form-select" value={schedForm.platform} onChange={e => setSchedForm({ ...schedForm, platform: e.target.value as Platform })}>
                  <option value="youtube">▶️ {t('common.youtube')}</option>
                  <option value="instagram">📷 {t('common.instagram')}</option>
                  <option value="both">🔀 Both Platforms</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('automation.nicheLabel')}</label>
                <select className="form-select" value={schedForm.niche} onChange={e => setSchedForm({ ...schedForm, niche: e.target.value as Niche })}>
                  {['tech','fitness','food','fashion','education','gaming','travel','finance','default'].map(n => (
                    <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('aiStudio.topicLabel')}</label>
                <input className="form-input" value={schedForm.contentTitle} onChange={e => setSchedForm({ ...schedForm, contentTitle: e.target.value })} placeholder="e.g. iPhone 16 Pro Review" />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? `⏳ ${t('automation.generatingBtn')}` : `📅 ${t('automation.generateScheduleBtn')}`}
              </button>
            </form>
          </div>

          <div>
            {schedule ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  🕐 {t('automation.optimalTimes')} — <strong style={{ color: 'var(--text-primary)' }}>{schedForm.platform}</strong>
                </div>
                {schedule.map((s, i) => (
                  <div key={i} className="card" style={{ border: i === 0 ? '2px solid #3b82f6' : '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          {i === 0 && <span style={{ backgroundColor: '#3b82f6', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '3px', fontWeight: 700 }}>BEST</span>}
                          <span style={{ fontWeight: 700, fontSize: '1rem' }}>#{i + 1} — {s.day}</span>
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#3b82f6' }}>{s.time}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.4rem' }}>{s.reason}</div>
                      </div>
                      <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.3rem 0.7rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {s.reach}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                <p>{t('automation.fillSchedule')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hashtag Generator */}
      {activeTab === 'hashtags' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <div className="card">
            <form onSubmit={handleHashtags}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>{t('automation.hashtagTab')}</h3>
              <div className="form-group">
                <label className="form-label">{t('automation.platformLabel')}</label>
                <select className="form-select" value={hashForm.platform} onChange={e => setHashForm({ ...hashForm, platform: e.target.value as any })}>
                  <option value="instagram">📷 {t('common.instagram')}</option>
                  <option value="youtube">▶️ {t('common.youtube')}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('automation.hashtagNicheLabel')}</label>
                <select className="form-select" value={hashForm.niche} onChange={e => setHashForm({ ...hashForm, niche: e.target.value as Niche })}>
                  {['tech','fitness','food','fashion','education','gaming','travel','finance','default'].map(n => (
                    <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? `⏳ ${t('automation.generatingBtn')}` : `🏷️ ${t('automation.generateHashtagsBtn')}`}
              </button>
            </form>
          </div>

          <div>
            {hashtags ? (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.95rem', margin: 0 }}>🏷️ {t('automation.hashtagResults')}</h3>
                  <button className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem' }}
                    onClick={() => { navigator.clipboard.writeText(hashtags.map(h => h.tag).join(' ')); }}>
                    📋 {t('automation.copyAll')}
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {hashtags.map(h => (
                    <span key={h.tag} onClick={() => navigator.clipboard.writeText(h.tag)}
                      style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6', padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(59,130,246,0.25)' }}>
                      {h.tag}
                    </span>
                  ))}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.4rem', textAlign: 'left' }}>Hashtag</th>
                      <th style={{ padding: '0.4rem', textAlign: 'left' }}>{t('automation.volume')}</th>
                      <th style={{ padding: '0.4rem', textAlign: 'left' }}>{t('automation.competition')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hashtags.map(h => (
                      <tr key={h.tag} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.4rem', color: '#3b82f6', fontWeight: 600 }}>{h.tag}</td>
                        <td style={{ padding: '0.4rem' }}>{h.volume}</td>
                        <td style={{ padding: '0.4rem', color: competitionColor(h.competition), fontWeight: 600 }}>{h.competition}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏷️</div>
                <p>{t('automation.fillHashtags')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* A/B Test */}
      {activeTab === 'abtest' && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <div className="card">
            <form onSubmit={handleABTest}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>{t('automation.abTab')}</h3>
              <div className="form-group">
                <label className="form-label">{t('automation.platformLabel')}</label>
                <select className="form-select" value={abForm.platform} onChange={e => setAbForm({ ...abForm, platform: e.target.value })}>
                  <option value="youtube">▶️ {t('common.youtube')}</option>
                  <option value="instagram">📷 {t('common.instagram')}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">🅰️ {t('automation.titleA')} *</label>
                <input className="form-input" value={abForm.titleA} onChange={e => setAbForm({ ...abForm, titleA: e.target.value })}
                  placeholder={t('automation.titleAPlaceholder')} required />
              </div>
              <div className="form-group">
                <label className="form-label">🅱️ {t('automation.titleB')} *</label>
                <input className="form-input" value={abForm.titleB} onChange={e => setAbForm({ ...abForm, titleB: e.target.value })}
                  placeholder={t('automation.titleBPlaceholder')} required />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? `⏳ ${t('automation.testingBtn')}` : `🔬 ${t('automation.testTitlesBtn')}`}
              </button>
            </form>
          </div>

          {abResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem 1.25rem', borderRadius: '10px', backgroundColor: 'rgba(59,130,246,0.1)', border: '2px solid #3b82f6' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>🏆 {t('automation.winner')}: Variant {abResult.winner}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.25rem' }}>{abResult.recommendation}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { label: 'Variant A', data: abResult.variantA, isWinner: abResult.winner === 'A' },
                  { label: 'Variant B', data: abResult.variantB, isWinner: abResult.winner === 'B' },
                ].map(({ label, data, isWinner }) => (
                  <div key={label} className="card" style={{ border: isWinner ? '2px solid #10b981' : '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 700 }}>{label}</span>
                      {isWinner && <span style={{ backgroundColor: '#10b981', color: '#fff', fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '3px', fontWeight: 700 }}>WINNER</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', wordBreak: 'break-word' }}>
                      "{data.title}"
                    </div>
                    {[
                      { label: t('automation.predictedCTR'), value: data.ctrScore },
                      { label: t('automation.clickability'), value: data.clickability },
                      { label: t('automation.curiosityGap'), value: data.curiosityGap },
                    ].map(({ label: l, value: v }) => (
                      <div key={l} style={{ marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                          <span>{l}</span><span style={{ fontWeight: 700 }}>{v}/100</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${v}%`, height: '100%', backgroundColor: isWinner ? '#10b981' : '#3b82f6', borderRadius: '3px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>💡 {t('contentShield.recommendations')}</h3>
                {abResult.tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.82rem', alignItems: 'flex-start' }}>
                    <span>✅</span><span style={{ color: 'var(--text-secondary)' }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔬</div>
              <p>{t('automation.fillTitles')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutomationCenter;
