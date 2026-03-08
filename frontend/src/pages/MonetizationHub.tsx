import React, { useState } from 'react';
import { useI18n } from '../i18n';

type Platform = 'youtube' | 'instagram';
type Niche = 'tech' | 'fitness' | 'food' | 'fashion' | 'education' | 'gaming' | 'travel' | 'finance' | 'beauty' | 'default';

const NICHE_CPM: Record<Niche, { cpm: number; rpm: number; label: string }> = {
  tech: { cpm: 12.5, rpm: 8.2, label: '💻 Tech & Gadgets' },
  finance: { cpm: 18.0, rpm: 12.5, label: '💰 Finance & Investing' },
  education: { cpm: 9.5, rpm: 6.8, label: '🎓 Education' },
  fitness: { cpm: 10.0, rpm: 7.0, label: '💪 Fitness & Health' },
  food: { cpm: 8.5, rpm: 5.5, label: '🍳 Food & Cooking' },
  gaming: { cpm: 7.5, rpm: 4.2, label: '🎮 Gaming' },
  travel: { cpm: 11.0, rpm: 7.8, label: '✈️ Travel' },
  fashion: { cpm: 9.0, rpm: 6.2, label: '👗 Fashion & Beauty' },
  beauty: { cpm: 9.8, rpm: 6.5, label: '💄 Beauty' },
  default: { cpm: 8.0, rpm: 5.0, label: '🌐 General' },
};

const BRAND_MATCHES: Record<string, { brand: string; industry: string; rate: number; fit: number }[]> = {
  tech: [
    { brand: 'OnePlus India', industry: 'Electronics', rate: 50000, fit: 94 },
    { brand: 'Skill Academy', industry: 'EdTech', rate: 35000, fit: 88 },
    { brand: 'HostGator India', industry: 'Web Hosting', rate: 25000, fit: 82 },
  ],
  fitness: [
    { brand: 'HealthKart', industry: 'Supplements', rate: 40000, fit: 95 },
    { brand: 'cult.fit', industry: 'Fitness', rate: 60000, fit: 91 },
    { brand: 'Decathlon', industry: 'Sports', rate: 30000, fit: 85 },
  ],
  finance: [
    { brand: 'Zerodha', industry: 'Stock Broking', rate: 75000, fit: 96 },
    { brand: 'INDmoney', industry: 'Investments', rate: 55000, fit: 90 },
    { brand: 'CRED', industry: 'FinTech', rate: 80000, fit: 88 },
  ],
  default: [
    { brand: 'Amazon India', industry: 'E-commerce', rate: 20000, fit: 75 },
    { brand: 'Meesho', industry: 'Social Commerce', rate: 15000, fit: 70 },
    { brand: 'PhonePe', industry: 'FinTech', rate: 25000, fit: 68 },
  ],
};

function calculate(followers: number, views: number, engagement: number, niche: Niche, platform: Platform) {
  const nicheData = NICHE_CPM[niche] || NICHE_CPM.default;
  const monthlyViews = views * 30;
  const adRevenue = platform === 'youtube'
    ? Math.round((monthlyViews / 1000) * nicheData.rpm)
    : Math.round(followers * engagement * 0.8);
  const sponsorRevenue = Math.round(followers * 0.005 * engagement * 1000 * (platform === 'youtube' ? 1.2 : 0.9));
  const affiliateRevenue = Math.round(adRevenue * 0.3);
  const total = adRevenue + sponsorRevenue + affiliateRevenue;

  const brands = BRAND_MATCHES[niche] || BRAND_MATCHES.default;
  const scaledBrands = brands.map(b => ({ ...b, rate: Math.round(b.rate * (followers / 10000)) }));

  return {
    monthly: { low: Math.round(total * 0.7), high: Math.round(total * 1.4) },
    yearly: { low: Math.round(total * 0.7 * 12), high: Math.round(total * 1.4 * 12) },
    breakdown: [
      { labelKey: 'monetization.adRevenue', amount: adRevenue, pct: Math.round((adRevenue / total) * 100) },
      { labelKey: 'monetization.sponsorships', amount: sponsorRevenue, pct: Math.round((sponsorRevenue / total) * 100) },
      { labelKey: 'monetization.affiliate', amount: affiliateRevenue, pct: Math.round((affiliateRevenue / total) * 100) },
    ],
    cpm: nicheData.cpm,
    rpm: nicheData.rpm,
    brands: scaledBrands,
    sponsoredRate: Math.round(followers * 0.01 * (1 + engagement * 10)),
  };
}

