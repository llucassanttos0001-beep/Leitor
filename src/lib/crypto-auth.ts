import { getSupabaseClient } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

// Deterministic cryptographic hash using Web Crypto API (Zero-Knowledge)
async function sha256Hex(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function deriveMasterCredentials(masterKey: string) {
  const trimmed = masterKey.trim();
  if (!trimmed) throw new Error('Chave de acesso vazia');

  // Cryptographic deterministic derivation
  const userHash = await sha256Hex(`LEITOR_ID_SALT_V1:${trimmed}`);
  const passHash = await sha256Hex(`LEITOR_PASS_SALT_V1:${trimmed}`);

  const virtualEmail = `u_${userHash.slice(0, 16)}@master.internal`;
  const virtualPassword = `K_${passHash.slice(0, 24)}!9aZ`;

  return { virtualEmail, virtualPassword };
}

export async function authenticateMasterKey(masterKey: string): Promise<{
  user?: User | null;
  session?: Session | null;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { error: 'Servidor de autenticação indisponível.' };
  }

  try {
    const { virtualEmail, virtualPassword } = await deriveMasterCredentials(masterKey);

    // 1. Try to sign in with derived credentials
    const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
      email: virtualEmail,
      password: virtualPassword,
    });

    if (!signInError && signInData.session) {
      return { user: signInData.user, session: signInData.session };
    }

    // 2. If user doesn't exist yet on Supabase (first-time key setup), register the master account
    const { data: signUpData, error: signUpError } = await client.auth.signUp({
      email: virtualEmail,
      password: virtualPassword,
    });

    if (signUpError) {
      return { error: 'Chave de acesso inválida.' };
    }

    if (signUpData.session) {
      return { user: signUpData.user, session: signUpData.session };
    }

    // Fallback: Sign in again after sign up
    const { data: retryData, error: retryError } = await client.auth.signInWithPassword({
      email: virtualEmail,
      password: virtualPassword,
    });

    if (retryError || !retryData.session) {
      return { error: 'Chave de acesso inválida.' };
    }

    return { user: retryData.user, session: retryData.session };
  } catch (err) {
    console.error('Master key authentication error:', err);
    return { error: 'Chave de acesso inválida.' };
  }
}
