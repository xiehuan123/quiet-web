import { normalizeHostname, normalizeSettings, type ProtectionSettings } from './settings';

export const SITE_RULE_ID_MIN = 1_000_000_000;
export const SITE_RULE_ID_MAX = 1_999_999_999;

export interface SiteAllowRule {
  id: number;
  priority: 100;
  action: { type: 'allowAllRequests' };
  condition: {
    regexFilter: string;
    resourceTypes: ['main_frame', 'sub_frame'];
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function hostnameFromSupportedUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return normalizeHostname(url.hostname);
  } catch {
    return null;
  }
}

export function updateAllowedHost(
  settings: ProtectionSettings,
  hostname: string,
  allowed: boolean,
): ProtectionSettings {
  const normalized = normalizeHostname(hostname);
  if (!normalized) throw new Error('无效的 hostname');
  const nextHosts = new Set(settings.allowedHosts);
  if (allowed) nextHosts.add(normalized);
  else nextHosts.delete(normalized);
  return normalizeSettings({ ...settings, allowedHosts: [...nextHosts] });
}

export function hashHostnameToRuleId(hostname: string): number {
  let hash = 2_166_136_261;
  for (const character of hostname) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619) >>> 0;
  }
  const range = SITE_RULE_ID_MAX - SITE_RULE_ID_MIN + 1;
  return SITE_RULE_ID_MIN + (hash % range);
}

export function isManagedSiteRuleId(id: number): boolean {
  return Number.isInteger(id) && id >= SITE_RULE_ID_MIN && id <= SITE_RULE_ID_MAX;
}

export function buildSiteAllowRules(
  values: string[],
  initialId: (hostname: string) => number = hashHostnameToRuleId,
): SiteAllowRule[] {
  const hostnames = normalizeSettings({ enabled: true, allowedHosts: values }).allowedHosts;
  const usedIds = new Set<number>();
  return hostnames.map((hostname) => {
    let id = initialId(hostname);
    if (!isManagedSiteRuleId(id)) id = SITE_RULE_ID_MIN + (Math.abs(id) % (SITE_RULE_ID_MAX - SITE_RULE_ID_MIN + 1));
    while (usedIds.has(id)) id = id === SITE_RULE_ID_MAX ? SITE_RULE_ID_MIN : id + 1;
    usedIds.add(id);
    return {
      id,
      priority: 100,
      action: { type: 'allowAllRequests' },
      condition: {
        regexFilter: `^https?://${escapeRegex(hostname)}(?::[0-9]+)?(?:/|$)`,
        resourceTypes: ['main_frame', 'sub_frame'],
      },
    };
  });
}
