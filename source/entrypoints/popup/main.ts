import './style.css';
import type { PageStatusResponse, SettingsResponse } from '@/lib/messages';
import type { ProtectionSettings } from '@/lib/settings';
import { hostnameFromSupportedUrl } from '@/lib/site-policy';
import { selectTargetTab } from '@/lib/tab-target';

const toggle = document.querySelector<HTMLInputElement>('#master-toggle')!;
const summary = document.querySelector<HTMLElement>('#summary')!;
const currentSite = document.querySelector<HTMLElement>('#current-site')!;
const networkState = document.querySelector<HTMLElement>('#network-state')!;
const hiddenCount = document.querySelector<HTMLElement>('#hidden-count')!;
const feedback = document.querySelector<HTMLElement>('#feedback')!;
const siteToggle = document.querySelector<HTMLButtonElement>('#site-toggle')!;
const siteState = document.querySelector<HTMLElement>('#site-state')!;
const openOptions = document.querySelector<HTMLButtonElement>('#open-options')!;
let targetTabId: number | null = null;
let currentHostname: string | null = null;
let currentSettings: ProtectionSettings | null = null;

function setFeedback(message: string, kind: 'neutral' | 'success' | 'error' = 'neutral') {
  feedback.textContent = message;
  feedback.dataset.kind = kind;
}
function renderSettings(settings: ProtectionSettings) {
  currentSettings = settings;
  toggle.checked = settings.enabled;
  summary.textContent = settings.enabled ? '保护已开启' : '保护已暂停';
  if (!currentHostname) return;
  const siteAllowed = settings.allowedHosts.includes(currentHostname);
  networkState.textContent = !settings.enabled ? '全局暂停' : siteAllowed ? '本站放行' : '规则已开启';
  siteState.textContent = siteAllowed ? '本站已暂停' : '本站保护中';
  siteToggle.textContent = siteAllowed ? '恢复本站' : '暂停本站';
  siteToggle.disabled = false;
}
async function refreshPageStatus() {
  if (targetTabId === null) return;
  try {
    const status = await browser.tabs.sendMessage(targetTabId, { type: 'GET_PAGE_STATUS' }) as PageStatusResponse;
    hiddenCount.textContent = status?.ok ? String(status.hiddenCount) : '—';
  } catch { hiddenCount.textContent = '需刷新页面'; }
}

async function loadPopup() {
  try {
    const response = await browser.runtime.sendMessage({ type: 'GET_SETTINGS' }) as SettingsResponse;
    if (!response?.ok) throw new Error(response?.error || '无法读取设置');
    toggle.disabled = false;
    const tab = selectTargetTab(await browser.tabs.query({ active: true, currentWindow: true }));
    if (!tab?.url) {
      currentSite.textContent = '此页面不受支持';
      networkState.textContent = '不适用';
      hiddenCount.textContent = '不适用';
      siteState.textContent = 'Chrome 内部页等受限页面无法暂停';
      setFeedback('Chrome 内部页等受限页面无法处理。');
      renderSettings(response.settings);
      return;
    }
    currentHostname = hostnameFromSupportedUrl(tab.url);
    if (!currentHostname) throw new Error('当前页面没有可用的 HTTP(S) hostname');
    currentSite.textContent = currentHostname;
    renderSettings(response.settings);
    if (typeof tab.id === 'number') {
      targetTabId = tab.id;
      await refreshPageStatus();
    }
  } catch (error) {
    toggle.disabled = true;
    summary.textContent = '状态读取失败';
    setFeedback(error instanceof Error ? error.message : '无法读取扩展状态', 'error');
  }
}

toggle.addEventListener('change', async () => {
  const requested = toggle.checked;
  toggle.disabled = true;
  setFeedback('正在更新保护状态…');
  try {
    const response = await browser.runtime.sendMessage({ type: 'SET_ENABLED', enabled: requested }) as SettingsResponse;
    if (!response?.ok) throw new Error(response?.error || '状态更新失败');
    renderSettings(response.settings);
    await refreshPageStatus();
    setFeedback(requested ? '保护已开启；刷新页面后网络规则完整生效。' : '页面改动已恢复；刷新后恢复网络请求。', 'success');
  } catch (error) {
    if (currentSettings) renderSettings(currentSettings);
    setFeedback(error instanceof Error ? error.message : '状态更新失败', 'error');
  } finally { toggle.disabled = false; }
});

siteToggle.addEventListener('click', async () => {
  if (!currentHostname || !currentSettings) return;
  const requestedAllowed = !currentSettings.allowedHosts.includes(currentHostname);
  siteToggle.disabled = true;
  toggle.disabled = true;
  setFeedback('正在更新本站状态…');
  try {
    const response = await browser.runtime.sendMessage({
      type: 'SET_SITE_ALLOWED',
      hostname: currentHostname,
      allowed: requestedAllowed,
    }) as SettingsResponse;
    if (!response?.ok) throw new Error(response?.error || '本站状态更新失败');
    renderSettings(response.settings);
    await refreshPageStatus();
    setFeedback(
      requestedAllowed
        ? '本站页面内容已恢复；刷新后恢复网络请求。'
        : '本站保护已恢复；刷新后网络规则完整生效。',
      'success',
    );
  } catch (error) {
    if (currentSettings) renderSettings(currentSettings);
    setFeedback(error instanceof Error ? error.message : '本站状态更新失败', 'error');
  } finally {
    toggle.disabled = false;
    if (currentHostname) siteToggle.disabled = false;
  }
});

openOptions.addEventListener('click', () => {
  void browser.tabs.create({ url: browser.runtime.getURL('/options.html') }).catch((error) => {
    setFeedback(error instanceof Error ? error.message : '无法打开设置页', 'error');
  });
});

void loadPopup();