const MonetizationHub: React.FC = () => {
  const { t } = useI18n();
  const [form, setForm] = useState({
    platform: 'youtube' as Platform,
    niche: 'tech' as Niche,
    followers: 50000,
    avgViews: 10000,
    engagement: 4.5,
  });
  const [report, setReport] = useState<ReturnType<typeof calculate> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setReport(calculate(form.followers, form.avgViews, form.engagement / 100, form.niche, form.platform));
    setLoading(false);
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>💰 {t('monetization.title')}</h2>
        <p className="page-subtitle">{t('monetization.subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Input Card */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>{t('monetization.channelStats')}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('monetization.platformLabel')}</label>
              <select className="form-select" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value as Platform })}>
                <option value="youtube">▶️ {t('common.youtube')}</option>
                <option value="instagram">📷 {t('common.instagram')}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('monetization.nicheLabel')}</label>
              <select className="form-select" value={form.niche} onChange={e => setForm({ ...form, niche: e.target.value as Niche })}>
                {Object.entries(NICHE_CPM).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('monetization.followersLabel')}</label>
              <input type="number" className="form-input" value={form.followers}
                onChange={e => setForm({ ...form, followers: parseInt(e.target.value) || 0 })} min={0} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('monetization.avgViewsLabel')}</label>
              <input type="number" className="form-input" value={form.avgViews}
                onChange={e => setForm({ ...form, avgViews: parseInt(e.target.value) || 0 })} min={0} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('monetization.engagementLabel')}</label>
              <input type="number" className="form-input" value={form.engagement} step={0.1}
                onChange={e => setForm({ ...form, engagement: parseFloat(e.target.value) || 0 })} min={0} max={100} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? `⏳ ${t('monetization.calculatingBtn')}` : `💰 ${t('monetization.calculateBtn')}`}
            </button>
          </form>
        </div>

        {/* Results */}
        {report ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Revenue Summary */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>📊 {t('monetization.monthlyEstimate')}</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value" style={{ color: '#10b981' }}>{fmt(report.monthly.low)}</div>
                  <div className="stat-label">{t('monetization.conservative')}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: '#3b82f6' }}>{fmt(report.monthly.high)}</div>
                  <div className="stat-label">{t('monetization.optimistic')}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">₹{report.cpm}</div>
                  <div className="stat-label">{t('monetization.cpmRate')}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{fmt(report.sponsoredRate)}</div>
                  <div className="stat-label">{t('monetization.perSponsored')}</div>
                </div>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>🥧 {t('monetization.revenueSources')}</h3>
              {report.breakdown.map(item => (
                <div key={item.labelKey} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    <span>{t(item.labelKey)}</span>
                    <span style={{ fontWeight: 600 }}>{fmt(item.amount)} ({item.pct}%)</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${item.pct}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Brand Matches */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>🤝 {t('monetization.brandMatches')}</h3>
              {report.brands.map(b => (
                <div key={b.brand} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.brand}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{b.industry}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#10b981' }}>{fmt(b.rate)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('monetization.match')}: {b.fit}%</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Yearly Projection */}
            <div className="card" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 100%)', border: '1px solid #3b82f6' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#93c5fd' }}>📈 {t('monetization.yearlyProjection')}</h3>
              <p style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{t('monetization.yearlyDesc')}</p>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{fmt(report.yearly.low)}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{t('monetization.conservative')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>{fmt(report.yearly.high)}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{t('monetization.optimistic')}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
            <p>{t('monetization.enterStats')}</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.6 }}>{t('monetization.enterStatsSub')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonetizationHub;
