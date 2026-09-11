import '@/styles/content.css';
import { createPageFilter } from '@/lib/page-filter';
import { isExtensionMessage, type SettingsResponse } from '@/lib/messages';
import { normalizeSettings, SETTINGS_KEY } from '@/lib/settings';

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  main() {
    const filter = createPageFilter(document);
    const setFiltering = (enabled: boolean) => {
      if (enabled) filter.start();
      else filter.stop({ restore: true });
    };
    browser.runtime.onMessage.addListener((message: unknown) => {
      if (!isExtensionMessage(message)) return undefined;
      if (message.type === 'GET_PAGE_STATUS') return Promise.resolve({ ok: true, hiddenCount: filter.getStatus().hiddenCount });
      if (message.type === 'SET_PAGE_FILTERING') {
        setFiltering(message.enabled);
        return Promise.resolve({ ok: true, hiddenCount: filter.getStatus().hiddenCount });
      }
      return undefined;
    });
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local' || !changes[SETTINGS_KEY]) return;
      const settings = normalizeSettings(changes[SETTINGS_KEY].newValue);
      setFiltering(settings.enabled && !settings.allowedHosts.includes(location.hostname));
    });

    void (async () => {
      try {
        const response = await browser.runtime.sendMessage({ type: 'GET_SETTINGS' }) as SettingsResponse;
        if (response?.ok) setFiltering(response.settings.enabled && !response.settings.allowedHosts.includes(location.hostname));
      } catch (error) {
        console.warn('Quiet Web could not read initial settings', error);
      }
    })();
  },
});
