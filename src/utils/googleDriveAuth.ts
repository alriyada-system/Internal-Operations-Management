// Google Drive backup auth using Google Identity Services (no Firebase).
// OPTIONAL: set VITE_GOOGLE_CLIENT_ID (OAuth "Web application" client; add your GitHub Pages origin as an
// authorized JavaScript origin, and enable the Google Drive API). Without it, Drive backup is disabled
// and the JSON export/import in the Database Center still works.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;
let gisPromise: Promise<void> | null = null;
const listeners = new Set<(ok: boolean) => void>();
const notify = () => listeners.forEach((l) => l(!!getValidToken()));

const getValidToken = () => (cachedAccessToken && Date.now() < tokenExpiresAt ? cachedAccessToken : null);

const loadGis = (): Promise<void> => {
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.oauth2) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { gisPromise = null; reject(new Error('تعذّر تحميل خدمة تسجيل الدخول من Google')); };
    document.head.appendChild(s);
  });
  return gisPromise;
};

export const initAuth = (onAuthSuccess?: (user: any, token: string) => void, onAuthFailure?: () => void) => {
  const cb = (ok: boolean) => (ok ? onAuthSuccess?.({}, cachedAccessToken as string) : onAuthFailure?.());
  listeners.add(cb);
  cb(!!getValidToken());
  return () => { listeners.delete(cb); };
};

export const googleSignIn = async (): Promise<{ user: any; accessToken: string } | null> => {
  if (!CLIENT_ID) throw new Error('النسخ إلى Google Drive غير مفعّل: لم يتم ضبط VITE_GOOGLE_CLIENT_ID.');
  await loadGis();
  const google = (window as any).google;
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (resp: any) => {
        if (resp.error || !resp.access_token) return reject(new Error(resp.error_description || resp.error || 'Google sign-in failed'));
        cachedAccessToken = resp.access_token;
        tokenExpiresAt = Date.now() + (Number(resp.expires_in) || 3000) * 1000 - 60_000;
        notify();
        resolve({ user: {}, accessToken: resp.access_token });
      },
      error_callback: (err: any) => reject(Object.assign(new Error(err?.type || 'popup-closed-by-user'), { code: 'auth/popup-closed-by-user' })),
    });
    client.requestAccessToken({ prompt: 'consent' });
  });
};

export const getAccessToken = async (): Promise<string | null> => getValidToken();

export const googleLogout = async () => {
  if (cachedAccessToken && (window as any).google?.accounts?.oauth2) {
    try { (window as any).google.accounts.oauth2.revoke(cachedAccessToken, () => {}); } catch { /* ignore */ }
  }
  cachedAccessToken = null;
  tokenExpiresAt = 0;
  notify();
};
