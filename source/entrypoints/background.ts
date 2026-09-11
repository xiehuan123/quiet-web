import { isExtensionMessage, type SettingsResponse } from '@/lib/messages';
import { changeAllowedHosts, changeEnabledState } from '@/lib/settings-transaction';
import { createSerialTaskQueue } from '@/lib/settings-mutation-queue';
import { CORE_RULESET_ID, DEFAULT_SETTINGS, normalizeSettings, SETTINGS_KEY } from '@/lib/settings';
import { buildSiteAllowRules, hostnameFromSupportedUrl, isManagedSiteRuleId, updateAllowedHost } from '@/lib/site-policy';

const enqueueSettingsTask = createSerialTaskQueue();

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
async function syncAllowedHostRules(hosts: string[]) {
  const current = await browser.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = current.filter((rule) => isManagedSiteRuleId(rule.id)).map((rule) => rule.id);
  await browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules: buildSiteAllowRules(hosts),
  });
}
async function initializeProtection() {
  const { raw, settings } = await readSettingsRecord();
  if (!raw) await writeSettings(DEFAULT_SETTINGS);
  await syncCoreRuleset(settings.enabled);
  await syncAllowedHostRules(settings.allowedHosts);
}
async function notifyPages(settings: ReturnType<typeof normalizeSettings>) {
  const tabs = await browser.tabs.query({});
  await Promise.all(tabs.filter((tab) => typeof tab.id === 'number').map(async (tab) => {
    const hostname = tab.url ? hostnameFromSupportedUrl(tab.url) : null;
    const enabled = settings.enabled && Boolean(hostname) && !settings.allowedHosts.includes(hostname!);
    try { await browser.tabs.sendMessage(tab.id!, { type: 'SET_PAGE_FILTERING', enabled }); }
    catch { /* Unsupported tabs are expected. */ }
  }));
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => { void enqueueSettingsTask(initializeProtection).catch((error) => console.error('Failed to initialize protection', error)); });
  browser.runtime.onStartup.addListener(() => { void enqueueSettingsTask(initializeProtection).catch((error) => console.error('Failed to restore protection', error)); });
  browser.runtime.onMessage.addListener(async (message: unknown): Promise<SettingsResponse | undefined> => {
    if (!isExtensionMessage(message)) return undefined;
    try {
      if (message.type === 'GET_SETTINGS') return { ok: true, settings: await enqueueSettingsTask(readSettings) };
      if (message.type === 'SET_ENABLED') {
        return await enqueueSettingsTask(async () => {
          const next = await changeEnabledState(await readSettings(), message.enabled, {
            syncRuleset: syncCoreRuleset,
            writeSettings,
            reconcileRuleset: async () => syncCoreRuleset((await readSettings()).enabled),
          });
          await notifyPages(next);
          return { ok: true, settings: next };
        });
      }
      if (message.type === 'SET_SITE_ALLOWED') {
        return await enqueueSettingsTask(async () => {
          const current = await readSettings();
          const requested = updateAllowedHost(current, message.hostname, message.allowed);
          const next = await changeAllowedHosts(current, requested.allowedHosts, {
            syncAllowedHosts: syncAllowedHostRules,
            writeSettings,
            reconcileAllowedHosts: async () => syncAllowedHostRules((await readSettings()).allowedHosts),
          });
          await notifyPages(next);
          return { ok: true, settings: next };
        });
      }
      if (message.type === 'CLEAR_ALLOWED_HOSTS') {
        return await enqueueSettingsTask(async () => {
          const current = await readSettings();
          const next = await changeAllowedHosts(current, [], {
            syncAllowedHosts: syncAllowedHostRules,
            writeSettings,
            reconcileAllowedHosts: async () => syncAllowedHostRules((await readSettings()).allowedHosts),
          });
          await notifyPages(next);
          return { ok: true, settings: next };
        });
      }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : '未知错误' };
    }
    return undefined;
  });
  void enqueueSettingsTask(initializeProtection).catch((error) => console.error('Failed to synchronize protection', error));
});
