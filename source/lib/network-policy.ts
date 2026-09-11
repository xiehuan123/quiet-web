export type NetworkResourceType = 'script' | 'image' | 'xmlhttprequest' | 'sub_frame' | 'media' | 'main_frame';
export interface NetworkRequest { url: string; resourceType: NetworkResourceType }
export interface NetworkRule { id: number; priority: number; action: { type: 'block' }; condition: { urlFilter?: string; resourceTypes?: NetworkResourceType[] } }
export type NetworkDecision = { action: 'block'; ruleId: number } | { action: 'allow' };
const ALLOWED_RESOURCE_TYPES = new Set(['script', 'image', 'xmlhttprequest', 'sub_frame', 'media']);

function hostFromDomainFilter(filter: string): string | null {
  return /^\|\|([a-z0-9.-]+)\^$/.exec(filter)?.[1] ?? null;
}

function requestMatchesRule(request: NetworkRequest, rule: NetworkRule): boolean {
  if (request.resourceType === 'main_frame' || !rule.condition.resourceTypes?.includes(request.resourceType)) return false;
  const ruleHost = rule.condition.urlFilter ? hostFromDomainFilter(rule.condition.urlFilter) : null;
  if (!ruleHost) return false;
  try {
    const requestHost = new URL(request.url).hostname.toLowerCase();
    return requestHost === ruleHost || requestHost.endsWith(`.${ruleHost}`);
  } catch {
    return false;
  }
}

export function evaluateRequestAgainstRules(request: NetworkRequest, rules: NetworkRule[]): NetworkDecision {
  const match = rules.find((rule) => rule.action.type === 'block' && requestMatchesRule(request, rule));
  return match ? { action: 'block', ruleId: match.id } : { action: 'allow' };
}

export function validateNetworkRules(rules: NetworkRule[]): string[] {
  const errors: string[] = [];
  const ids = new Set<number>();
  for (const rule of rules) {
    if (!Number.isInteger(rule.id) || rule.id <= 0 || ids.has(rule.id)) errors.push(`Invalid or duplicate rule id: ${rule.id}`);
    ids.add(rule.id);
    if (rule.action.type !== 'block') errors.push(`Rule ${rule.id} is not a block rule`);
    if (!rule.condition.urlFilter || !hostFromDomainFilter(rule.condition.urlFilter)) errors.push(`Rule ${rule.id} has an unsafe URL filter`);
    if (!rule.condition.resourceTypes?.length) errors.push(`Rule ${rule.id} has no resource types`);
    for (const type of rule.condition.resourceTypes ?? []) if (!ALLOWED_RESOURCE_TYPES.has(type)) errors.push(`Rule ${rule.id} has disallowed resource type: ${type}`);
  }
  return errors;
}
