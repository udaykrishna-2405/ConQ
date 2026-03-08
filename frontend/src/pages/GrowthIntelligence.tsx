import React, { useState } from 'react';
import { useI18n } from '../i18n';

type Platform = 'youtube' | 'instagram';
type Niche = 'tech' | 'fitness' | 'food' | 'fashion' | 'education' | 'gaming' | 'travel' | 'finance' | 'default';
type ActiveTab = 'forecast' | 'benchmark';

const NICHE_DATA: Record<Niche, { avgGrowth: number; avgEngagement: number; avgPosts: number }> = {
  tech: { avgGrowth: 0.08, avgEngagement: 0.045, avgPosts: 4 },
  fitness: { avgGrowth: 0.10, avgEngagement: 0.055, avgPosts: 5 },
  food: { avgGrowth: 0.09, avgEngagement: 0.06, avgPosts: 5 },
  fashion: { avgGrowth: 0.12, avgEngagement: 0.05, avgPosts: 6 },
  education: { avgGrowth: 0.06, avgEngagement: 0.04, avgPosts: 3 },
  gaming: { avgGrowth: 0.15, avgEngagement: 0.035, avgPosts: 5 },
  travel: { avgGrowth: 0.07, avgEngagement: 0.05, avgPosts: 3 },
  finance: { avgGrowth: 0.09, avgEngagement: 0.038, avgPosts: 4 },
  default: { avgGrowth: 0.07, avgEngagement: 0.042, avgPosts: 4 },
};

function computeForecast(followers: number, engagement: number, postsPerWeek: number, niche: Niche, months: number) {
  const bench = NICHE_DATA[niche] || NICHE_DATA.default;
  const contentMult = Math.min(2, postsPerWeek / bench.avgPosts);
  const engageMult = (engagement / 100) / bench.avgEngagement;
  const growthRate = bench.avgGrowth * contentMult * Math.max(0.5, engageMult);
  const points = Array.from({ length: months }, (_, i) => {
    const m = i + 1;
    const decay = 1 - m * 0.004;
    const monthlyGrowth = growthRate * decay;
    const projected = Math.round(followers * Math.pow(1 + monthlyGrowth, m));
    const date = new Date();
    date.setMonth(date.getMonth() + m);
    return {
      month: date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      projected,
      engagementRate: Math.max(1.5, engagement - m * 0.05),
      confidence: Math.max(50, 95 - m * 5),
    };
  });
  const topActions = [
    `Post ${Math.max(postsPerWeek, bench.avgPosts + 1)} times/week (niche avg: ${bench.avgPosts})`,
    'Reply to all comments in the first hour of posting',
    'Use trending sounds/hashtags relevant to your niche',
    'Collaborate with 2-3 creators in your niche this month',
    'Create a content series to boost return viewers',
  ];
  return { points, growthRate: Math.round(growthRate * 100), topActions };
}

function computeBenchmark(followers: number, engagement: number, niche: Niche) {
  const bench = NICHE_DATA[niche] || NICHE_DATA.default;
  const benchFollowers = 75000;
  const you_engagement = engagement / 100;
  const pct = Math.min(99, Math.max(1, Math.round(
    (followers / benchFollowers) * 30 + (you_engagement / bench.avgEngagement) * 40 + 30
  )));
  const gaps = [];
  if (followers < benchFollowers) gaps.push({ metric: 'Followers', yours: followers, avg: benchFollowers, gap: `${Math.round((benchFollowers - followers) / benchFollowers * 100)}% below avg` });
  if (you_engagement < bench.avgEngagement) gaps.push({ metric: 'Engagement Rate', yours: `${engagement}%`, avg: `${(bench.avgEngagement * 100).toFixed(1)}%`, gap: 'Below average' });
  return { pct, benchFollowers, benchEngagement: bench.avgEngagement * 100, gaps };
}

