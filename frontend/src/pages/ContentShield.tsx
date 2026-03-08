import React, { useState } from 'react';
import { useI18n } from '../i18n';

const OFFENSIVE_WORDS = ['hate', 'violence', 'abuse', 'offensive', 'racist', 'sexist', 'kill', 'attack', 'discriminate', 'harassment', 'toxic'];
const SPAM_WORDS = ['guaranteed', 'click here', 'free money', 'get rich quick', 'miracle', 'limited time', 'act now', 'winner'];
const COPYRIGHT_TRIGGERS = ['song', 'music', 'movie', 'cover', 'tribute', 'reaction', 'clip', 'footage'];
const POLICY_TRIGGERS = ['giveaway', 'contest', 'sponsor', 'paid', 'affiliate', 'ad', 'promotion', 'subliminal'];

function analyzeContent(text: string, platform: string) {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  const wordCount = words.length;

  const flaggedOffensive = OFFENSIVE_WORDS.filter(w => lower.includes(w));
  const flaggedSpam = SPAM_WORDS.filter(w => lower.includes(w));
  const flaggedCopyright = COPYRIGHT_TRIGGERS.filter(w => lower.includes(w));
  const flaggedPolicy = POLICY_TRIGGERS.filter(w => lower.includes(w));

  const exclamationCount = (text.match(/!/g) || []).length;
  const capsRatio = (text.replace(/[^A-Z]/g, '').length) / Math.max(text.replace(/[^a-zA-Z]/g, '').length, 1);
  const urlCount = (text.match(/http|www\./g) || []).length;

  let safetyPenalty = flaggedOffensive.length * 15 + flaggedSpam.length * 8;
  const safetyScore = Math.max(0, Math.min(100, 100 - safetyPenalty));
  const copyrightScore = Math.max(0, Math.min(100, 100 - flaggedCopyright.length * 20));
  const brandSafetyScore = Math.max(0, Math.min(100, 100 - flaggedPolicy.length * 10 - (capsRatio > 0.3 ? 15 : 0) - exclamationCount * 2));
  const spamScore = Math.max(0, Math.min(100, 100 - flaggedSpam.length * 12 - urlCount * 5 - (capsRatio > 0.4 ? 20 : 0)));

  const overallRisk = Math.round(100 - (safetyScore + copyrightScore + brandSafetyScore + spamScore) / 4);
  const riskLevel = overallRisk > 60 ? 'high' : overallRisk > 30 ? 'medium' : 'low';

  const suggestions: string[] = [];
  if (flaggedOffensive.length > 0) suggestions.push(`Remove or rephrase potentially offensive language: "${flaggedOffensive.slice(0, 2).join('", "')}"`);
  if (flaggedCopyright.length > 0) suggestions.push(`Copyright risk detected. Add fair-use disclaimer or obtain proper licensing for music/video content`);
  if (capsRatio > 0.3) suggestions.push('Reduce excessive capitalization — it looks spammy and can affect reach');
  if (exclamationCount > 5) suggestions.push(`Too many exclamation marks (${exclamationCount}). Use max 2-3 for emphasis`);
  if (flaggedPolicy.length > 0) suggestions.push(`Add proper disclosure for: ${flaggedPolicy.join(', ')} — required by ${platform} and FTC guidelines`);
  if (wordCount < 20) suggestions.push('Content is very short. Add more context for better SEO and engagement');
  if (urlCount > 3) suggestions.push('Multiple URLs detected — this may trigger spam filters on some platforms');
  if (suggestions.length === 0) suggestions.push('Content looks clean! No major risks detected. Safe to publish.');

  return {
    safetyScore, copyrightScore, brandSafetyScore, spamScore, overallRisk, riskLevel,
    flaggedWords: [...flaggedOffensive, ...flaggedSpam],
    suggestions,
    wordCount,
    readabilityScore: Math.min(100, Math.max(40, 100 - Math.abs(wordCount - 150) / 5)),
    platformFit: platform === 'youtube' ? Math.min(100, wordCount * 0.8) : Math.max(0, 100 - wordCount * 0.5),
  };
}

type Platform = 'youtube' | 'instagram' | 'twitter' | 'linkedin';

