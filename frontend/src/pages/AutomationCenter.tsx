import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { generateSchedule, generateHashtags, runABTest, clearAutomationResult } from '../store/slices/automationSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';

type TabType = 'schedule' | 'hashtag' | 'abtest';

const AutomationCenter: React.FC = () => {
  const dispatch = useAppDispatch();
  const { result, loading, error } = useAppSelector((state) => state.automation);

  const [activeTab, setActiveTab] = useState<TabType>('schedule');

  // Smart Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    platform: 'youtube' as 'youtube' | 'instagram' | 'twitter' | 'linkedin',
    contentType: '',
    niche: '',
  });

  // Hashtag Generator form state
  const [hashtagForm, setHashtagForm] = useState({
    topic: '',
    platform: 'instagram' as 'youtube' | 'instagram' | 'twitter' | 'linkedin',
    niche: '',
    count: '20',
  });

  // A/B Testing form state
  const [abTestForm, setAbTestForm] = useState({
    platform: 'youtube' as 'youtube' | 'instagram' | 'twitter' | 'linkedin',
    variantATitle: '',
    variantADescription: '',
    variantBTitle: '',
    variantBDescription: '',
  });

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.title.trim() || !scheduleForm.niche.trim()) return;
    dispatch(generateSchedule({
      title: scheduleForm.title,
      platform: scheduleForm.platform,
      contentType: scheduleForm.contentType || undefined,
      niche: scheduleForm.niche,
    }));
  };

  const handleHashtagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hashtagForm.topic.trim()) return;
    dispatch(generateHashtags({
      topic: hashtagForm.topic,
      platform: hashtagForm.platform,
      niche: hashtagForm.niche || undefined,
      count: parseInt(hashtagForm.count, 10),
    }));
  };

  const handleABTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!abTestForm.variantATitle.trim() || !abTestForm.variantBTitle.trim()) return;
    dispatch(runABTest({
      platform: abTestForm.platform,
      variantA: {
        title: abTestForm.variantATitle,
        description: abTestForm.variantADescription || undefined,
      },
      variantB: {
        title: abTestForm.variantBTitle,
        description: abTestForm.variantBDescription || undefined,
      },
    }));
  };

  const handleClear = () => {
    setScheduleForm({ title: '', platform: 'youtube', contentType: '', niche: '' });
    setHashtagForm({ topic: '', platform: 'instagram', niche: '', count: '20' });
    setAbTestForm({ platform: 'youtube', variantATitle: '', variantADescription: '', variantBTitle: '', variantBDescription: '' });
    dispatch(clearAutomationResult());
  };

  const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setScheduleForm({ ...scheduleForm, [e.target.name]: e.target.value });
  };

  const handleHashtagChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setHashtagForm({ ...hashtagForm, [e.target.name]: e.target.value });
  };

  const handleABTestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setAbTestForm({ ...abTestForm, [e.target.name]: e.target.value });
  };

  const popularityColor = (popularity: string) => {
    switch (popularity?.toLowerCase()) {
      case 'high': return '#2ecc71';
      case 'medium': return '#f39c12';
      case 'low': return '#e74c3c';
      default: return '#3498db';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Automation Center</h2>
        <p className="page-subtitle">
          Smart scheduling, hashtag generation, and A/B testing for your content
        </p>
      </div>

      {/* Tab Selector */}
      <div className="form-row" style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={activeTab === 'schedule' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('schedule')}
        >
          Smart Schedule
        </button>
        <button
          type="button"
          className={activeTab === 'hashtag' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('hashtag')}
        >
          Hashtag Generator
        </button>
        <button
          type="button"
          className={activeTab === 'abtest' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('abtest')}
        >
          A/B Testing
        </button>
      </div>

      {/* Smart Schedule Form */}
      {activeTab === 'schedule' && (
        <form onSubmit={handleScheduleSubmit} className="predictor-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sched-title">Content Title *</label>
              <input
                id="sched-title"
                name="title"
                value={scheduleForm.title}
                onChange={handleScheduleChange}
                required
                placeholder="Enter your content title"
              />
            </div>
            <div className="form-group">
              <label htmlFor="sched-platform">Platform *</label>
              <select id="sched-platform" name="platform" value={scheduleForm.platform} onChange={handleScheduleChange}>
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sched-type">Content Type</label>
              <input
                id="sched-type"
                name="contentType"
                value={scheduleForm.contentType}
                onChange={handleScheduleChange}
                placeholder="e.g., video, reel, post"
              />
            </div>
            <div className="form-group">
              <label htmlFor="sched-niche">Niche *</label>
              <input
                id="sched-niche"
                name="niche"
                value={scheduleForm.niche}
                onChange={handleScheduleChange}
                required
                placeholder="e.g., tech, fitness"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading || !scheduleForm.title.trim() || !scheduleForm.niche.trim()}>
              {loading ? 'Generating...' : 'Generate Schedule'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleClear}>
              Clear
            </button>
          </div>
        </form>
      )}

      {/* Hashtag Generator Form */}
      {activeTab === 'hashtag' && (
        <form onSubmit={handleHashtagSubmit} className="predictor-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="hash-topic">Topic *</label>
              <input
                id="hash-topic"
                name="topic"
                value={hashtagForm.topic}
                onChange={handleHashtagChange}
                required
                placeholder="Enter topic for hashtag generation"
              />
            </div>
            <div className="form-group">
              <label htmlFor="hash-platform">Platform *</label>
              <select id="hash-platform" name="platform" value={hashtagForm.platform} onChange={handleHashtagChange}>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="twitter">Twitter</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="hash-niche">Niche</label>
              <input
                id="hash-niche"
                name="niche"
                value={hashtagForm.niche}
                onChange={handleHashtagChange}
                placeholder="e.g., photography, food"
              />
            </div>
            <div className="form-group">
              <label htmlFor="hash-count">Count</label>
              <input
                id="hash-count"
                name="count"
                type="number"
                min="1"
                max="50"
                value={hashtagForm.count}
                onChange={handleHashtagChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading || !hashtagForm.topic.trim()}>
              {loading ? 'Generating...' : 'Generate Hashtags'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleClear}>
              Clear
            </button>
          </div>
        </form>
      )}

      {/* A/B Testing Form */}
      {activeTab === 'abtest' && (
        <form onSubmit={handleABTestSubmit} className="predictor-form">
          <div className="form-group">
            <label htmlFor="ab-platform">Platform *</label>
            <select id="ab-platform" name="platform" value={abTestForm.platform} onChange={handleABTestChange}>
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Variant A</h4>
              <div className="form-group">
                <label htmlFor="ab-va-title">Title *</label>
                <input
                  id="ab-va-title"
                  name="variantATitle"
                  value={abTestForm.variantATitle}
                  onChange={handleABTestChange}
                  required
                  placeholder="Variant A title"
                />
              </div>
              <div className="form-group">
                <label htmlFor="ab-va-desc">Description</label>
                <textarea
                  id="ab-va-desc"
                  name="variantADescription"
                  value={abTestForm.variantADescription}
                  onChange={handleABTestChange}
                  rows={3}
                  placeholder="Variant A description"
                />
              </div>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Variant B</h4>
              <div className="form-group">
                <label htmlFor="ab-vb-title">Title *</label>
                <input
                  id="ab-vb-title"
                  name="variantBTitle"
                  value={abTestForm.variantBTitle}
                  onChange={handleABTestChange}
                  required
                  placeholder="Variant B title"
                />
              </div>
              <div className="form-group">
                <label htmlFor="ab-vb-desc">Description</label>
                <textarea
                  id="ab-vb-desc"
                  name="variantBDescription"
                  value={abTestForm.variantBDescription}
                  onChange={handleABTestChange}
                  rows={3}
                  placeholder="Variant B description"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading || !abTestForm.variantATitle.trim() || !abTestForm.variantBTitle.trim()}>
              {loading ? 'Testing...' : 'Run A/B Test'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleClear}>
              Clear
            </button>
          </div>
        </form>
      )}

      {loading && (
        <LoadingSpinner message={
          activeTab === 'schedule' ? 'Generating smart schedule...' :
          activeTab === 'hashtag' ? 'Generating hashtags...' :
          'Running A/B test...'
        } />
      )}
      {error && <div className="error-banner">{error}</div>}

      {/* Schedule Results */}
      {result && activeTab === 'schedule' && result.bestTimes && (
        <div className="module-section">
          {/* Best Times */}
          <div className="module-section">
            <h3>Best Posting Times</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Expected Engagement</th>
                  <th>Audience Activity</th>
                </tr>
              </thead>
              <tbody>
                {result.bestTimes.map((slot: any, idx: number) => (
                  <tr key={idx}>
                    <td><strong>{slot.day}</strong></td>
                    <td>{slot.time}</td>
                    <td>{slot.expectedEngagement || slot.engagement || '-'}</td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: slot.activityLevel === 'high' ? '#2ecc71' : slot.activityLevel === 'medium' ? '#f39c12' : '#95a5a6'
                      }}>
                        {slot.activityLevel || 'normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Weekly Plan */}
          {result.weeklyPlan && result.weeklyPlan.length > 0 && (
            <div className="module-section">
              <h3>Weekly Plan</h3>
              <div className="results-grid">
                {result.weeklyPlan.map((day: any, idx: number) => (
                  <div key={idx} className="result-card">
                    <strong>{day.day || day.date}</strong>
                    <div className="result-detail" style={{ marginTop: '0.25rem' }}>{day.content || day.task || day.description}</div>
                    {day.time && <div className="result-detail">Time: {day.time}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {result.tips && result.tips.length > 0 && (
            <div className="module-section">
              <h3>Scheduling Tips</h3>
              <div className="results-grid">
                {result.tips.map((tip: string, idx: number) => (
                  <div key={idx} className="result-card">
                    <div className="result-detail">{tip}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hashtag Results */}
      {result && activeTab === 'hashtag' && result.hashtags && (
        <div className="module-section">
          <div className="module-section">
            <h3>Generated Hashtags ({result.hashtags.length})</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {result.hashtags.map((tag: any, idx: number) => (
                <div key={idx} className="result-card" style={{ display: 'inline-flex', flexDirection: 'column', minWidth: 'auto', padding: '0.75rem 1rem' }}>
                  <strong style={{ fontSize: '1rem' }}>{typeof tag === 'string' ? tag : tag.tag || tag.hashtag}</strong>
                  {typeof tag !== 'string' && (
                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {tag.category && <span className="badge badge-info">{tag.category}</span>}
                      {tag.popularity && (
                        <span className="badge" style={{ backgroundColor: popularityColor(tag.popularity) }}>
                          {tag.popularity}
                        </span>
                      )}
                      {tag.recommended && <span className="badge" style={{ backgroundColor: '#2ecc71' }}>recommended</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Strategy Info */}
          {result.strategy && (
            <div className="module-section">
              <h3>Hashtag Strategy</h3>
              <div className="result-card">
                <div className="result-detail" style={{ whiteSpace: 'pre-wrap' }}>
                  {typeof result.strategy === 'string' ? result.strategy : result.strategy.description || JSON.stringify(result.strategy, null, 2)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* A/B Test Results */}
      {result && activeTab === 'abtest' && result.variantA && result.variantB && (
        <div className="module-section">
          <div className="module-section">
            <h3>A/B Test Comparison</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Variant A</th>
                  <th>Variant B</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Overall Score</strong></td>
                  <td style={{ color: result.variantA.score >= result.variantB.score ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}>
                    {result.variantA.score}
                  </td>
                  <td style={{ color: result.variantB.score >= result.variantA.score ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}>
                    {result.variantB.score}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="form-row">
            <div className="module-section" style={{ flex: 1 }}>
              <h3>Variant A</h3>
              {result.variantA.strengths && result.variantA.strengths.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <h4 style={{ color: '#2ecc71', marginBottom: '0.5rem' }}>Strengths</h4>
                  {result.variantA.strengths.map((s: string, idx: number) => (
                    <div key={idx} className="result-detail" style={{ marginBottom: '0.25rem' }}>+ {s}</div>
                  ))}
                </div>
              )}
              {result.variantA.weaknesses && result.variantA.weaknesses.length > 0 && (
                <div>
                  <h4 style={{ color: '#e74c3c', marginBottom: '0.5rem' }}>Weaknesses</h4>
                  {result.variantA.weaknesses.map((w: string, idx: number) => (
                    <div key={idx} className="result-detail" style={{ marginBottom: '0.25rem' }}>- {w}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="module-section" style={{ flex: 1 }}>
              <h3>Variant B</h3>
              {result.variantB.strengths && result.variantB.strengths.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <h4 style={{ color: '#2ecc71', marginBottom: '0.5rem' }}>Strengths</h4>
                  {result.variantB.strengths.map((s: string, idx: number) => (
                    <div key={idx} className="result-detail" style={{ marginBottom: '0.25rem' }}>+ {s}</div>
                  ))}
                </div>
              )}
              {result.variantB.weaknesses && result.variantB.weaknesses.length > 0 && (
                <div>
                  <h4 style={{ color: '#e74c3c', marginBottom: '0.5rem' }}>Weaknesses</h4>
                  {result.variantB.weaknesses.map((w: string, idx: number) => (
                    <div key={idx} className="result-detail" style={{ marginBottom: '0.25rem' }}>- {w}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Winner */}
          {result.winner && (
            <div className="module-section">
              <h3>Winner</h3>
              <div className="result-card" style={{ textAlign: 'center' }}>
                <div className="result-value" style={{ fontSize: '1.5rem', color: '#2ecc71' }}>
                  {result.winner}
                </div>
                {result.confidence !== undefined && (
                  <div className="result-detail">
                    Confidence: {typeof result.confidence === 'number' ? `${(result.confidence * 100).toFixed(0)}%` : result.confidence}
                  </div>
                )}
                {result.reasoning && (
                  <div className="result-detail" style={{ marginTop: '0.5rem' }}>{result.reasoning}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutomationCenter;
