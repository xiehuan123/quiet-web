export interface ProtectionSettings {
  enabled: boolean;
  allowedHosts: string[];
}

export const SETTINGS_KEY = 'protectionSettings';
export const CORE_RULESET_ID = 'core';
export const DEFAULT_SETTINGS: ProtectionSettings = Object.freeze({ enabled: true, allowedHosts: [] });

export function normalizeHostname(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const candidate = value.trim().toLowerCase().replace(/\.$/, '');
  if (!candidate || candidate.includes(' ') || candidate.includes('/') || candidate.includes(':')) return null;
  try {
    const hostname = new URL(`https://${candidate}/`).hostname.toLowerCase().replace(/\.$/, '');
    return hostname === candidate ? hostname : null;
  } catch {
    return null;
  }
}

export function normalizeSettings(value: unknown): ProtectionSettings {
  if (!value || typeof value !== 'object') return { ...DEFAULT_SETTINGS };
  const input = value as Partial<ProtectionSettings>;
  const allowedHosts = Array.isArray(input.allowedHosts)
    ? [...new Set(input.allowedHosts.map(normalizeHostname).filter((host): host is string => Boolean(host)))].sort()
    : [];
  return { enabled: typeof input.enabled === 'boolean' ? input.enabled : true, allowedHosts };
}