const ContentShield: React.FC = () => {
  const { t } = useI18n();
  const [form, setForm] = useState({
    content: '',
    platform: 'youtube' as Platform,
    contentType: 'caption',
  });
  const [report, setReport] = useState<ReturnType<typeof analyzeContent> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setReport(analyzeContent(form.content, form.platform));
    setLoading(false);
  };

  const scoreColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444';
  const riskColor = (r: string) => r === 'low' ? '#10b981' : r === 'medium' ? '#f59e0b' : '#ef4444';
  const riskBg = (r: string) => r === 'low' ? 'rgba(16,185,129,0.1)' : r === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';

  const riskLabel = (r: string) => {
    if (r === 'low') return `✅ ${t('contentShield.safe')}`;
    if (r === 'medium') return `⚠️ ${t('contentShield.caution')}`;
    return `🚨 ${t('contentShield.risky')}`;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>🛡️ {t('contentShield.title')}</h2>
        <p className="page-subtitle">{t('contentShield.subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Input */}
        <div className="card">
          <form onSubmit={handleAnalyze}>
            <div className="form-group">
              <label className="form-label">{t('common.platform')}</label>
              <select className="form-select" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value as Platform })}>
                <option value="youtube">▶️ {t('common.youtube')}</option>
                <option value="instagram">📷 {t('common.instagram')}</option>
                <option value="twitter">🐦 Twitter / X</option>
                <option value="linkedin">💼 LinkedIn</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('contentShield.inputLabel')}</label>
              <textarea
                className="form-input"
                style={{ minHeight: '180px', resize: 'vertical', fontFamily: 'inherit' }}
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                placeholder={t('contentShield.placeholder')}
                required
              />
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {form.content.split(/\s+/).filter(Boolean).length} {t('contentShield.wordsCount')}
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? `🔍 ${t('contentShield.scanningBtn')}` : `🛡️ ${t('contentShield.scanBtn')}`}
            </button>
          </form>
        </div>

        {/* Results */}
        {report ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Risk Level Banner */}
            <div style={{
              padding: '1rem 1.25rem',
              borderRadius: '10px',
              backgroundColor: riskBg(report.riskLevel),
              border: `2px solid ${riskColor(report.riskLevel)}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{riskLabel(report.riskLevel)}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {report.overallRisk}/100 · {report.wordCount} {t('contentShield.wordsCount')}
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: riskColor(report.riskLevel) }}>
                {100 - report.overallRisk}%
              </div>
            </div>

            {/* Score Grid */}
            <div className="card">
              <h3 style={{ fontSize: '0.9rem', marginBottom: '0.875rem' }}>📊 {t('common.results')}</h3>
              {[
                { label: `🔒 ${t('contentShield.safetyScore')}`, score: report.safetyScore },
                { label: `©️ ${t('contentShield.copyrightScore')}`, score: report.copyrightScore },
                { label: `🏷️ ${t('contentShield.brandSafety')}`, score: report.brandSafetyScore },
                { label: `📵 ${t('contentShield.spamScore')}`, score: report.spamScore },
              ].map(({ label, score }) => (
                <div key={label} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                    <span>{label}</span>
                    <span style={{ fontWeight: 700, color: scoreColor(score) }}>{score}/100</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${score}%`, height: '100%', backgroundColor: scoreColor(score), borderRadius: '4px', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Flagged Words */}
            {report.flaggedWords.length > 0 && (
              <div className="card" style={{ border: '1px solid #ef4444' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: '#ef4444' }}>🚩 {t('contentShield.flaggedTerms')}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {report.flaggedWords.map(w => (
                    <span key={w} style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                      "{w}"
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            <div className="card">
              <h3 style={{ fontSize: '0.9rem', marginBottom: '0.875rem' }}>💡 {t('contentShield.recommendations')}</h3>
              {report.suggestions.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem', fontSize: '0.82rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>{report.riskLevel === 'low' && i === 0 ? '✅' : '💡'}</span>
                  <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          !loading && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
              <p>{t('contentShield.pasteContent')}</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.6 }}>{t('contentShield.pasteContentSub')}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ContentShield;
