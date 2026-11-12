import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — see .env.example');
}

export const supabase = createClient(url || 'http://localhost', anonKey || 'missing', {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'riyada-auth' },
});

/** username → internal e-mail (hex-encoded so Arabic / any characters are safe). Must match the Edge Function. */
export const usernameToEmail = (username: string): string => {
  const hex = Array.from(new TextEncoder().encode(username.trim().toLowerCase()))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `u${hex}@riyada-internal.app`;
};
