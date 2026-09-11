import type { ProtectionSettings } from './settings';

export type ExtensionMessage =
  | { type: 'GET_SETTINGS' }
  | { type: 'SET_ENABLED'; enabled: boolean }
  | { type: 'SET_SITE_ALLOWED'; hostname: string; allowed: boolean }
  | { type: 'CLEAR_ALLOWED_HOSTS' }
  | { type: 'GET_PAGE_STATUS' }
  | { type: 'SET_PAGE_FILTERING'; enabled: boolean };
export type SettingsResponse = { ok: true; settings: ProtectionSettings } | { ok: false; error: string };
export interface PageStatusResponse { ok: boolean; hiddenCount: number }

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Record<string, unknown>;
  if (message.type === 'GET_SETTINGS' || message.type === 'GET_PAGE_STATUS' || message.type === 'CLEAR_ALLOWED_HOSTS') return true;
  if (message.type === 'SET_SITE_ALLOWED') return typeof message.hostname === 'string' && typeof message.allowed === 'boolean';
  return (message.type === 'SET_ENABLED' || message.type === 'SET_PAGE_FILTERING') && typeof message.enabled === 'boolean';
}
