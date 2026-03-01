// Content Shield Service
// Policy violation detection, copyright risk analysis, and content compliance checking.

import { v4 as uuidv4 } from 'uuid';
import { TenantRepository } from '../utils/repository';
import { config } from '../config';

// ── Types ──

export interface ContentShieldRequest {
  text: string;
  platform: 'youtube' | 'instagram';
  contentType?: 'video' | 'post' | 'story' | 'reel' | 'short';
  checkCopyright?: boolean;
  checkPolicy?: boolean;
  checkBrandSafety?: boolean;
}

export interface ContentShieldReport {
  reportId: string;
  generatedAt: string;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  overallScore: number;
  policyViolations: PolicyViolation[];
  copyrightRisks: CopyrightRisk[];
  brandSafetyIssues: BrandSafetyIssue[];
  recommendations: string[];
  platformGuidelines: PlatformGuideline[];
}

export interface PolicyViolation {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  matchedPhrase: string;
  suggestion: string;
}

export interface CopyrightRisk {
  type: 'music' | 'image' | 'text' | 'brand' | 'trademark';
  risk: 'low' | 'medium' | 'high';
  description: string;
  detectedElement: string;
  recommendation: string;
}

export interface BrandSafetyIssue {
  category: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact: string;
}

export interface PlatformGuideline {
  rule: string;
  status: 'pass' | 'warning' | 'fail';
  detail: string;
}

// ── Detection Data ──

