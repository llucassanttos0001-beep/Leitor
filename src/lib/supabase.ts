import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Default Supabase project credentials (can be overridden via environment variables or runtime storage)
const ENV_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ENV_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Fallback to local storage if user configures in UI
function getStoredCredentials(): { url: string; key: string } {
  try {
    const raw = localStorage.getItem('leitor-supabase-config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.key) {
        return { url: parsed.url, key: parsed.key };
      }
    }
  } catch {
    // Ignore
  }
  return { url: ENV_URL, key: ENV_KEY };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, key } = getStoredCredentials();
  if (!url || !key) return null;

  try {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function setSupabaseCredentials(url: string, key: string): SupabaseClient | null {
  try {
    localStorage.setItem('leitor-supabase-config', JSON.stringify({ url: url.trim(), key: key.trim() }));
    supabaseInstance = createClient(url.trim(), key.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to configure Supabase credentials:', err);
    return null;
  }
}

export function clearSupabaseCredentials(): void {
  localStorage.removeItem('leitor-supabase-config');
  supabaseInstance = null;
}

export const supabase = getSupabaseClient();
