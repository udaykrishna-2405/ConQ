// Notification Service – Email alerts for trend changes
// Uses AWS SES when SES_FROM_EMAIL is configured.
// Falls back to console logging when SES is not available.

import { config } from '../config';

export interface TrendAlert {
  keyword: string;
  category: 'emerging' | 'trending' | 'viral' | 'declining';
  score: number;
  velocity: number;
  region: string;
}

export interface NotificationPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

const SES_FROM_EMAIL = config.ses.fromEmail;
const SES_CONFIGURED = !!process.env.SES_FROM_EMAIL;

/** Send email via SES (or log in dev mode). */
async function sendEmail(payload: NotificationPayload): Promise<boolean> {
  if (!SES_CONFIGURED) {
    console.log(`[NotificationService] Email (dev mode): to=${payload.to} subject="${payload.subject}"`);
    return true;
  }

  try {
    // Dynamic import to avoid bundling SES SDK when not needed
    const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
    const ses = new SESClient({ region: config.ses.region });

    await ses.send(new SendEmailCommand({
      Source: SES_FROM_EMAIL,
      Destination: { ToAddresses: [payload.to] },
      Message: {
        Subject: { Data: payload.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: payload.html, Charset: 'UTF-8' },
          Text: { Data: payload.text, Charset: 'UTF-8' },
        },
      },
    }));

    return true;
  } catch (err) {
    console.error('[NotificationService] SES send failed:', err);
    return false;
  }
}

/** Build HTML email body for trend alerts. */
function buildTrendAlertHtml(alerts: TrendAlert[], recipientName: string): string {
  const rows = alerts.map(a => {
    const categoryColor: Record<string, string> = {
      viral: '#e74c3c',
      trending: '#e67e22',
      emerging: '#2ecc71',
      declining: '#95a5a6',
    };
    const color = categoryColor[a.category] || '#3498db';
    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600">${a.keyword}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">
          <span style="background:${color};color:#fff;padding:2px 8px;border-radius:10px;font-size:12px;text-transform:uppercase">${a.category}</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${a.score}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${a.region}</td>
      </tr>`;
  }).join('');

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:24px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:24px">ConQ Trend Alert</h1>
        <p style="color:#a0a0b0;margin:4px 0 0;font-size:14px">AI Growth Operating System</p>
      </div>
      <div style="background:#fff;padding:24px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px">
        <p style="color:#2d3436;font-size:15px">Hi ${recipientName},</p>
        <p style="color:#636e72;font-size:14px">We detected ${alerts.length} trend${alerts.length !== 1 ? 's' : ''} that may be relevant to your content strategy:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="background:#f5f6fa">
              <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#636e72">Keyword</th>
              <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#636e72">Status</th>
              <th style="padding:8px 12px;text-align:right;font-size:12px;text-transform:uppercase;color:#636e72">Score</th>
              <th style="padding:8px 12px;text-align:right;font-size:12px;text-transform:uppercase;color:#636e72">Region</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color:#636e72;font-size:13px;margin-top:24px">
          Log in to your <a href="https://app.conq.app/trends" style="color:#3498db">ConQ dashboard</a> for details.
        </p>
        <p style="color:#95a5a6;font-size:12px;margin-top:16px;border-top:1px solid #eee;padding-top:16px">
          You received this because you have trend alerts enabled in ConQ.
        </p>
      </div>
    </div>`;
}

/** Build plain text email body for trend alerts. */
function buildTrendAlertText(alerts: TrendAlert[], recipientName: string): string {
  const lines = [
    `ConQ Trend Alert`,
    ``,
    `Hi ${recipientName},`,
    ``,
    `We detected ${alerts.length} trend${alerts.length !== 1 ? 's' : ''} relevant to your content:`,
    ``,
  ];

  for (const a of alerts) {
    lines.push(`  - ${a.keyword} [${a.category.toUpperCase()}] (score: ${a.score}, region: ${a.region})`);
  }

  lines.push('');
  lines.push('Log in to your ConQ dashboard for details: https://app.conq.app/trends');
  return lines.join('\n');
}

/** Send trend alert notification to a user. */
export async function sendTrendAlertEmail(
  to: string,
  recipientName: string,
  alerts: TrendAlert[]
): Promise<boolean> {
  if (alerts.length === 0) return true;

  const viralCount = alerts.filter(a => a.category === 'viral').length;
  const subject = viralCount > 0
    ? `ConQ: ${viralCount} viral trend${viralCount !== 1 ? 's' : ''} detected`
    : `ConQ: ${alerts.length} new trend${alerts.length !== 1 ? 's' : ''} detected`;

  return sendEmail({
    to,
    subject,
    html: buildTrendAlertHtml(alerts, recipientName),
    text: buildTrendAlertText(alerts, recipientName),
  });
}

/** Check trends and generate alerts for significant changes. */
export function detectAlertableTrends(
  trends: TrendAlert[],
  thresholds = { viralMinScore: 80, emergingMinVelocity: 50 }
): TrendAlert[] {
  return trends.filter(t =>
    (t.category === 'viral' && t.score >= thresholds.viralMinScore) ||
    (t.category === 'emerging' && t.velocity >= thresholds.emergingMinVelocity)
  );
}
