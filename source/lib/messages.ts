import type { ProtectionSettings } from './settings';

export type ExtensionMessage =
  | { type: 'GET_SETTINGS' }
  | { type: 'SET_ENABLED'; enabled: boolean }
  | { type: 'GET_PAGE_STATUS' }
  | { type: 'SET_PAGE_FILTERING'; enabled: boolean };
export type SettingsResponse = { ok: true; settings: ProtectionSettings } | { ok: false; error: string };
export interface PageStatusResponse { ok: boolean; hiddenCount: number }

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Record<string, unknown>;
  if (message.type === 'GET_SETTINGS' || message.type === 'GET_PAGE_STATUS') return true;
  return (message.type === 'SET_ENABLED' || message.type === 'SET_PAGE_FILTERING') && typeof message.enabled === 'boolean';
}
