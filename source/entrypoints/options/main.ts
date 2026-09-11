import './style.css';
import type { SettingsResponse } from '@/lib/messages';
import type { ProtectionSettings } from '@/lib/settings';

const list = document.querySelector<HTMLUListElement>('#allowlist')!;
const emptyState = document.querySelector<HTMLElement>('#empty-state')!;
const clearAll = document.querySelector<HTMLButtonElement>('#clear-all')!;
const feedback = document.querySelector<HTMLElement>('#feedback')!;
let settings: ProtectionSettings | null = null;
let busy = false;

function setFeedback(message: string, kind: 'neutral' | 'success' | 'error' = 'neutral') {
  feedback.textContent = message;
  feedback.dataset.kind = kind;
}

function setBusy(next: boolean) {
  busy = next;
  clearAll.disabled = next || !settings?.allowedHosts.length;
  for (const button of list.querySelectorAll<HTMLButtonElement>('button')) button.disabled = next;
}

function makeHostRow(hostname: string): HTMLLIElement {
  const item = document.createElement('li');
  const host = document.createElement('code');
  host.textContent = hostname;
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'remove-button';
  remove.textContent = '移除';
  remove.setAttribute('aria-label', `恢复 ${hostname} 的保护`);
  remove.addEventListener('click', () => { void removeHost(hostname); });
  item.append(host, remove);
  return item;
}

function render(next: ProtectionSettings) {
  settings = next;
  list.replaceChildren(...next.allowedHosts.map(makeHostRow));
  emptyState.hidden = next.allowedHosts.length > 0;
  clearAll.disabled = busy || next.allowedHosts.length === 0;
}

async function removeHost(hostname: string) {
  if (busy) return;
  setBusy(true);
  setFeedback(`正在恢复 ${hostname}…`);
  try {
    const response = await browser.runtime.sendMessage({ type: 'SET_SITE_ALLOWED', hostname, allowed: false }) as SettingsResponse;
    if (!response?.ok) throw new Error(response?.error || '移除失败');
    render(response.settings);
    setFeedback(`已恢复 ${hostname}；刷新该网站后网络规则完整生效。`, 'success');
    const nextButton = list.querySelector<HTMLButtonElement>('button');
    if (nextButton) nextButton.focus();
    else emptyState.focus();
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '移除失败', 'error');
  } finally { setBusy(false); }
}

clearAll.addEventListener('click', async () => {
  if (busy || !settings?.allowedHosts.length) return;
  setBusy(true);
  setFeedback('正在清空暂停列表…');
  try {
    const response = await browser.runtime.sendMessage({ type: 'CLEAR_ALLOWED_HOSTS' }) as SettingsResponse;
    if (!response?.ok) throw new Error(response?.error || '清空失败');
    render(response.settings);
    setFeedback('暂停列表已清空；刷新相关网站后网络规则完整生效。', 'success');
    emptyState.focus();
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '清空失败', 'error');
  } finally { setBusy(false); }
});

void (async () => {
  try {
    const response = await browser.runtime.sendMessage({ type: 'GET_SETTINGS' }) as SettingsResponse;
    if (!response?.ok) throw new Error(response?.error || '无法读取设置');
    render(response.settings);
    setFeedback('设置仅保存在本机。');
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '无法读取设置', 'error');
  }
})();