const POLICY_PATTERNS: { pattern: RegExp; category: string; severity: PolicyViolation['severity']; description: string; suggestion: string }[] = [
  { pattern: /\b(hack|crack|pirat(e|ed|ing))\b/i, category: 'Intellectual Property', severity: 'high', description: 'Content may promote IP infringement', suggestion: 'Remove references to hacking or piracy. Use terms like "tips" or "guide" instead.' },
  { pattern: /\b(guarantee(d|s)?|100%\s*(sure|guaranteed|works))\b/i, category: 'Misleading Claims', severity: 'medium', description: 'Contains potentially misleading guarantees', suggestion: 'Avoid absolute guarantees. Use phrases like "may help" or "results may vary".' },
  { pattern: /\b(free\s*money|get\s*rich\s*quick|easy\s*money)\b/i, category: 'Misleading Financial', severity: 'high', description: 'Contains get-rich-quick language that violates ad policies', suggestion: 'Remove misleading financial claims. Focus on genuine value or educational content.' },
  { pattern: /\b(hate|kill|destroy|attack)\s+(them|people|group)/i, category: 'Hate Speech', severity: 'critical', description: 'Contains potentially harmful or hateful language', suggestion: 'Remove harmful language immediately. This could lead to content removal or account suspension.' },
  { pattern: /\b(miracle\s*cure|cures?\s*(cancer|diabetes|covid))\b/i, category: 'Health Misinformation', severity: 'critical', description: 'Contains unverified health claims', suggestion: 'Remove unverified medical claims. Add disclaimers and cite credible sources.' },
  { pattern: /\b(click\s*bait|sub\s*4\s*sub|follow\s*4\s*follow|f4f|s4s)\b/i, category: 'Engagement Manipulation', severity: 'medium', description: 'Contains engagement manipulation tactics', suggestion: 'Avoid engagement manipulation. Focus on organic growth strategies.' },
  { pattern: /\b(giveaway|contest).{0,30}(follow|subscribe|like|comment)/i, category: 'Contest Guidelines', severity: 'low', description: 'Giveaway/contest may need proper disclosures', suggestion: 'Ensure contest complies with platform rules. Add official rules and eligibility requirements.' },
  { pattern: /\b(sponsored|paid\s*partnership|ad|#ad)\b/i, category: 'Disclosure Check', severity: 'low', description: 'Sponsored content detected — ensure proper disclosure', suggestion: 'Good — disclosure detected. Ensure it meets FTC/ASCI guidelines (visible, upfront, clear).' },
];

const COPYRIGHT_KEYWORDS: { pattern: RegExp; type: CopyrightRisk['type']; description: string }[] = [
  { pattern: /\b(song|music|track|beat|remix)\b.*\b(by|from|ft\.?|feat\.?)\b/i, type: 'music', description: 'May contain copyrighted music references' },
  { pattern: /\b(bollywood|hollywood|netflix|disney|marvel|dc)\b/i, type: 'brand', description: 'Contains major brand/franchise references' },
  { pattern: /\b(logo|trademark|brand|©|®|™)\b/i, type: 'trademark', description: 'Contains trademark or logo references' },
  { pattern: /\b(clip|footage|scene|episode)\s+(from|of)\b/i, type: 'image', description: 'May reference copyrighted visual content' },
  { pattern: /\b(lyrics|quote|excerpt|passage)\s+(from|by)\b/i, type: 'text', description: 'May contain copyrighted text content' },
];

const BRAND_SAFETY_CATEGORIES = [
  { pattern: /\b(gambling|betting|casino|satta)\b/i, category: 'Gambling', description: 'Content references gambling which may limit brand partnerships', impact: 'Most mainstream brands avoid gambling-related content' },
  { pattern: /\b(alcohol|beer|wine|whiskey|vodka|rum|daaru)\b/i, category: 'Alcohol', description: 'Alcohol references may restrict monetization', impact: 'Limited brand collaborations and ad revenue in many regions' },
  { pattern: /\b(politics|political|election|vote|BJP|Congress|AAP)\b/i, category: 'Political Content', description: 'Political content reduces brand safety score', impact: 'Brands typically avoid political content associations' },
  { pattern: /\b(controversy|scandal|drama|exposed|cancelled)\b/i, category: 'Controversial Content', description: 'Controversial topics may affect brand partnerships', impact: 'Brand safety algorithms may flag this content' },
];

// ── Repository ──

class ShieldRepository extends TenantRepository {
  constructor() {
    super(config.tables.content);
  }

  async saveReport(tenantId: string, record: Record<string, unknown>): Promise<void> {
    await this.put(tenantId, record);
  }
}

// ── Service ──

export class ContentShieldService {
  private repo: ShieldRepository;

  constructor() {
    this.repo = new ShieldRepository();
  }

  async analyzeContent(tenantId: string, request: ContentShieldRequest): Promise<ContentShieldReport> {
    const { text, platform, checkCopyright = true, checkPolicy = true, checkBrandSafety = true } = request;
    const reportId = uuidv4();

    // Policy violations
    const policyViolations: PolicyViolation[] = [];
    if (checkPolicy) {
      for (const rule of POLICY_PATTERNS) {
        const match = text.match(rule.pattern);
        if (match) {
          policyViolations.push({
            category: rule.category,
            severity: rule.severity,
            description: rule.description,
            matchedPhrase: match[0],
            suggestion: rule.suggestion,
          });
        }
      }
    }

    // Copyright risks
    const copyrightRisks: CopyrightRisk[] = [];
    if (checkCopyright) {
      for (const kw of COPYRIGHT_KEYWORDS) {
        const match = text.match(kw.pattern);
        if (match) {
          copyrightRisks.push({
            type: kw.type,
            risk: kw.type === 'music' ? 'high' : 'medium',
            description: kw.description,
            detectedElement: match[0],
            recommendation: kw.type === 'music'
              ? 'Use royalty-free music or get proper licenses'
              : 'Ensure you have rights or use under fair use',
          });
        }
      }
    }

    // Brand safety
    const brandSafetyIssues: BrandSafetyIssue[] = [];
    if (checkBrandSafety) {
      for (const bs of BRAND_SAFETY_CATEGORIES) {
        if (bs.pattern.test(text)) {
          brandSafetyIssues.push({
            category: bs.category,
            severity: 'medium',
            description: bs.description,
            impact: bs.impact,
          });
        }
      }
    }

    // Platform guidelines
    const platformGuidelines = this.checkPlatformGuidelines(text, platform);

    // Overall risk calculation
    const criticalCount = policyViolations.filter(v => v.severity === 'critical').length;
    const highCount = policyViolations.filter(v => v.severity === 'high').length + copyrightRisks.filter(r => r.risk === 'high').length;
    const mediumCount = policyViolations.filter(v => v.severity === 'medium').length + copyrightRisks.filter(r => r.risk === 'medium').length;

    let overallRisk: ContentShieldReport['overallRisk'] = 'low';
    let overallScore = 100;

    if (criticalCount > 0) { overallRisk = 'critical'; overallScore = Math.max(0, 20 - criticalCount * 10); }
    else if (highCount > 0) { overallRisk = 'high'; overallScore = Math.max(10, 50 - highCount * 15); }
    else if (mediumCount > 0) { overallRisk = 'medium'; overallScore = Math.max(40, 75 - mediumCount * 10); }
    else { overallRisk = 'low'; overallScore = Math.min(100, 90 + platformGuidelines.filter(g => g.status === 'pass').length * 2); }

    // Recommendations
    const recommendations = this.generateRecommendations(policyViolations, copyrightRisks, brandSafetyIssues, overallRisk);

    const report: ContentShieldReport = {
      reportId,
      generatedAt: new Date().toISOString(),
      overallRisk,
      overallScore,
      policyViolations,
      copyrightRisks,
      brandSafetyIssues,
      recommendations,
      platformGuidelines,
    };

    this.repo.saveReport(tenantId, {
      tenant_id: tenantId,
      report_id: `shield#${reportId}`,
      platform,
      overall_risk: overallRisk,
      overall_score: overallScore,
      data: JSON.stringify(report),
      created_at: new Date().toISOString(),
    }).catch(err => console.error('Failed to save shield report:', err));

    return report;
  }

  private checkPlatformGuidelines(text: string, platform: string): PlatformGuideline[] {
    const guidelines: PlatformGuideline[] = [];
    const length = text.length;

    if (platform === 'youtube') {
      guidelines.push({
        rule: 'Title Length',
        status: length <= 100 ? 'pass' : 'warning',
        detail: length <= 100 ? 'Title within recommended 100 characters' : `Text is ${length} chars — YouTube titles should be under 100 characters`,
      });
      guidelines.push({
        rule: 'Description Keywords',
        status: /\b(subscribe|like|comment|share)\b/i.test(text) ? 'pass' : 'warning',
        detail: /\b(subscribe|like|comment|share)\b/i.test(text) ? 'Contains engagement keywords' : 'Consider adding engagement CTAs',
      });
      guidelines.push({
        rule: 'Hashtag Usage',
        status: (text.match(/#/g) || []).length <= 15 ? 'pass' : 'warning',
        detail: `Found ${(text.match(/#/g) || []).length} hashtags — YouTube recommends 3-5 per video`,
      });
    } else {
      guidelines.push({
        rule: 'Caption Length',
        status: length <= 2200 ? 'pass' : 'fail',
        detail: length <= 2200 ? 'Within Instagram 2200 character limit' : `${length} chars exceeds Instagram's 2200 character limit`,
      });
      guidelines.push({
        rule: 'Hashtag Count',
        status: (text.match(/#/g) || []).length <= 30 ? 'pass' : 'fail',
        detail: `Found ${(text.match(/#/g) || []).length} hashtags — Instagram allows max 30`,
      });
      guidelines.push({
        rule: 'Mention Usage',
        status: (text.match(/@/g) || []).length <= 20 ? 'pass' : 'warning',
        detail: `Found ${(text.match(/@/g) || []).length} mentions`,
      });
    }

    guidelines.push({
      rule: 'Disclosure Compliance',
      status: /\b(#ad|#sponsored|paid\s*partnership|#collab)\b/i.test(text) || !/\b(sponsor|brand|partner|paid)\b/i.test(text) ? 'pass' : 'warning',
      detail: /\b(#ad|#sponsored)\b/i.test(text) ? 'Proper sponsorship disclosure found' : 'If sponsored, add #ad or #sponsored disclosure',
    });

    return guidelines;
  }

  private generateRecommendations(
    violations: PolicyViolation[],
    copyrightRisks: CopyrightRisk[],
    brandIssues: BrandSafetyIssue[],
    risk: string,
  ): string[] {
    const recs: string[] = [];

    if (risk === 'critical') {
      recs.push('URGENT: Content contains critical policy violations. Do NOT publish before addressing all critical issues.');
    }

    if (violations.length > 0) {
      recs.push(`Address ${violations.length} policy violation(s) before publishing to avoid content removal or strikes.`);
    }

    if (copyrightRisks.length > 0) {
      recs.push(`Review ${copyrightRisks.length} copyright risk(s). Use royalty-free alternatives where possible.`);
    }

    if (brandIssues.length > 0) {
      recs.push(`${brandIssues.length} brand safety concern(s) detected. Consider adjusting if seeking brand partnerships.`);
    }

    if (violations.length === 0 && copyrightRisks.length === 0 && brandIssues.length === 0) {
      recs.push('Content looks clean! No major policy, copyright, or brand safety issues detected.');
      recs.push('Consider adding proper disclosures if this is sponsored content.');
    }

    return recs;
  }
}
