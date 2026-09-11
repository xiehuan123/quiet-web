import { describe, expect, it, vi } from 'vitest';
import { changeAllowedHosts, changeEnabledState, SettingsTransactionError } from '../lib/settings-transaction';

describe('master switch transaction', () => {
  it('rolls the ruleset back when persistent storage rejects the new state', async () => {
    const syncRuleset = vi.fn(async () => undefined);
    const writeSettings = vi.fn(async () => { throw new Error('disk full'); });

    await expect(changeEnabledState({ enabled: true, allowedHosts: [] }, false, {
      syncRuleset,
      writeSettings,
      reconcileRuleset: async () => undefined,
    }))
      .rejects.toThrow('disk full');
    expect(syncRuleset.mock.calls).toEqual([[false], [true]]);
  });
});

describe('site allowlist transaction', () => {
  it('syncs dynamic rules before persisting the same normalized settings', async () => {
    const calls: string[] = [];
    const syncAllowedHosts = vi.fn(async (hosts: string[]) => { calls.push(`rules:${hosts.join(',')}`); });
    const writeSettings = vi.fn(async (settings: { allowedHosts: string[] }) => { calls.push(`storage:${settings.allowedHosts.join(',')}`); });

    const result = await changeAllowedHosts(
      { enabled: true, allowedHosts: [] },
      ['Example.COM'],
      { syncAllowedHosts, writeSettings, reconcileAllowedHosts: async () => undefined },
    );

    expect(result.allowedHosts).toEqual(['example.com']);
    expect(calls).toEqual(['rules:example.com', 'storage:example.com']);
  });

  it('restores the previous dynamic rules if storage persistence fails', async () => {
    const syncAllowedHosts = vi.fn(async () => undefined);
    const writeSettings = vi.fn(async () => { throw new Error('storage failed'); });

    await expect(changeAllowedHosts(
      { enabled: true, allowedHosts: ['old.example'] },
      ['new.example'],
      { syncAllowedHosts, writeSettings, reconcileAllowedHosts: async () => undefined },
    )).rejects.toThrow('storage failed');

    expect(syncAllowedHosts.mock.calls).toEqual([[['new.example']], [['old.example']]]);
  });

  it('reports both failures and reconciles from persistent state when rollback fails', async () => {
    const syncAllowedHosts = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('rollback failed'));
    const writeSettings = vi.fn(async () => { throw new Error('storage failed'); });
    const reconcileAllowedHosts = vi.fn(async () => undefined);

    const failure = await changeAllowedHosts(
      { enabled: true, allowedHosts: ['old.example'] },
      ['new.example'],
      { syncAllowedHosts, writeSettings, reconcileAllowedHosts },
    ).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(SettingsTransactionError);
    expect(failure).toMatchObject({
      message: expect.stringContaining('已按本机设置重新同步'),
      primaryError: expect.objectContaining({ message: 'storage failed' }),
      rollbackError: expect.objectContaining({ message: 'rollback failed' }),
      reconciliationError: null,
    });
    expect(reconcileAllowedHosts).toHaveBeenCalledOnce();
  });

  it('reports an uncertain state if rollback and authoritative reconciliation both fail', async () => {
    const syncAllowedHosts = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('rollback failed'));
    const writeSettings = vi.fn(async () => { throw new Error('storage failed'); });
    const reconcileAllowedHosts = vi.fn(async () => { throw new Error('reconcile failed'); });

    const failure = await changeAllowedHosts(
      { enabled: true, allowedHosts: ['old.example'] },
      ['new.example'],
      { syncAllowedHosts, writeSettings, reconcileAllowedHosts },
    ).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(SettingsTransactionError);
    expect(failure).toMatchObject({
      message: expect.stringContaining('可能暂时不同步'),
      primaryError: expect.objectContaining({ message: 'storage failed' }),
      rollbackError: expect.objectContaining({ message: 'rollback failed' }),
      reconciliationError: expect.objectContaining({ message: 'reconcile failed' }),
    });
  });
});
