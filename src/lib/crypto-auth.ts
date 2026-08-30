import { getSupabaseClient } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

// Deterministic cryptographic hash using Web Crypto API (Zero-Knowledge)
export async function sha256Hex(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

const VAULT_KEY = 'leitor_master_vault_v1';
const SALT = 'LEITOR_SECURE_VAULT_SALT_2026';

export async function authenticateMasterKey(masterKey: string): Promise<{
  user?: User | null;
  session?: Session | null;
  error?: string;
}> {
  const trimmed = masterKey.trim();
  if (!trimmed || trimmed.length < 4) {
    return { error: 'A chave deve ter no mínimo 4 caracteres.' };
  }

  try {
    const keyHash = await sha256Hex(`${SALT}:${trimmed}`);
    const storedVault = localStorage.getItem(VAULT_KEY);

    // 1. If vault does not exist on this device yet, initialize this as the authorized master key
    if (!storedVault) {
      localStorage.setItem(VAULT_KEY, JSON.stringify({ hash: keyHash, initializedAt: Date.now() }));
    } else {
      // 2. Validate against the master vault
      try {
        const parsed = JSON.parse(storedVault);
        if (parsed.hash && parsed.hash !== keyHash) {
          return { error: 'Chave de acesso incorreta.' };
        }
      } catch {
        localStorage.setItem(VAULT_KEY, JSON.stringify({ hash: keyHash, initializedAt: Date.now() }));
      }
    }

    // 3. Create active session object for state management & RLS
    const virtualUserId = (await sha256Hex(`USER_ID:${trimmed}`)).slice(0, 32);
    const virtualUser: User = {
      id: virtualUserId,
      app_metadata: { provider: 'master_key' },
      user_metadata: { role: 'master' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'master@leitor.local',
    } as any;

    const virtualSession: Session = {
      access_token: `token_${keyHash.slice(0, 32)}`,
      token_type: 'bearer',
      expires_in: 315360000,
      refresh_token: `refresh_${keyHash.slice(0, 32)}`,
      user: virtualUser,
    } as any;

    // 4. Try background sync with Supabase in parallel
    const client = getSupabaseClient();
    if (client) {
      const virtualEmail = `u_${keyHash.slice(0, 16)}@gmail.com`;
      const virtualPassword = `K_${keyHash.slice(0, 24)}!9aZ`;

      client.auth.signInWithPassword({ email: virtualEmail, password: virtualPassword }).catch(() => {
        // Silently handled in background without blocking user UI
      });
    }

    return { user: virtualUser, session: virtualSession };
  } catch (err) {
    console.error('Master key authentication error:', err);
    return { error: 'Erro ao autenticar chave de acesso.' };
  }
}
