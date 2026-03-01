import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { analyzeContentShield, clearShieldReport } from '../store/slices/contentShieldSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ContentShield: React.FC = () => {
  const dispatch = useAppDispatch();
  const { result, loading, error } = useAppSelector((state) => state.contentShield);

  const [form, setForm] = useState({
    text: '',
    platform: 'youtube' as 'youtube' | 'instagram' | 'twitter' | 'linkedin',
    checkPolicy: true,
    checkCopyright: true,
    checkBrandSafety: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.text.trim()) return;
    dispatch(analyzeContentShield({
      text: form.text,
      platform: form.platform,
      checkPolicy: form.checkPolicy,
      checkCopyright: form.checkCopyright,
      checkBrandSafety: form.checkBrandSafety,
    }));
  };

  const handleClear = () => {
    setForm({ text: '', platform: 'youtube', checkPolicy: true, checkCopyright: true, checkBrandSafety: true });
    dispatch(clearShieldReport());
  };

  const riskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return '#2ecc71';
      case 'medium': return '#f39c12';
      case 'high': return '#e74c3c';
      case 'critical': return '#c0392b';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Content Shield</h2>
        <p className="page-subtitle">
          Analyze content for policy violations, copyright risks, and brand safety issues
        </p>
      </div>

      <form onSubmit={handleSubmit} className="analyzer-form">
        <div className="form-group">
          <label htmlFor="shield-text">Content Text *</label>
          <textarea
            id="shield-text"
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            rows={6}
            placeholder="Enter or paste your content text to analyze for compliance and safety..."
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="shield-platform">Platform *</label>
            <select
              id="shield-platform"
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value as any })}
            >
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.checkPolicy}
                onChange={(e) => setForm({ ...form, checkPolicy: e.target.checked })}
              />
              Check Policy Violations
            </label>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.checkCopyright}
                onChange={(e) => setForm({ ...form, checkCopyright: e.target.checked })}
              />
              Check Copyright Risks
            </label>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.checkBrandSafety}
                onChange={(e) => setForm({ ...form, checkBrandSafety: e.target.checked })}
              />
              Check Brand Safety
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading || !form.text.trim()}>
            {loading ? 'Analyzing...' : 'Analyze Content'}
          </button>
          <button type="button" className="btn-secondary" onClick={handleClear}>
            Clear
          </button>
        </div>
      </form>

      {loading && <LoadingSpinner message="Analyzing content for risks..." />}
      {error && <div className="error-banner">{error}</div>}

      {result && (
        <div className="module-section">
          {/* Overall Risk Badge */}
          <div className="results-grid">
            <div className="result-card" style={{ textAlign: 'center' }}>
              <h3>Overall Risk Level</h3>
              <div
                className="result-value"
                style={{
                  color: riskColor(result.overallRisk),
                  fontSize: '2rem',
                  fontWeight: 'bold',
                }}
              >
                {result.overallRisk?.toUpperCase() || 'UNKNOWN'}
              </div>
              {result.score !== undefined && (
                <div className="result-detail">
                  Risk Score: <strong>{result.score}</strong> / 100
                </div>
              )}
              <div
                style={{
                  marginTop: '0.75rem',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: '#e0e0e0',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${result.score ?? 0}%`,
                    backgroundColor: riskColor(result.overallRisk),
                    borderRadius: '4px',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Policy Violations */}
          {result.policyViolations && result.policyViolations.length > 0 && (
            <div className="module-section">
              <h3>Policy Violations ({result.policyViolations.length})</h3>
              <div className="results-grid">
                {result.policyViolations.map((violation: any, idx: number) => (
                  <div key={idx} className="result-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{violation.rule || violation.type || `Violation ${idx + 1}`}</strong>
                      <span
                        className="badge"
                        style={{ backgroundColor: riskColor(violation.severity) }}
                      >
                        {violation.severity}
                      </span>
                    </div>
                    <div className="result-detail" style={{ marginTop: '0.5rem' }}>{violation.description || violation.message}</div>
                    {violation.suggestion && (
                      <div className="result-detail" style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
                        Suggestion: {violation.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Copyright Risks */}
          {result.copyrightRisks && result.copyrightRisks.length > 0 && (
            <div className="module-section">
              <h3>Copyright Risks ({result.copyrightRisks.length})</h3>
              <div className="results-grid">
                {result.copyrightRisks.map((risk: any, idx: number) => (
                  <div key={idx} className="result-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{risk.type || `Risk ${idx + 1}`}</strong>
                      <span
                        className="badge"
                        style={{ backgroundColor: riskColor(risk.severity) }}
                      >
                        {risk.severity}
                      </span>
                    </div>
                    <div className="result-detail" style={{ marginTop: '0.5rem' }}>{risk.description || risk.message}</div>
                    {risk.source && (
                      <div className="result-detail" style={{ marginTop: '0.25rem' }}>
                        Source: {risk.source}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brand Safety Issues */}
          {result.brandSafetyIssues && result.brandSafetyIssues.length > 0 && (
            <div className="module-section">
              <h3>Brand Safety Issues ({result.brandSafetyIssues.length})</h3>
              <div className="results-grid">
                {result.brandSafetyIssues.map((issue: any, idx: number) => (
                  <div key={idx} className="result-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{issue.category || issue.type || `Issue ${idx + 1}`}</strong>
                      <span
                        className="badge"
                        style={{ backgroundColor: riskColor(issue.severity) }}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <div className="result-detail" style={{ marginTop: '0.5rem' }}>{issue.description || issue.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="module-section">
              <h3>Recommendations</h3>
              <div className="results-grid">
                {result.recommendations.map((rec: string, idx: number) => (
                  <div key={idx} className="result-card">
                    <div className="result-detail">{rec}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platform Guidelines */}
          {result.platformGuidelines && (
            <div className="module-section">
              <h3>Platform Guidelines</h3>
              <div className="result-card">
                {typeof result.platformGuidelines === 'string' ? (
                  <div className="result-detail">{result.platformGuidelines}</div>
                ) : (
                  <div className="results-grid">
                    {Array.isArray(result.platformGuidelines) && result.platformGuidelines.map((guideline: any, idx: number) => (
                      <div key={idx} className="result-card">
                        <strong>{guideline.title || guideline.rule || `Guideline ${idx + 1}`}</strong>
                        <div className="result-detail" style={{ marginTop: '0.25rem' }}>{guideline.description || guideline.text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentShield;
