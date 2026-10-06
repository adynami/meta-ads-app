import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('@/lib/crypto', () => ({ decrypt: (v: string) => v, encrypt: (v: string) => v }));

import {
  conversionsOf,
  detectAnomalies,
  formatSlackMessage,
  isValidSlackWebhook,
  type DayRow,
} from './monitor';

function days(values: Partial<DayRow>[], start = 1): DayRow[] {
  return values.map((v, i) => ({
    campaign_id: 'c1',
    campaign_name: 'Prospecting',
    date_start: `2026-10-0${start + i}`,
    spend: 100,
    impressions: 10_000,
    clicks: 200,
    conversions: 10,
    ...v,
  }));
}

describe('detectAnomalies', () => {
  const yesterday = '2026-10-07';

  it('is quiet when yesterday looks like the baseline', () => {
    expect(detectAnomalies(days(Array(7).fill({})), yesterday)).toEqual([]);
  });

  it('flags a spend spike', () => {
    const rows = days([...Array(6).fill({}), { spend: 350, conversions: 40 }]);
    expect(detectAnomalies(rows, yesterday).map((a) => a.kind)).toContain('spend_spike');
  });

  it('flags stalled delivery', () => {
    const rows = days([
      ...Array(6).fill({}),
      { spend: 5, impressions: 300, clicks: 3, conversions: 0 },
    ]);
    expect(detectAnomalies(rows, yesterday).map((a) => a.kind)).toContain('delivery_drop');
  });

  it('flags a CPA jump', () => {
    const rows = days([...Array(6).fill({}), { conversions: 4 }]); // CPA 25 vs 10
    expect(detectAnomalies(rows, yesterday).map((a) => a.kind)).toContain('cpa_spike');
  });

  it('flags spend with zero conversions against a converting baseline', () => {
    const rows = days([...Array(6).fill({}), { conversions: 0 }]);
    const a = detectAnomalies(rows, yesterday).find((x) => x.kind === 'cpa_spike');
    expect(a?.detail).toMatch(/no conversions/);
  });

  it('flags a CTR drop', () => {
    const rows = days([...Array(6).fill({}), { clicks: 80 }]);
    expect(detectAnomalies(rows, yesterday).map((a) => a.kind)).toContain('ctr_drop');
  });

  it('needs at least 3 baseline days', () => {
    const rows = days([{}, {}, { spend: 1000 }], 5);
    expect(detectAnomalies(rows, yesterday)).toEqual([]);
  });
});

describe('helpers', () => {
  it('picks the most valuable conversion type present', () => {
    expect(
      conversionsOf([
        { action_type: 'lead', value: '5' },
        { action_type: 'purchase', value: '2' },
      ]),
    ).toBe(2);
    expect(conversionsOf([{ action_type: 'link_click', value: '9' }])).toBe(0);
  });

  it('accepts only Slack incoming webhooks', () => {
    expect(isValidSlackWebhook('https://hooks.slack.com/services/T/B/x')).toBe(true);
    expect(isValidSlackWebhook('http://hooks.slack.com/services/T/B/x')).toBe(false);
    expect(isValidSlackWebhook('https://evil.example/services/x')).toBe(false);
    expect(isValidSlackWebhook('not a url')).toBe(false);
  });

  it('formats a Slack message per account', () => {
    const msg = formatSlackMessage(
      [
        {
          account: 'Main',
          currency: 'USD',
          anomalies: [{ campaignId: '1', campaignName: 'P', kind: 'cpa_spike', detail: 'CPA 25' }],
        },
      ],
      'https://adynami.ai',
    );
    expect(msg.text).toContain('*Main* (USD)');
    expect(msg.text).toContain('CPA up');
  });
});
