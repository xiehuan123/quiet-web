export interface PageFilterStatus { hiddenCount: number; active: boolean }
export interface StopOptions { restore?: boolean }
export type RejectionReason = 'already-hidden' | 'insufficient-signals' | 'protected-content';
export interface RejectedCandidate { element: HTMLElement; reason: RejectionReason }
export interface ScanResult { hidden: HTMLElement[]; rejected: RejectedCandidate[] }
export interface PageFilter {
  scan(root: ParentNode): ScanResult;
  start(): void;
  stop(options?: StopOptions): void;
  getStatus(): PageFilterStatus;
}

const CANDIDATE_SELECTOR = [
  '[data-ad]', '[data-ad-slot]', '[data-ad-client]', '[data-ad-container]', '[data-ad-overlay]',
  '[aria-label*="advertisement" i]', '[aria-label*="广告"]',
  'iframe[src*="doubleclick.net"]', 'iframe[src*="googlesyndication.com"]',
  'iframe[src*="amazon-adsystem.com"]', 'iframe[src*="taboola.com"]', 'iframe[src*="outbrain.com"]',
].join(',');
const KNOWN_AD_HOSTS = ['doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'amazon-adsystem.com', 'taboola.com', 'outbrain.com'];
const PROTECTED_ANCESTORS = 'main, article, nav, [role="navigation"], [data-paywall], [data-content-gate], [data-cookie-consent], [role="alertdialog"]';
const PROTECTED_DESCENDANTS = [
  'main', 'article', 'nav', '[role="navigation"]',
  'input[type="password"]', '[autocomplete="one-time-code"]', '[autocomplete^="cc-"]',
  '[data-captcha]', '.g-recaptcha', '[data-payment]', '[data-checkout]', '[data-security-warning]',
  '[data-paywall]', '[data-content-gate]', '[data-cookie-consent]', '[role="alertdialog"]',
].join(',');
const MAX_CANDIDATES_PER_ROOT = 50;
const MAX_DYNAMIC_CANDIDATES_PER_FRAME = 25;
const MAX_DYNAMIC_NODES_PER_FRAME = 200;

function hasKnownAdResource(element: Element): boolean {
  const resources = [element, ...element.querySelectorAll('[src]')];
  return resources.some((resource) => {
    const source = resource.getAttribute('src');
    if (!source) return false;
    try {
      const hostname = new URL(source, element.ownerDocument.baseURI).hostname.toLowerCase();
      return KNOWN_AD_HOSTS.some((known) => hostname === known || hostname.endsWith(`.${known}`));
    } catch { return false; }
  });
}

function hasCloseControl(element: Element): boolean {
  return Boolean(element.querySelector('[data-ad-close], button[aria-label*="关闭广告"], button[aria-label*="close ad" i], button[aria-label*="skip ad" i]'));
}

function hasProtectedMeaning(element: Element): boolean {
  if (element.closest(PROTECTED_ANCESTORS) || element.querySelector(PROTECTED_DESCENDANTS)) return true;
  const text = (element.textContent ?? '').slice(0, 400).toLowerCase();
  return /登录|验证码|安全验证|风控|结账|支付|cookie|隐私选择|订阅后阅读|login|captcha|checkout|payment|security check|paywall/.test(text);
}

function adSignalCount(element: Element): number {
  let count = 0;
  const label = element.getAttribute('aria-label') ?? '';
  if (element.hasAttribute('data-ad') || element.hasAttribute('data-ad-slot') || element.hasAttribute('data-ad-client') || /广告|advertisement|sponsored/i.test(label)) count += 1;
  if (element.hasAttribute('data-ad-container') || element.hasAttribute('data-ad-overlay')) count += 1;
  if (hasKnownAdResource(element)) count += 1;
  if (hasCloseControl(element)) count += 1;
  if (/广告|赞助内容|advertisement|sponsored content/i.test((element.textContent ?? '').slice(0, 300))) count += 1;
  return count;
}

function collectCandidates(root: ParentNode): HTMLElement[] {
  const candidates: HTMLElement[] = [];
  if (root instanceof HTMLElement && root.matches(CANDIDATE_SELECTOR)) candidates.push(root);
  for (const candidate of root.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR)) {
    if (candidates.length >= MAX_CANDIDATES_PER_ROOT) break;
    candidates.push(candidate);
  }
  return candidates;
}

