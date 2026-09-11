// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPageFilter } from '../lib/page-filter';

afterEach(() => {
  document.documentElement.innerHTML = '<head></head><body></body>';
  vi.restoreAllMocks();
});

describe('high-confidence page filtering', () => {
  it.each([
    ['floating semantic ad', '<aside id="target" data-ad data-ad-slot="top"><span>广告</span><button data-ad-close>关闭广告</button></aside>'],
    ['known ad iframe container', '<div id="target" data-ad-container aria-label="Advertisement"><iframe src="https://securepubads.g.doubleclick.net/frame.html"></iframe></div>'],
    ['sponsored interstitial', '<section id="target" data-ad-container role="dialog"><b>赞助内容</b><button aria-label="关闭广告">×</button></section>'],
    ['associated ad overlay', '<div id="target" data-ad-overlay data-ad-scroll-lock="true"><span>广告</span><button data-ad-close>跳过广告</button></div>'],
  ])('hides %s without removing its DOM node', (_name, html) => {
    document.body.innerHTML = html;
    const target = document.querySelector<HTMLElement>('#target')!;
    const filter = createPageFilter(document);
    const result = filter.scan(document);

    expect(target.isConnected).toBe(true);
    expect(target.dataset.quietWebHidden).toBe('true');
    expect(result.hidden).toEqual([target]);
    expect(result.rejected.every(({ reason }) => reason === 'already-hidden')).toBe(true);
    expect(filter.getStatus()).toEqual({ hiddenCount: 1, active: false });
  });

  it.each([
    ['main content', '<main id="target" data-ad data-ad-slot="article"><p>广告行业报道正文</p><button data-ad-close>关闭</button></main>', 'protected-content'],
    ['article', '<article id="target" data-ad aria-label="Advertisement"><p>正文</p></article>', 'protected-content'],
    ['navigation', '<nav id="target" data-ad aria-label="Advertisement"><a href="#">菜单</a></nav>', 'protected-content'],
    ['login', '<form id="target" data-ad aria-label="Advertisement"><input type="password"></form>', 'protected-content'],
    ['OTP', '<div id="target" data-ad aria-label="Advertisement"><input autocomplete="one-time-code"></div>', 'protected-content'],
    ['CAPTCHA', '<div id="target" data-ad aria-label="Advertisement"><div data-captcha>验证码</div></div>', 'protected-content'],
    ['payment', '<section id="target" data-ad aria-label="Advertisement"><input autocomplete="cc-number"></section>', 'protected-content'],
    ['security alert', '<div id="target" data-ad aria-label="Advertisement" role="alertdialog">安全验证</div>', 'protected-content'],
    ['cookie choice', '<div id="target" data-ad aria-label="Advertisement" data-cookie-consent>Cookie 选择</div>', 'protected-content'],
    ['paywall', '<div id="target" data-ad aria-label="Advertisement" data-paywall>订阅后阅读</div>', 'protected-content'],
    ['fixed-only decoy', '<div id="target" style="position:fixed">普通工具条</div>', null],
    ['popup-class decoy', '<div id="target" class="ad-popup" role="dialog">普通帮助弹窗</div>', null],
  ])('preserves protected or single-signal case: %s', (_name, html, reason) => {
    document.body.innerHTML = html;
    const target = document.querySelector<HTMLElement>('#target')!;
    const result = createPageFilter(document).scan(document);
    expect(target.hasAttribute('data-quiet-web-hidden')).toBe(false);
    expect(result.rejected).toEqual(reason ? [{ element: target, reason }] : []);
  });

  it('protects a semantic content descendant even when its outer container has multiple ad signals', () => {
    document.body.innerHTML = '<div id="target" data-ad data-ad-container><main><h1>正文</h1></main></div>';
    const target = document.querySelector<HTMLElement>('#target')!;

    const result = createPageFilter(document).scan(document);

    expect(target.hasAttribute('data-quiet-web-hidden')).toBe(false);
    expect(result.rejected).toEqual([{ element: target, reason: 'protected-content' }]);
  });

  it('reports a stable insufficient-signals rejection reason', () => {
    document.body.innerHTML = '<aside id="target" data-ad>普通侧栏</aside>';
    const target = document.querySelector<HTMLElement>('#target')!;

    const result = createPageFilter(document).scan(document);

    expect(result).toEqual({ hidden: [], rejected: [{ element: target, reason: 'insufficient-signals' }] });
  });

  it('processes a dynamically added candidate and restores only its own changes', async () => {
    document.body.style.overflow = 'hidden';
    document.body.innerHTML = '<div id="root"></div>';
    const filter = createPageFilter(document);
    filter.start();

    document.querySelector('#root')!.insertAdjacentHTML('beforeend', '<aside id="dynamic" data-ad-overlay data-ad-scroll-lock="true"><span>广告</span><button data-ad-close>关闭广告</button></aside>');
    await new Promise((resolve) => setTimeout(resolve, 30));

    const dynamic = document.querySelector<HTMLElement>('#dynamic')!;
    expect(dynamic.dataset.quietWebHidden).toBe('true');
    expect(document.body.style.overflow).toBe('auto');

    filter.stop({ restore: true });
    expect(dynamic.hasAttribute('data-quiet-web-hidden')).toBe(false);
    expect(document.body.style.overflow).toBe('hidden');
    expect(filter.getStatus()).toEqual({ hiddenCount: 0, active: false });
  });

  it('merges mutations into animation frames and processes at most 25 candidates per frame', async () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    const filter = createPageFilter(document);
    filter.start();

    document.body.insertAdjacentHTML('beforeend', `<div id="bulk">${Array.from({ length: 60 }, (_, index) => `<aside data-ad data-ad-slot="slot-${index}">广告</aside>`).join('')}</div>`);
    await Promise.resolve();

    expect(callbacks).toHaveLength(1);
    callbacks.shift()!(0);
    expect(document.querySelectorAll('[data-quiet-web-hidden="true"]')).toHaveLength(25);
    expect(callbacks).toHaveLength(1);

    callbacks.shift()!(16);
    expect(document.querySelectorAll('[data-quiet-web-hidden="true"]')).toHaveLength(50);
    expect(callbacks).toHaveLength(1);

    callbacks.shift()!(32);
    expect(document.querySelectorAll('[data-quiet-web-hidden="true"]')).toHaveLength(60);
  });

  it('yields after 200 non-candidate nodes and resumes the remaining subtree next frame', async () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    const filter = createPageFilter(document);
    filter.start();
    const bulk = document.createElement('div');
    bulk.innerHTML = `${'<span>ordinary</span>'.repeat(220)}<aside id="late-ad" data-ad data-ad-slot="late">广告</aside>`;
    document.body.append(bulk);
    await Promise.resolve();

    callbacks.shift()!(0);
    expect(document.querySelector('#late-ad')?.hasAttribute('data-quiet-web-hidden')).toBe(false);
    expect(callbacks).toHaveLength(1);

    callbacks.shift()!(16);
    expect(document.querySelector('#late-ad')?.getAttribute('data-quiet-web-hidden')).toBe('true');
  });

  it('drops detached or externally unmarked elements from its live hidden count', () => {
    document.body.innerHTML = '<aside id="removed" data-ad data-ad-slot="removed">广告</aside><aside id="changed" data-ad data-ad-slot="changed">广告</aside>';
    const removed = document.querySelector<HTMLElement>('#removed')!;
    const changed = document.querySelector<HTMLElement>('#changed')!;
    const filter = createPageFilter(document);
    filter.scan(document);

    removed.remove();
    changed.setAttribute('data-quiet-web-hidden', 'site-value');

    expect(filter.getStatus().hiddenCount).toBe(0);
    expect(removed.hasAttribute('data-quiet-web-hidden')).toBe(false);
    expect(changed.getAttribute('data-quiet-web-hidden')).toBe('site-value');
  });

  it('does not process mutations outside the observed document', async () => {
    const detached = document.createElement('div');
    const filter = createPageFilter(document);
    filter.start();
    detached.innerHTML = '<aside id="outside" data-ad data-ad-slot="outside">广告</aside>';
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(detached.querySelector('#outside')?.hasAttribute('data-quiet-web-hidden')).toBe(false);
    expect(filter.getStatus().hiddenCount).toBe(0);
  });
});
