export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  main() {
    browser.runtime.onMessage.addListener((message: unknown) => {
      if (!message || typeof message !== 'object') return undefined;
      const type = (message as { type?: unknown }).type;
      if (type === 'GET_PAGE_STATUS' || type === 'SET_PAGE_FILTERING') return Promise.resolve({ ok: true, hiddenCount: 0 });
      return undefined;
    });
  },
});
