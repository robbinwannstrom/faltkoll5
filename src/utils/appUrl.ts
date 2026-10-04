import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * STANDARDADRESS FÖR QR-KODEN:
 * Om du vill ändra standardadressen direkt i koden ändrar du bara länken här nedanför.
 * Som Huvudadministratör (Rank 4) kan du även ändra adressen direkt inne i appen under
 * "Inställningar" (eller i QR-kodfönstret) utan att behöva röra koden!
 */
export const DEFAULT_APP_URL = 'https://robbinwannstrom.github.io/faltkoll2/';

const CUSTOM_QR_URL_STORAGE_KEY = 'falthjalp_custom_qr_url';

/**
 * Normalizes a user-entered URL so that if they type e.g. "exempel.se/app"
 * it automatically becomes "https://exempel.se/app" for valid QR scanning.
 */
export function normalizeQrUrl(rawUrl: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Returns the saved custom URL override (if any), or empty string if using default.
 */
export function getSavedCustomAppUrl(): string {
  if (typeof window === 'undefined') return '';
  try {
    const direct = localStorage.getItem(CUSTOM_QR_URL_STORAGE_KEY);
    if (direct && direct.trim()) {
      return direct.trim();
    }
    const rawSettings = localStorage.getItem('falthjalp_user_settings');
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      if (parsed?.customDeployUrl?.trim()) {
        return parsed.customDeployUrl.trim();
      }
    }
  } catch {
    // Ignore storage errors
  }
  return '';
}

/**
 * Helper to determine the target application URL for QR codes, sharing, and installation.
 * Priority:
 * 1. Explicit customUrl passed in (e.g. live preview while typing)
 * 2. Saved custom URL set by Huvudadministratör (localStorage / synced from Cloud)
 * 3. Current window URL if hosted on github.io
 * 4. DEFAULT_APP_URL
 */
export function getAppUrl(customUrl?: string): string {
  if (customUrl !== undefined && customUrl.trim()) {
    return normalizeQrUrl(customUrl);
  }

  const savedCustom = getSavedCustomAppUrl();
  if (savedCustom) {
    return normalizeQrUrl(savedCustom);
  }

  if (typeof window !== 'undefined' && window.location) {
    if (window.location.hostname.includes('github.io')) {
      return window.location.href.split('?')[0].split('#')[0];
    }
  }

  return DEFAULT_APP_URL;
}

/**
 * Saves the custom QR code URL locally, to backend (/api/system/settings),
 * and to Firestore (/system/app_config) so all devices get the updated QR code.
 */
export async function saveCustomAppUrl(rawUrl: string): Promise<string> {
  const normalized = normalizeQrUrl(rawUrl);

  if (typeof window !== 'undefined') {
    try {
      if (normalized) {
        localStorage.setItem(CUSTOM_QR_URL_STORAGE_KEY, normalized);
      } else {
        localStorage.removeItem(CUSTOM_QR_URL_STORAGE_KEY);
      }

      const rawSettings = localStorage.getItem('falthjalp_user_settings');
      const parsed = rawSettings ? JSON.parse(rawSettings) : {};
      parsed.customDeployUrl = normalized;
      localStorage.setItem('falthjalp_user_settings', JSON.stringify(parsed));

      window.dispatchEvent(
        new CustomEvent('falthjalp-qr-url-updated', { detail: normalized })
      );
    } catch {
      // Ignore localStorage errors
    }
  }

  // Sync to Express backend
  try {
    await fetch('/api/system/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customDeployUrl: normalized }),
    });
  } catch {
    // Offline fallback
  }

  // Sync to Firestore (/system/app_config)
  if (db) {
    try {
      await setDoc(
        doc(db, 'system', 'app_config'),
        {
          customDeployUrl: normalized,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch {
      // Ignore Firestore error if offline
    }
  }

  return normalized;
}

/**
 * Fetches the global custom QR URL configured by Huvudadministratör from server/Firestore.
 */
export async function syncCustomAppUrlFromCloud(): Promise<string | null> {
  try {
    const res = await fetch('/api/system/settings');
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.customDeployUrl === 'string' && data.customDeployUrl.trim()) {
        const clean = normalizeQrUrl(data.customDeployUrl);
        localStorage.setItem(CUSTOM_QR_URL_STORAGE_KEY, clean);
        window.dispatchEvent(
          new CustomEvent('falthjalp-qr-url-updated', { detail: clean })
        );
        return clean;
      }
    }
  } catch {
    // Ignore
  }

  if (db) {
    try {
      const snap = await getDoc(doc(db, 'system', 'app_config'));
      if (snap.exists()) {
        const data = snap.data();
        if (typeof data?.customDeployUrl === 'string' && data.customDeployUrl.trim()) {
          const clean = normalizeQrUrl(data.customDeployUrl);
          localStorage.setItem(CUSTOM_QR_URL_STORAGE_KEY, clean);
          window.dispatchEvent(
            new CustomEvent('falthjalp-qr-url-updated', { detail: clean })
          );
          return clean;
        }
      }
    } catch {
      // Ignore
    }
  }

  return null;
}
