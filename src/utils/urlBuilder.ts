import { DEFAULT_FIREBASE_CONFIG } from '../firebaseConfig';
import { getSavedFirebaseConfig, saveFirebaseConfig } from '../services/firebase';
import type { FirebaseConfig } from '../types/game';

function encodeBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64Url(b64: string): string {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function hydrateFirebaseConfigFromQuery(search: string): boolean {
  const params = new URLSearchParams(search);
  const fbParam = params.get('fb');
  if (!fbParam) return false;
  try {
    const parsed = JSON.parse(decodeBase64Url(fbParam)) as Partial<FirebaseConfig>;
    if (parsed.apiKey && parsed.projectId && parsed.appId) {
      saveFirebaseConfig(parsed as FirebaseConfig);
      return true;
    }
  } catch {
    // ignore malformed fb param
  }
  return false;
}

function getBaseAppUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

function getOptionalFbQuery(): string {
  if (DEFAULT_FIREBASE_CONFIG?.projectId) return '';
  const saved = getSavedFirebaseConfig();
  if (!saved) return '';
  return `&fb=${encodeBase64Url(JSON.stringify(saved))}`;
}

export function buildTeamUrl(teamId: string, accessToken: string): string {
  return `${getBaseAppUrl()}#/team/${encodeURIComponent(teamId)}?t=${encodeURIComponent(accessToken)}${getOptionalFbQuery()}`;
}

export function buildAdminUrl(adminToken: string): string {
  return `${getBaseAppUrl()}#/admin?token=${encodeURIComponent(adminToken)}${getOptionalFbQuery()}`;
}
