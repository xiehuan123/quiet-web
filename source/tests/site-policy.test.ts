import { describe, expect, it } from 'vitest';
import {
  buildSiteAllowRules,
  hostnameFromSupportedUrl,
  isManagedSiteRuleId,
  updateAllowedHost,
} from '../lib/site-policy';

describe('exact-host site policy', () => {
  it('extracts exact hostnames only from supported HTTP(S) URLs', () => {
    expect(hostnameFromSupportedUrl('https://News.Example.com:8443/story')).toBe('news.example.com');
    expect(hostnameFromSupportedUrl('http://127.0.0.1:4181/page')).toBe('127.0.0.1');
    expect(hostnameFromSupportedUrl('chrome://extensions')).toBeNull();
    expect(hostnameFromSupportedUrl('not a url')).toBeNull();
  });

  it('adds and removes only the normalized exact hostname', () => {
    const settings = { enabled: true, allowedHosts: ['other.example'] };
    expect(updateAllowedHost(settings, 'News.Example.com', true).allowedHosts).toEqual(['news.example.com', 'other.example']);
    expect(updateAllowedHost(settings, 'news.example.com', false).allowedHosts).toEqual(['other.example']);
    expect(() => updateAllowedHost(settings, 'bad host/path', true)).toThrow('无效的 hostname');
  });

  it('builds a high-priority allowAllRequests rule whose regex excludes subdomains and suffix attacks', () => {
    const rule = buildSiteAllowRules(['News.Example.com'])[0]!;
    expect(rule.priority).toBe(100);
    expect(rule.action).toEqual({ type: 'allowAllRequests' });
    expect(rule.condition.resourceTypes).toEqual(['main_frame', 'sub_frame']);
    expect(new RegExp(rule.condition.regexFilter)).toEqual(expect.any(RegExp));
    const regex = new RegExp(rule.condition.regexFilter);
    expect(regex.test('https://news.example.com/story')).toBe(true);
    expect(regex.test('http://news.example.com:8080/')).toBe(true);
    expect(regex.test('https://sub.news.example.com/story')).toBe(false);
    expect(regex.test('https://news.example.com.evil.test/story')).toBe(false);
  });

  it('allocates deterministic unique managed IDs even when host hashes collide', () => {
    const rules = buildSiteAllowRules(['b.example', 'a.example'], () => 1_000_000_007);
    expect(rules.map((rule) => rule.id)).toEqual([1_000_000_007, 1_000_000_008]);
    expect(rules.every((rule) => isManagedSiteRuleId(rule.id))).toBe(true);
    expect(buildSiteAllowRules(['a.example', 'b.example'], () => 1_000_000_007)).toEqual(rules);
  });
});
