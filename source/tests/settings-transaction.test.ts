import { describe, expect, it, vi } from 'vitest';
import { changeEnabledState } from '../lib/settings-transaction';

describe('master switch transaction', () => {
  it('rolls the ruleset back when persistent storage rejects the new state', async () => {
    const syncRuleset = vi.fn(async () => undefined);
    const writeSettings = vi.fn(async () => { throw new Error('disk full'); });

    await expect(changeEnabledState({ enabled: true, allowedHosts: [] }, false, { syncRuleset, writeSettings }))
      .rejects.toThrow('disk full');
    expect(syncRuleset.mock.calls).toEqual([[false], [true]]);
  });
});
