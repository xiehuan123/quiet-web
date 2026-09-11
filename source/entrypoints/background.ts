import { isExtensionMessage, type SettingsResponse } from '@/lib/messages';
import { changeEnabledState } from '@/lib/settings-transaction';
import { CORE_RULESET_ID, DEFAULT_SETTINGS, normalizeSettings, SETTINGS_KEY } from '@/lib/settings';

async function readSettings() {
  return (await readSettingsRecord()).settings;
}
async function readSettingsRecord() {
  const stored = await browser.storage.local.get(SETTINGS_KEY);
  return { raw: stored[SETTINGS_KEY], settings: normalizeSettings(stored[SETTINGS_KEY]) };
}
async function writeSettings(settings: ReturnType<typeof normalizeSettings>) {
  await browser.storage.local.set({ [SETTINGS_KEY]: settings });
}
async function syncCoreRuleset(enabled: boolean) {
  const active = (await browser.declarativeNetRequest.getEnabledRulesets()).includes(CORE_RULESET_ID);
  if (active === enabled) return;
  await browser.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: enabled ? [CORE_RULESET_ID] : [], disableRulesetIds: enabled ? [] : [CORE_RULESET_ID] });
}
async function initializeProtection() {
  const { raw, settings } = await readSettingsRecord();
  if (!raw) await writeSettings(DEFAULT_SETTINGS);
  await syncCoreRuleset(settings.enabled);
}
async function notifyPages(enabled: boolean) {
  const tabs = await browser.tabs.query({});
  await Promise.all(tabs.filter((tab) => typeof tab.id === 'number').map(async (tab) => {
    try { await browser.tabs.sendMessage(tab.id!, { type: 'SET_PAGE_FILTERING', enabled }); }
    catch { /* Unsupported tabs are expected. */ }
  }));
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => { void initializeProtection().catch((error) => console.error('Failed to initialize protection', error)); });
  browser.runtime.onStartup.addListener(() => { void initializeProtection().catch((error) => console.error('Failed to restore protection', error)); });
  browser.runtime.onMessage.addListener(async (message: unknown): Promise<SettingsResponse | undefined> => {
    if (!isExtensionMessage(message)) return undefined;
    try {
      if (message.type === 'GET_SETTINGS') return { ok: true, settings: await readSettings() };
      if (message.type === 'SET_ENABLED') {
        const next = await changeEnabledState(await readSettings(), message.enabled, { syncRuleset: syncCoreRuleset, writeSettings });
        await notifyPages(next.enabled);
        return { ok: true, settings: next };
      }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : '未知错误' };
    }
    return undefined;
  });
  void initializeProtection().catch((error) => console.error('Failed to synchronize protection', error));
});