const GrowthIntelligence: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<ActiveTab>('forecast');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    platform: 'youtube' as Platform,
    niche: 'tech' as Niche,
    followers: 10000,
    engagement: 4.2,
    postsPerWeek: 3,
    months: 6,
  });
  const [forecast, setForecast] = useState<ReturnType<typeof computeForecast> | null>(null);
  const [benchmark, setBenchmark] = useState<ReturnType<typeof computeBenchmark> | null>(null);

  const handleForecast = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setForecast(computeForecast(form.followers, form.engagement, form.postsPerWeek, form.niche, form.months));
    setLoading(false);
  };

  const handleBenchmark = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setBenchmark(computeBenchmark(form.followers, form.engagement, form.niche));
    setLoading(false);
  };

  const handleSubmit = activeTab === 'forecast' ? handleForecast : handleBenchmark;
  const maxProjected = forecast ? Math.max(...forecast.points.map(p => p.projected)) : 1;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>📈 {t('growth.title')}</h2>
        <p className="page-subtitle">{t('growth.subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button type="button"
                className={activeTab === 'forecast' ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
                onClick={() => setActiveTab('forecast')}>
                📈 {t('growth.forecastTab')}
              </button>
              <button type="button"
                className={activeTab === 'benchmark' ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
                onClick={() => setActiveTab('benchmark')}>
                🏆 {t('growth.benchmarkTab')}
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t('growth.platformLabel')}</label>
                <select className="form-select" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value as Platform })}>
                  <option value="youtube">▶️ {t('common.youtube')}</option>
                  <option value="instagram">📷 {t('common.instagram')}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('growth.nicheLabel')}</label>
                <select className="form-select" value={form.niche} onChange={e => setForm({ ...form, niche: e.target.value as Niche })}>
                  {['tech','fitness','food','fashion','education','gaming','travel','finance','default'].map(n => (
                    <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('growth.currentFollowers')}</label>
                <input type="number" className="form-input" value={form.followers}
                  onChange={e => setForm({ ...form, followers: parseInt(e.target.value) || 0 })} min={0} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('monetization.engagementLabel')}</label>
                <input type="number" className="form-input" value={form.engagement} step={0.1}
                  onChange={e => setForm({ ...form, engagement: parseFloat(e.target.value) || 0 })} min={0} max={100} />
              </div>
              {activeTab === 'forecast' && (
                <>
                  <div className="form-group">
                    <label className="form-label">{t('growth.contentFreqLabel')}</label>
                    <input type="number" className="form-input" value={form.postsPerWeek}
                      onChange={e => setForm({ ...form, postsPerWeek: parseInt(e.target.value) || 1 })} min={1} max={21} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('growth.growthRateLabel')}</label>
                    <select className="form-select" value={form.months} onChange={e => setForm({ ...form, months: parseInt(e.target.value) })}>
                      <option value={3}>3</option>
                      <option value={6}>6</option>
                      <option value={12}>12</option>
                    </select>
                  </div>
                </>
              )}
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? `⏳ ${t('common.analyzing')}` : activeTab === 'forecast' ? `📈 ${t('growth.forecastBtn')}` : `🏆 ${t('growth.benchmarkBtn')}`}
              </button>
            </form>
          </div>
        </div>

        <div>
          {activeTab === 'forecast' && forecast && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card">
                <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>📊 {t('growth.forecastTitle')}</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '160px', padding: '0 0.5rem' }}>
                  {forecast.points.map((p, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginBottom: '3px', textAlign: 'center' }}>
                        {(p.projected / 1000).toFixed(1)}K
                      </div>
                      <div style={{ width: '100%', height: `${(p.projected / maxProjected) * 120}px`, backgroundColor: '#3b82f6', borderRadius: '4px 4px 0 0', opacity: 0.7 + i * 0.03, transition: 'height 0.4s ease' }} />
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'center' }}>{p.month}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.82rem' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>{t('growth.currentFollowers')}: <strong>{form.followers.toLocaleString()}</strong></div>
                  <div style={{ color: '#10b981' }}>+{forecast.growthRate}% {t('growth.growthRateLabel')}</div>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '0.95rem', marginBottom: '0.875rem' }}>📋 {t('growth.month')} by {t('growth.month')}</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                        {[t('growth.month'), t('growth.followers'), t('dashboard.engagementRate'), t('predict.confidence')].map(h => (
                          <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {forecast.points.map((p, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.5rem' }}>{p.month}</td>
                          <td style={{ padding: '0.5rem', fontWeight: 600, color: '#3b82f6' }}>{p.projected.toLocaleString()}</td>
                          <td style={{ padding: '0.5rem' }}>{p.engagementRate.toFixed(1)}%</td>
                          <td style={{ padding: '0.5rem', color: p.confidence > 75 ? '#10b981' : '#f59e0b' }}>{p.confidence}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card" style={{ background: 'linear-gradient(135deg, #0f2027 0%, #1e3a5f 100%)', border: '1px solid #3b82f6' }}>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '0.875rem', color: '#93c5fd' }}>🚀 {t('scorecard.growthRoadmap')}</h3>
                {forecast.topActions.map((action, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.6rem', alignItems: 'flex-start' }}>
                    <span style={{ backgroundColor: '#3b82f6', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ color: '#e2e8f0', fontSize: '0.82rem', lineHeight: 1.5 }}>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'benchmark' && benchmark && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '4rem', fontWeight: 800, color: benchmark.pct >= 60 ? '#10b981' : benchmark.pct >= 40 ? '#f59e0b' : '#ef4444' }}>
                  {benchmark.pct}th
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.25rem' }}>{t('growth.percentile')}</div>
                <div style={{ height: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', marginTop: '1rem', overflow: 'hidden' }}>
                  <div style={{ width: `${benchmark.pct}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '6px', transition: 'width 0.7s ease' }} />
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '0.95rem', marginBottom: '0.875rem' }}>📊 {t('growth.yourStats')} vs {t('growth.nicheAvg')}</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{form.followers.toLocaleString()}</div>
                    <div className="stat-label">{t('growth.yourStats')} {t('common.followers')}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{benchmark.benchFollowers.toLocaleString()}</div>
                    <div className="stat-label">{t('growth.nicheAvg')}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{form.engagement}%</div>
                    <div className="stat-label">{t('growth.yourStats')} {t('dashboard.engagementRate')}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{benchmark.benchEngagement.toFixed(1)}%</div>
                    <div className="stat-label">{t('growth.nicheAvg')} {t('dashboard.engagementRate')}</div>
                  </div>
                </div>
              </div>

              {benchmark.gaps.length === 0 && (
                <div className="card" style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '0.5rem' }}>✅ {t('growth.aboveAvg')}!</div>
                </div>
              )}
            </div>
          )}

          {!forecast && !benchmark && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
              <p>{t('growth.fillForecast')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrowthIntelligence;
