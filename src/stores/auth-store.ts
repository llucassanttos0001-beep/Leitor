import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { authenticateMasterKey } from '../lib/crypto-auth';
import { clearLocalUserData } from '../lib/db';

export type SyncStatus = 'offline' | 'idle' | 'syncing' | 'synced' | 'error';

const SESSION_KEY = 'leitor_active_session_v1';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  authModalOpen: boolean;
  configured: boolean;

  setAuthModalOpen: (open: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (time: number) => void;
  initAuth: () => Promise<void>;
  loginWithMasterKey: (masterKey: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  syncStatus: 'offline',
  lastSyncedAt: null,
  authModalOpen: false,
  configured: isSupabaseConfigured(),

  setAuthModalOpen: (open) => set({ authModalOpen: open }),
  setSyncStatus: (status) => set({ syncStatus: status }),
  setLastSyncedAt: (time) => set({ lastSyncedAt: time }),

  initAuth: async () => {
    // 1. Check for active persistent master session
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const { user, session } = JSON.parse(saved);
        if (user && session) {
          set({
            user,
            session,
            loading: false,
            syncStatus: 'synced',
            lastSyncedAt: Date.now(),
          });
          return;
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }

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
      if (session?.user) {
        set({
          session,
          user: session.user,
          loading: false,
          syncStatus: 'synced',
        });
      } else {
        set({
          session: null,
          user: null,
          loading: false,
          syncStatus: 'offline',
        });
      }
    } catch (err) {
      console.error('Error initializing auth:', err);
      set({ loading: false, syncStatus: 'error' });
    }
  },

  loginWithMasterKey: async (masterKey: string) => {
    set({ syncStatus: 'syncing' });
    const res = await authenticateMasterKey(masterKey);

    if (res.error || !res.session || !res.user) {
      set({ syncStatus: 'error' });
      return { error: res.error || 'Chave de acesso inválida.' };
    }

    // Persist master session
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: res.user, session: res.session }));

    set({
      user: res.user,
      session: res.session,
      syncStatus: 'synced',
      lastSyncedAt: Date.now(),
    });

    return {};
  },

  signOut: async () => {
    localStorage.removeItem(SESSION_KEY);

    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut().catch(() => {});
    }

    // Security: Clear all cached library data from IndexedDB
    try {
      await clearLocalUserData();
    } catch (e) {
      console.warn('Failed to clear local user data on logout:', e);
    }

    set({ user: null, session: null, syncStatus: 'offline' });
  },
}));
