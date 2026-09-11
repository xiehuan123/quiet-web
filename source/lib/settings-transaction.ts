import { normalizeSettings, type ProtectionSettings } from './settings';

interface SettingsTransactionAdapters {
  syncRuleset(enabled: boolean): Promise<void>;
  writeSettings(settings: ProtectionSettings): Promise<void>;
  reconcileRuleset(): Promise<void>;
}

interface AllowedHostsTransactionAdapters {
  syncAllowedHosts(hosts: string[]): Promise<void>;
  writeSettings(settings: ProtectionSettings): Promise<void>;
  reconcileAllowedHosts(): Promise<void>;
}

export class SettingsTransactionError extends Error {
  constructor(
    message: string,
    readonly primaryError: unknown,
    readonly rollbackError: unknown,
    readonly reconciliationError: unknown | null,
  ) {
    super(message, { cause: primaryError });
    this.name = 'SettingsTransactionError';
  }
}

async function commitSettingsChange<Value>(
  next: Value,
  previous: Value,
  sync: (value: Value) => Promise<void>,
  persist: () => Promise<void>,
  reconcile: () => Promise<void>,
): Promise<void> {
  await sync(next);
  try {
    await persist();
  } catch (primaryError) {
    try {
      await sync(previous);
    } catch (rollbackError) {
      try {
        await reconcile();
      } catch (reconciliationError) {
        throw new SettingsTransactionError(
          '保存失败，规则可能暂时不同步；请重试或重启浏览器。',
          primaryError,
          rollbackError,
          reconciliationError,
        );
      }
      throw new SettingsTransactionError(
        '保存失败；首次恢复失败，但已按本机设置重新同步。',
        primaryError,
        rollbackError,
        null,
      );
    }
    throw primaryError;
  }
}

export async function changeEnabledState(
  current: ProtectionSettings,
  enabled: boolean,
  adapters: SettingsTransactionAdapters,
): Promise<ProtectionSettings> {
  const next = { ...current, enabled };
  await commitSettingsChange(
    enabled,
    current.enabled,
    adapters.syncRuleset,
    () => adapters.writeSettings(next),
    adapters.reconcileRuleset,
  );
  return next;
}

export async function changeAllowedHosts(
  current: ProtectionSettings,
  allowedHosts: string[],
  adapters: AllowedHostsTransactionAdapters,
): Promise<ProtectionSettings> {
  const next = normalizeSettings({ ...current, allowedHosts });
  await commitSettingsChange(
    next.allowedHosts,
    current.allowedHosts,
    adapters.syncAllowedHosts,
    () => adapters.writeSettings(next),
    adapters.reconcileAllowedHosts,
  );
  return next;
}
