import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

export type SyncStatus = 'offline' | 'idle' | 'syncing' | 'synced' | 'error';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  authModalOpen: boolean;
  configured: boolean;

  setAuthModalOpen: (open: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (time: number) => void;
  initAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  isGuest: false,
  syncStatus: 'offline',
  lastSyncedAt: null,
  authModalOpen: false,
  configured: isSupabaseConfigured(),

  setAuthModalOpen: (open) => set({ authModalOpen: open }),
  setSyncStatus: (status) => set({ syncStatus: status }),
  setLastSyncedAt: (time) => set({ lastSyncedAt: time }),

  initAuth: async () => {
    const client = getSupabaseClient();
    const isConfigured = isSupabaseConfigured();

    if (!client || !isConfigured) {
      set({
        loading: false,
        user: null,
        session: null,
        configured: false,
        syncStatus: 'offline',
      });
      return;
    }

    set({ configured: true, loading: true });

    try {
      const { data: { session } } = await client.auth.getSession();
      set({
        session,
        user: session?.user || null,
        loading: false,
        isGuest: false,
        syncStatus: session ? 'idle' : 'offline',
      });

      // Listen to auth changes
      client.auth.onAuthStateChange((_event, newSession) => {
        set({
          session: newSession,
          user: newSession?.user || null,
          isGuest: false,
          syncStatus: newSession ? 'idle' : 'offline',
        });
      });
    } catch (err) {
      console.error('Error initializing auth:', err);
      set({ loading: false, syncStatus: 'error' });
    }
  },

  signIn: async (email, password) => {
    const client = getSupabaseClient();
    if (!client) {
      return { error: 'Servidor de autenticação indisponível.' };
    }

    try {
      set({ syncStatus: 'syncing' });
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        set({ syncStatus: 'error' });
        return { error: error.message };
      }

      set({
        user: data.user,
        session: data.session,
        isGuest: false,
        syncStatus: 'synced',
        lastSyncedAt: Date.now(),
      });
      return {};
    } catch (err: any) {
      set({ syncStatus: 'error' });
      return { error: err.message || 'Erro ao autenticar.' };
    }
  },

  signUp: async (email, password) => {
    const client = getSupabaseClient();
    if (!client) {
      return { error: 'Servidor de autenticação indisponível.' };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.session) {
        set({
          user: data.user,
          session: data.session,
          isGuest: false,
          syncStatus: 'synced',
          lastSyncedAt: Date.now(),
        });
        return { message: 'Conta criada com sucesso!' };
      }

      return { message: 'Conta criada! Verifique seu e-mail para confirmar o cadastro.' };
    } catch (err: any) {
      return { error: err.message || 'Erro ao criar conta.' };
    }
  },

  signOut: async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut().catch(() => {});
    }
    set({ user: null, session: null, isGuest: false, syncStatus: 'offline' });
  },

  continueAsGuest: () => {
    set({ isGuest: true, user: null, session: null, syncStatus: 'offline' });
  },
}));
