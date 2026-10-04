import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Project, UserSettings } from '../types';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.send',
];

// Initialize Firebase App safely (avoid re-initialization)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Initialize auth listener to keep track of user and in-memory access token.
 */
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

/**
 * Sign in with Google Popup and obtain access token with Drive & Gmail scopes.
 */
export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Kunde inte hämta åtkomsttoken från Google.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err: any) {
    console.error('Google Sign-in error:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current cached access token.
 */
export const getGoogleAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Sign out from Google.
 */
export const signOutFromGoogle = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Save / Backup projects to Google Drive.
 * Creates or updates a JSON backup file in the user's Google Drive.
 */
export const saveProjectsToGoogleDrive = async (
  projects: Project[],
  userSettings?: UserSettings
): Promise<{ fileId: string; name: string }> => {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Du måste ansluta till Google först.');
  }

  const backupData = {
    exportedAt: new Date().toISOString(),
    version: '2.5',
    appName: 'FältKoll',
    user: userSettings?.userName || 'Byggelev',
    company: userSettings?.companyName || 'Anläggningsutbildning',
    totalProjects: projects.length,
    projects: projects,
  };

  const fileName = `Faltkoll_Backup_${new Date().toISOString().substring(0, 10)}.json`;
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: 'Automatisk säkerhetskopia av skolövningar och egenkontroller från FältKoll.',
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(backupData, null, 2) +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData.error?.message || `Kunde inte spara till Google Drive (${res.status}).`
    );
  }

  const result = await res.json();
  return { fileId: result.id, name: result.name };
};

/**
 * List existing FältKoll backup files on Google Drive.
 */
export const listGoogleDriveBackups = async (): Promise<
  Array<{ id: string; name: string; modifiedTime: string; size?: string }>
> => {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Du måste ansluta till Google först.');
  }

  const query = encodeURIComponent("name contains 'Falthjalp_Backup' and trashed = false");
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Kunde inte hämta filer från Google Drive.');
  }

  const data = await res.json();
  return data.files || [];
};

/**
 * Download and parse projects from a Google Drive backup file.
 */
export const restoreProjectsFromGoogleDrive = async (
  fileId: string
): Promise<Project[]> => {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Du måste ansluta till Google först.');
  }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Kunde inte läsa in säkerhetskopian från Google Drive.');
  }

  const data = await res.json();
  if (data && Array.isArray(data.projects)) {
    return data.projects;
  } else if (Array.isArray(data)) {
    return data;
  }
  throw new Error('Ogiltigt filformat för säkerhetskopia.');
};

/**
 * Send an email report via Gmail API.
 * Encodes an RFC 2822 email to base64url string.
 */
export const sendReportViaGmail = async (
  recipientEmail: string,
  subject: string,
  bodyText: string
): Promise<boolean> => {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Du måste ansluta till Google först.');
  }

  // UTF-8 friendly Base64URL encoder
  const utf8ToB64 = (str: string) => {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const rawMessage = [
    `To: ${recipientEmail}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    bodyText,
  ].join('\r\n');

  const base64UrlMessage = utf8ToB64(rawMessage);

  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: base64UrlMessage }),
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Kunde inte skicka e-post via Gmail (${res.status}).`);
  }

  return true;
};
