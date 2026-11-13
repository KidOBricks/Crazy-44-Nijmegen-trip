import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { DEFAULT_FIREBASE_CONFIG } from '../firebaseConfig';
import type { FirebaseConfig } from '../types/game';

const STORAGE_KEY = 'crazy44_firebase_config';
const MODE_KEY = 'crazy44_mode';

export function getSavedFirebaseConfig(): FirebaseConfig | null {
  if (DEFAULT_FIREBASE_CONFIG?.projectId && DEFAULT_FIREBASE_CONFIG.apiKey) {
    return DEFAULT_FIREBASE_CONFIG;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FirebaseConfig>;
    if (parsed.apiKey && parsed.projectId && parsed.appId) {
      return parsed as FirebaseConfig;
    }
  } catch {
    // ignore invalid JSON
  }
  return null;
}

export function saveFirebaseConfig(config: FirebaseConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  localStorage.setItem(MODE_KEY, 'firebase');
}

export function clearFirebaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getAppMode(): 'firebase' | 'demo' {
  const saved = localStorage.getItem(MODE_KEY);
  if (saved === 'demo') return 'demo';
  if (getSavedFirebaseConfig()) return 'firebase';
  return 'demo';
}

export function setAppMode(mode: 'firebase' | 'demo'): void {
  localStorage.setItem(MODE_KEY, mode);
}

export interface FirebaseHandles {
  app: FirebaseApp;
  db: Firestore;
  storage: FirebaseStorage;
}

export function getFirebaseHandles(): FirebaseHandles | null {
  const config = getSavedFirebaseConfig();
  if (!config) return null;

  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  return {
    app,
    db: getFirestore(app),
    storage: getStorage(app),
  };
}
