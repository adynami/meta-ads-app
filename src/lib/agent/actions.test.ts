import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('@/lib/crypto', () => ({ decrypt: (v: string) => v }));

import { createdObjectIds, isReversible, snapshotTargets, summarizeAction } from './actions';

describe('snapshotTargets', () => {
  it('snapshots the touched object for updates', () => {
    expect(snapshotTargets('meta_update_campaign', { campaign_id: '1', daily_budget: 50 })).toEqual(
      [{ id: '1', fields: expect.arrayContaining(['daily_budget', 'status']) }],
    );
    expect(
      snapshotTargets('meta_bulk_update_status', { ids: ['1', '2'], status: 'PAUSED' }),
    ).toEqual([
      { id: '1', fields: ['status'] },
      { id: '2', fields: ['status'] },
    ]);
  });

  it('returns null for tools without a snapshot strategy', () => {
    expect(snapshotTargets('meta_create_rule', {})).toBeNull();
  });
});

describe('createdObjectIds', () => {
  it('pauses a newly deployed campaign', () => {
    expect(createdObjectIds('meta_deploy_campaign', { campaign_id: 'c', adset_id: 'a' })).toEqual([
      'c',
    ]);
  });

  it('never pauses an existing campaign that a deploy injected into', () => {
    expect(
      createdObjectIds('meta_deploy_campaign', { injected: true, campaign_id: 'c', adset_id: 'a' }),
    ).toEqual(['a']);
  });

  it('uses the new_* ids from duplications', () => {
    expect(createdObjectIds('meta_duplicate_campaign', { new_campaign_id: 'n' })).toEqual(['n']);
    expect(createdObjectIds('meta_duplicate_adset', { new_adset_id: 'n' })).toEqual(['n']);
  });
});

describe('isReversible / summarizeAction', () => {
  it('knows which writes can be undone', () => {
    expect(isReversible('meta_update_adset')).toBe(true);
    expect(isReversible('meta_deploy_campaign')).toBe(true);
    expect(isReversible('meta_delete_audience')).toBe(false);
    expect(isReversible('meta_send_conversions_event')).toBe(false);
  });

  it('summarizes scalar inputs and array sizes', () => {
    expect(summarizeAction('meta_bulk_update_status', { ids: ['1', '2'], status: 'PAUSED' })).toBe(
      'bulk update status — status=PAUSED, ids: 2 item(s)',
    );
  });
});
