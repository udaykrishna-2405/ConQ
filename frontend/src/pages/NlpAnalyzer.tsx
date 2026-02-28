import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { analyzeText, clearNlpResult } from '../store/slices/nlpSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';

const NlpAnalyzer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { result, loading, error } = useAppSelector((state) => state.nlp);

  const [text, setText] = useState('');
  const [platform, setPlatform] = useState<'youtube' | 'instagram'>('youtube');

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    dispatch(analyzeText({ text, platform }));
  };

  const handleClear = () => {
    setText('');
    dispatch(clearNlpResult());
  };

  const sentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '#2ecc71';
      case 'negative': return '#e74c3c';
      case 'mixed': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Multilingual NLP Analyzer</h2>
        <p className="page-subtitle">
          Analyze content in Hindi, English, and 10+ Indian languages
        </p>
      </div>

      <form onSubmit={handleAnalyze} className="analyzer-form">
        <div className="form-group">
          <label htmlFor="nlp-text">Content Text</label>
          <textarea
            id="nlp-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Enter text to analyze... (Hindi, English, Hinglish, Tamil, Telugu, Bengali, etc.)"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nlp-platform">Platform</label>
            <select
              id="nlp-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as 'youtube' | 'instagram')}
            >
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading || !text.trim()}>
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleClear}>
              Clear
            </button>
          </div>
        </div>
      </form>

      {loading && <LoadingSpinner message="Analyzing text..." />}
      {error && <div className="error-banner">{error}</div>}

      {result && (
        <div className="nlp-results">
          <div className="results-grid">
            {/* Language Detection */}
            <div className="result-card">
              <h3>Language Detection</h3>
              <div className="result-value">{result.languageName}</div>
              <div className="result-detail">
                Code: {result.language} | Confidence: {(result.confidence * 100).toFixed(0)}%
              </div>
              {result.isCodeMixed && (
                <span className="badge badge-info">Code-Mixed</span>
              )}
            </div>

            {/* Sentiment Analysis */}
            <div className="result-card">
              <h3>Sentiment</h3>
              <div
                className="result-value"
                style={{ color: sentimentColor(result.sentiment) }}
              >
                {result.sentiment.toUpperCase()}
              </div>
              <div className="sentiment-bar">
                <div
                  className="sentiment-fill"
                  style={{
                    width: `${Math.abs(result.sentimentScore) * 50 + 50}%`,
                    backgroundColor: sentimentColor(result.sentiment),
                  }}
                />
              </div>
              <div className="result-detail">
                Score: {result.sentimentScore.toFixed(3)} |
                Confidence: {(result.sentimentConfidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Entities */}
          {result.entities.length > 0 && (
            <div className="result-card entities-card">
              <h3>Extracted Entities ({result.entities.length})</h3>
              <div className="entities-list">
                {result.entities.map((entity, idx) => (
                  <span key={idx} className={`entity-tag entity-${entity.type}`}>
                    {entity.text}
                    <span className="entity-type">{entity.type}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NlpAnalyzer;
