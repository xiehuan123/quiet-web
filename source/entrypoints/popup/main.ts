import './style.css';
import type { PageStatusResponse, SettingsResponse } from '@/lib/messages';
import { selectTargetTab } from '@/lib/tab-target';

const toggle = document.querySelector<HTMLInputElement>('#master-toggle')!;
const summary = document.querySelector<HTMLElement>('#summary')!;
const currentSite = document.querySelector<HTMLElement>('#current-site')!;
const hiddenCount = document.querySelector<HTMLElement>('#hidden-count')!;
const feedback = document.querySelector<HTMLElement>('#feedback')!;
let targetTabId: number | null = null;

function setFeedback(message: string, kind: 'neutral' | 'success' | 'error' = 'neutral') {
  feedback.textContent = message;
  feedback.dataset.kind = kind;
}
function renderEnabled(enabled: boolean) {
  toggle.checked = enabled;
  summary.textContent = enabled ? '保护已开启' : '保护已暂停';
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
    renderEnabled(response.settings.enabled);
    toggle.disabled = false;
    const tab = selectTargetTab(await browser.tabs.query({ active: true, currentWindow: true }));
    if (!tab?.url) {
      currentSite.textContent = '此页面不受支持';
      hiddenCount.textContent = '不适用';
      setFeedback('Chrome 内部页等受限页面无法处理。');
      return;
    }
    currentSite.textContent = new URL(tab.url).hostname;
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
    renderEnabled(response.settings.enabled);
    await refreshPageStatus();
    setFeedback(requested ? '保护已开启；刷新页面后网络规则完整生效。' : '页面改动已恢复；刷新后恢复网络请求。', 'success');
  } catch (error) {
    toggle.checked = !requested;
    setFeedback(error instanceof Error ? error.message : '状态更新失败', 'error');
  } finally { toggle.disabled = false; }
});

void loadPopup();
