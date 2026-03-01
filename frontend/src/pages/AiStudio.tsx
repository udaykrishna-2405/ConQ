import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { generateContent, generateVideoAssist, clearAiStudioResult } from '../store/slices/aiStudioSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';

type TabType = 'content' | 'video';

const AiStudio: React.FC = () => {
  const dispatch = useAppDispatch();
  const { result, loading, error } = useAppSelector((state) => state.aiStudio);

  const [activeTab, setActiveTab] = useState<TabType>('content');

  // Content Generation form state
  const [contentForm, setContentForm] = useState({
    type: 'caption' as 'caption' | 'hook' | 'script_short' | 'script_long' | 'cta' | 'translation' | 'repurpose' | 'calendar',
    topic: '',
    platform: 'youtube' as 'youtube' | 'instagram' | 'twitter' | 'linkedin',
  });

  // Video Assistant form state
  const [videoForm, setVideoForm] = useState({
    type: 'idea' as string,
    contentType: '',
    platform: 'youtube' as 'youtube' | 'instagram' | 'twitter' | 'linkedin',
  });

  const handleContentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentForm.topic.trim()) return;
    dispatch(generateContent({
      type: contentForm.type,
      topic: contentForm.topic,
      platform: contentForm.platform,
    }));
  };

  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoForm.contentType.trim()) return;
    dispatch(generateVideoAssist({
      type: videoForm.type,
      contentType: videoForm.contentType,
      platform: videoForm.platform,
    }));
  };

  const handleClear = () => {
    setContentForm({ type: 'caption', topic: '', platform: 'youtube' });
    setVideoForm({ type: 'idea', contentType: '', platform: 'youtube' });
    dispatch(clearAiStudioResult());
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setContentForm({ ...contentForm, [e.target.name]: e.target.value });
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setVideoForm({ ...videoForm, [e.target.name]: e.target.value });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>AI Content Studio</h2>
        <p className="page-subtitle">
          Generate optimized content and get AI-powered video assistance
        </p>
      </div>

      {/* Tab Selector */}
      <div className="form-row" style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={activeTab === 'content' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('content')}
        >
          Content Generation
        </button>
        <button
          type="button"
          className={activeTab === 'video' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('video')}
        >
          Video Assistant
        </button>
      </div>

      {/* Content Generation Form */}
      {activeTab === 'content' && (
        <form onSubmit={handleContentSubmit} className="analyzer-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ai-content-type">Content Type *</label>
              <select
                id="ai-content-type"
                name="type"
                value={contentForm.type}
                onChange={handleContentChange}
              >
                <option value="caption">Caption</option>
                <option value="hook">Hook</option>
                <option value="script_short">Short Script</option>
                <option value="script_long">Long Script</option>
                <option value="cta">Call to Action</option>
                <option value="translation">Translation</option>
                <option value="repurpose">Repurpose</option>
                <option value="calendar">Content Calendar</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="ai-content-platform">Platform *</label>
              <select
                id="ai-content-platform"
                name="platform"
                value={contentForm.platform}
                onChange={handleContentChange}
              >
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ai-content-topic">Topic *</label>
            <input
              id="ai-content-topic"
              name="topic"
              value={contentForm.topic}
              onChange={handleContentChange}
              required
              placeholder="Enter your content topic or idea"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading || !contentForm.topic.trim()}>
              {loading ? 'Generating...' : 'Generate Content'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleClear}>
              Clear
            </button>
          </div>
        </form>
      )}

      {/* Video Assistant Form */}
      {activeTab === 'video' && (
        <form onSubmit={handleVideoSubmit} className="analyzer-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ai-video-type">Assistance Type *</label>
              <select
                id="ai-video-type"
                name="type"
                value={videoForm.type}
                onChange={handleVideoChange}
              >
                <option value="idea">Idea Generation</option>
                <option value="outline">Video Outline</option>
                <option value="thumbnail">Thumbnail Suggestions</option>
                <option value="seo">SEO Optimization</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="ai-video-platform">Platform *</label>
              <select
                id="ai-video-platform"
                name="platform"
                value={videoForm.platform}
                onChange={handleVideoChange}
              >
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ai-video-contentType">Content Type *</label>
            <input
              id="ai-video-contentType"
              name="contentType"
              value={videoForm.contentType}
              onChange={handleVideoChange}
              required
              placeholder="e.g., tutorial, vlog, review, explainer"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading || !videoForm.contentType.trim()}>
              {loading ? 'Generating...' : 'Get Video Assistance'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleClear}>
              Clear
            </button>
          </div>
        </form>
      )}

      {loading && <LoadingSpinner message={activeTab === 'content' ? 'Generating content...' : 'Generating video suggestions...'} />}
      {error && <div className="error-banner">{error}</div>}

      {/* Content Generation Results */}
      {result && activeTab === 'content' && result.outputs && (
        <div className="module-section">
          <h3>Generated Content ({result.outputs.length} variants)</h3>
          <div className="results-grid">
            {result.outputs.map((output: any, idx: number) => (
              <div key={idx} className="result-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0 }}>Variant {output.variant || idx + 1}</h4>
                  <span className="badge badge-info">{output.characterCount || output.text?.length || 0} chars</span>
                </div>
                <div className="result-detail" style={{ whiteSpace: 'pre-wrap' }}>{output.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Assistant Results */}
      {result && activeTab === 'video' && result.suggestions && (
        <div className="module-section">
          <h3>Video Suggestions</h3>
          <div className="results-grid">
            {result.suggestions.map((suggestion: any, idx: number) => (
              <div key={idx} className="result-card">
                <h4>{suggestion.title || `Suggestion ${idx + 1}`}</h4>
                <div className="result-detail">{suggestion.description || suggestion.text}</div>
                {suggestion.tags && suggestion.tags.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    {suggestion.tags.map((tag: string, tIdx: number) => (
                      <span key={tIdx} className="badge" style={{ marginRight: '0.25rem' }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiStudio;