export function createPageFilter(page: Document): PageFilter {
  const hidden = new Set<HTMLElement>();
  const originalMarker = new WeakMap<HTMLElement, string | null>();
  const queue = new Set<HTMLElement>();
  let observer: MutationObserver | null = null;
  let scheduled = false;
  let active = false;
  let originalBodyOverflow: string | null = null;

  function restoreMarker(element: HTMLElement) {
    if (element.getAttribute('data-quiet-web-hidden') === 'true') {
      const marker = originalMarker.get(element);
      if (marker === null || marker === undefined) element.removeAttribute('data-quiet-web-hidden');
      else element.setAttribute('data-quiet-web-hidden', marker);
    }
    hidden.delete(element);
    originalMarker.delete(element);
  }

  function restoreBodyOverflowIfUnused() {
    const hasLiveScrollLock = [...hidden].some((element) => (
      element.isConnected
      && element.getAttribute('data-quiet-web-hidden') === 'true'
      && element.hasAttribute('data-ad-scroll-lock')
    ));
    if (!hasLiveScrollLock && originalBodyOverflow !== null) {
      if (page.body.style.overflow === 'auto') page.body.style.overflow = originalBodyOverflow;
      originalBodyOverflow = null;
    }
  }

  function pruneHidden() {
    for (const element of [...hidden]) {
      if (!element.isConnected || element.getAttribute('data-quiet-web-hidden') !== 'true') restoreMarker(element);
    }
    restoreBodyOverflowIfUnused();
  }

  function evaluate(candidate: HTMLElement): RejectionReason | null {
    if (candidate.hasAttribute('data-quiet-web-hidden') || candidate.closest('[data-quiet-web-hidden="true"]')) return 'already-hidden';
    if (hasProtectedMeaning(candidate)) return 'protected-content';
    if (adSignalCount(candidate) < 2) return 'insufficient-signals';
    return null;
  }

  function hide(candidate: HTMLElement): RejectionReason | null {
    const rejection = evaluate(candidate);
    if (rejection) return rejection;
    originalMarker.set(candidate, candidate.getAttribute('data-quiet-web-hidden'));
    candidate.setAttribute('data-quiet-web-hidden', 'true');
    hidden.add(candidate);
    if (candidate.hasAttribute('data-ad-scroll-lock') && page.body.style.overflow === 'hidden' && originalBodyOverflow === null) {
      originalBodyOverflow = page.body.style.overflow;
      page.body.style.overflow = 'auto';
    }
    return null;
  }

  function scan(root: ParentNode): ScanResult {
    const result: ScanResult = { hidden: [], rejected: [] };
    for (const candidate of collectCandidates(root)) {
      const rejection = hide(candidate);
      if (rejection) result.rejected.push({ element: candidate, reason: rejection });
      else result.hidden.push(candidate);
    }
    return result;
  }

  function restore() {
    for (const element of [...hidden]) restoreMarker(element);
    restoreBodyOverflowIfUnused();
  }

  function scheduleFlush() {
    if (scheduled) return;
    scheduled = true;
    const schedule = page.defaultView?.requestAnimationFrame ?? ((callback: FrameRequestCallback) => page.defaultView!.setTimeout(callback, 16));
    schedule(() => {
      scheduled = false;
      if (!active) return;
      let examinedNodes = 0;
      let examinedCandidates = 0;
      for (const element of queue) {
        if (examinedNodes >= MAX_DYNAMIC_NODES_PER_FRAME || examinedCandidates >= MAX_DYNAMIC_CANDIDATES_PER_FRAME) break;
        queue.delete(element);
        examinedNodes += 1;
        const isCandidate = element.matches(CANDIDATE_SELECTOR);
        const rejection = isCandidate ? hide(element) : null;
        if (isCandidate) examinedCandidates += 1;
        if (!isCandidate || rejection) {
          for (const child of element.children) if (child instanceof HTMLElement) queue.add(child);
        }
      }
      if (queue.size > 0 && active) scheduleFlush();
    });
  }

  function start() {
    if (active) return;
    active = true;
    scan(page);
    const Observer = page.defaultView?.MutationObserver ?? MutationObserver;
    observer = new Observer((mutations) => {
      for (const mutation of mutations) for (const node of mutation.addedNodes) if (node instanceof HTMLElement) queue.add(node);
      if (queue.size > 0) scheduleFlush();
    });
    observer.observe(page.documentElement, { childList: true, subtree: true });
  }

  function stop(options: StopOptions = {}) {
    active = false;
    observer?.disconnect();
    observer = null;
    queue.clear();
    if (options.restore) restore();
  }

  return {
    scan,
    start,
    stop,
    getStatus: () => {
      pruneHidden();
      return { hiddenCount: hidden.size, active };
    },
  };
}
