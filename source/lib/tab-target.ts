export interface TabCandidate {
  id?: number;
  url?: string;
  active?: boolean;
  lastAccessed?: number;
}

export function isSupportedPageUrl(url: string | undefined): boolean {
  return typeof url === 'string' && /^https?:\/\//.test(url);
}

export function selectTargetTab<T extends TabCandidate>(tabs: T[]): T | undefined {
  const activeTab = tabs.find((tab) => tab.active);
  return activeTab && typeof activeTab.id === 'number' && isSupportedPageUrl(activeTab.url) ? activeTab : undefined;
}
