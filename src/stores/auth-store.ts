import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, setSupabaseCredentials, clearSupabaseCredentials } from '../lib/supabase';

export type SyncStatus = 'offline' | 'idle' | 'syncing' | 'synced' | 'error';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  authModalOpen: boolean;
  supabaseConfigured: boolean;

  setAuthModalOpen: (open: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (time: number) => void;
  initAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  updateConfig: (url: string, key: string) => void;
  removeConfig: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  syncStatus: 'offline',
  lastSyncedAt: null,
  authModalOpen: false,
  supabaseConfigured: !!getSupabaseClient(),

  setAuthModalOpen: (open) => set({ authModalOpen: open }),
  setSyncStatus: (status) => set({ syncStatus: status }),
  setLastSyncedAt: (time) => set({ lastSyncedAt: time }),

  initAuth: async () => {
    const client = getSupabaseClient();
    if (!client) {
      set({ loading: false, user: null, session: null, supabaseConfigured: false, syncStatus: 'offline' });
      return;
    }

    set({ supabaseConfigured: true, loading: true });

    try {
      const { data: { session } } = await client.auth.getSession();
      set({
        session,
        user: session?.user || null,
        loading: false,
        syncStatus: session ? 'idle' : 'offline',
      });

      // Listen to auth changes
      client.auth.onAuthStateChange((_event, newSession) => {
        set({
          session: newSession,
          user: newSession?.user || null,
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
      return { error: 'Servidor Supabase não configurado. Adicione a URL e a Anon Key.' };
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
        syncStatus: 'synced',
        lastSyncedAt: Date.now(),
      });
      return {};
    } catch (err: any) {
      set({ syncStatus: 'error' });
      return { error: err.message || 'Erro ao conectar com o servidor.' };
    }
  },

  signUp: async (email, password) => {
    const client = getSupabaseClient();
    if (!client) {
      return { error: 'Servidor Supabase não configurado. Adicione a URL e a Anon Key.' };
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
    set({ user: null, session: null, syncStatus: 'offline' });
  },

  updateConfig: (url, key) => {
    const client = setSupabaseCredentials(url, key);
    if (client) {
      set({ supabaseConfigured: true });
      get().initAuth();
    }
  },

  removeConfig: () => {
    clearSupabaseCredentials();
    set({ supabaseConfigured: false, user: null, session: null, syncStatus: 'offline' });
  },
}));
