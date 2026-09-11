import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, normalizeSettings } from '../lib/settings';

describe('persistent protection settings', () => {
  it('defaults to protection enabled with no paused sites', () => {
    expect(DEFAULT_SETTINGS).toEqual({ enabled: true, allowedHosts: [] });
  });

  it('normalizes old or damaged local values without broadening the allowlist', () => {
    expect(normalizeSettings({ enabled: false, allowedHosts: ['Example.COM', '', 'bad host', 'example.com'] })).toEqual({
      enabled: false,
      allowedHosts: ['example.com'],
    });
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
  });
});
