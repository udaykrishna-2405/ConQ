// NLP Service – Orchestrator
// Combines language detection, sentiment analysis, and entity extraction
// into a unified NLP analysis pipeline. All results are tenant-scoped.

import { v4 as uuidv4 } from 'uuid';
import { detectLanguage } from './nlp/languageDetector';
import { analyzeSentiment } from './nlp/sentimentAnalyzer';
import { extractEntities } from './nlp/entityExtractor';
import { NlpAnalysis, Entity } from '../models/schemas';
import { TenantRepository } from '../utils/repository';
import { config } from '../config';

export interface NlpAnalysisRequest {
  text: string;
  platform?: 'youtube' | 'instagram';
}

export interface NlpAnalysisResponse {
  analysisId: string;
  language: string;
  languageConfidence: number;
  script: string;
  isCodeMixed: boolean;
  detectedLanguages: Array<{ language: string; percentage: number }>;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  sentimentScore: number;
  sentimentConfidence: number;
  sentimentBreakdown: {
    positiveWords: string[];
    negativeWords: string[];
    positiveScore: number;
    negativeScore: number;
  };
  entities: Entity[];
  hashtagCount: number;
  mentionCount: number;
  textStats: {
    charCount: number;
    wordCount: number;
    avgWordLength: number;
  };
}

// DynamoDB table for NLP analysis results
interface NlpAnalysisRecord {
  tenant_id: string;
  analysis_id: string;
  text_preview: string;
  platform?: string;
  language: string;
  sentiment: string;
  sentiment_score: number;
  entities: Entity[];
  is_code_mixed: boolean;
  created_at: string;
}

class NlpRepository extends TenantRepository {
  constructor() {
    super(config.tables.content); // Store NLP analyses alongside content
  }

  async saveAnalysis(tenantId: string, record: NlpAnalysisRecord): Promise<void> {
    await this.put(tenantId, record as unknown as Record<string, unknown>);
  }
}

export class NlpService {
  private repo: NlpRepository;

  constructor() {
    this.repo = new NlpRepository();
  }

  /**
   * Full NLP analysis pipeline.
   * 1. Detect language
   * 2. Analyze sentiment (using detected language for lexicon selection)
   * 3. Extract entities
   * 4. Compute text statistics
   * 5. Persist results
   */
  async analyze(
    tenantId: string,
    request: NlpAnalysisRequest
  ): Promise<NlpAnalysisResponse> {
    const { text, platform } = request;

    // 1. Language detection
    const langResult = detectLanguage(text);

    // 2. Sentiment analysis
    const sentimentResult = analyzeSentiment(text, langResult.language);

    // 3. Entity extraction
    const entityResult = extractEntities(text);

    // 4. Text statistics
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const textStats = {
      charCount: text.length,
      wordCount: words.length,
      avgWordLength: words.length > 0
        ? Math.round((words.reduce((sum, w) => sum + w.length, 0) / words.length) * 10) / 10
        : 0,
    };

    const analysisId = uuidv4();

    // 5. Persist to DynamoDB (fire-and-forget for latency)
    const record: NlpAnalysisRecord = {
      tenant_id: tenantId,
      analysis_id: analysisId,
      text_preview: text.substring(0, 200),
      platform,
      language: langResult.language,
      sentiment: sentimentResult.sentiment,
      sentiment_score: sentimentResult.score,
      entities: entityResult.entities,
      is_code_mixed: langResult.isCodeMixed,
      created_at: new Date().toISOString(),
    };

    // Non-blocking save — don't block response on DB write
    this.repo.saveAnalysis(tenantId, record).catch(err => {
      console.error('Failed to save NLP analysis:', err);
    });

    return {
      analysisId,
      language: langResult.language,
      languageConfidence: langResult.confidence,
      script: langResult.script,
      isCodeMixed: langResult.isCodeMixed,
      detectedLanguages: langResult.detectedLanguages,
      sentiment: sentimentResult.sentiment,
      sentimentScore: sentimentResult.score,
      sentimentConfidence: sentimentResult.confidence,
      sentimentBreakdown: sentimentResult.breakdown,
      entities: entityResult.entities,
      hashtagCount: entityResult.hashtagCount,
      mentionCount: entityResult.mentionCount,
      textStats,
    };
  }

  /**
   * Converts full NLP analysis response to the compact NlpAnalysis
   * format used in Content schema.
   */
  toContentAnalysis(response: NlpAnalysisResponse): NlpAnalysis {
    return {
      language: response.language,
      sentiment: response.sentiment,
      sentiment_score: response.sentimentScore,
      entities: response.entities,
      is_code_mixed: response.isCodeMixed,
    };
  }
}
