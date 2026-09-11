import type { ProtectionSettings } from './settings';

interface SettingsTransactionAdapters {
  syncRuleset(enabled: boolean): Promise<void>;
  writeSettings(settings: ProtectionSettings): Promise<void>;
}

export async function changeEnabledState(
  current: ProtectionSettings,
  enabled: boolean,
  adapters: SettingsTransactionAdapters,
): Promise<ProtectionSettings> {
  const next = { ...current, enabled };
  await adapters.syncRuleset(enabled);
  try {
    await adapters.writeSettings(next);
    return next;
  } catch (error) {
    await adapters.syncRuleset(current.enabled);
    throw error;
  }
}
