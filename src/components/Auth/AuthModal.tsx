import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, LogIn, UserPlus, LogOut, Key, Database, Copy, Check } from 'lucide-react';
import { useAuthStore } from '../../stores/auth-store';
import { syncEngine } from '../../lib/sync-engine';
import { formatDate } from '../../lib/utils';

export function AuthModal() {
  const {
    user,
    authModalOpen,
    setAuthModalOpen,
    syncStatus,
    lastSyncedAt,
    supabaseConfigured,
    signIn,
    signUp,
    signOut,
    updateConfig,
    removeConfig,
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState<string>('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setFeedback(null);

    const res = await signIn(email, password);
    setLoading(false);

    if (res.error) {
      setFeedback({ type: 'error', message: res.error });
    } else {
      setFeedback({ type: 'success', message: 'Login realizado com sucesso!' });
      // Trigger sync
      syncEngine.syncAll();
      setTimeout(() => {
        setAuthModalOpen(false);
      }, 1000);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (password.length < 6) {
      setFeedback({ type: 'error', message: 'A senha deve ter no mínimo 6 caracteres.' });
      return;
    }
    setLoading(true);
    setFeedback(null);

    const res = await signUp(email, password);
    setLoading(false);

    if (res.error) {
      setFeedback({ type: 'error', message: res.error });
    } else {
      setFeedback({ type: 'success', message: res.message || 'Conta criada com sucesso!' });
      if (useAuthStore.getState().user) {
        syncEngine.syncAll();
        setTimeout(() => {
          setAuthModalOpen(false);
        }, 1200);
      }
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setFeedback({ type: 'error', message: 'Preencha a URL e a Anon Key do Supabase.' });
      return;
    }

    updateConfig(supabaseUrl.trim(), supabaseKey.trim());
    setFeedback({ type: 'success', message: 'Servidor Supabase configurado com sucesso!' });
    setTimeout(() => {
      setFeedback(null);
      setActiveTab('auth');
    }, 1200);
  };

  const handleManualSync = async () => {
    setLoading(true);
    const res = await syncEngine.syncAll();
    setLoading(false);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Todos os livros e progressos foram sincronizados!' });
    } else {
      setFeedback({ type: 'error', message: res.message || 'Erro ao sincronizar.' });
    }
  };

  const copySqlInstructions = () => {
    const sql = `-- Execute este script no SQL Editor do Supabase para criar as tabelas:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.books (
    id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT DEFAULT 'Autor Desconhecido',
    cover_url TEXT DEFAULT '',
    format TEXT DEFAULT 'epub',
    total_chapters INTEGER DEFAULT 1,
    estimated_pages INTEGER DEFAULT 1,
    status TEXT DEFAULT 'unread',
    date_added BIGINT NOT NULL,
    last_accessed BIGINT NOT NULL,
    collections TEXT[] DEFAULT '{}',
    PRIMARY KEY (user_id, id)
);

CREATE TABLE IF NOT EXISTS public.reading_progress (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL,
    current_chapter INTEGER DEFAULT 0,
    current_page INTEGER DEFAULT 0,
    current_line INTEGER DEFAULT -1,
    overall_percentage DOUBLE PRECISION DEFAULT 0,
    total_reading_time_ms BIGINT DEFAULT 0,
    last_position TEXT DEFAULT '',
    updated_at BIGINT NOT NULL,
    PRIMARY KEY (user_id, book_id)
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL,
    chapter INTEGER DEFAULT 0,
    page INTEGER DEFAULT 0,
    line INTEGER DEFAULT 0,
    excerpt TEXT NOT NULL,
    note TEXT,
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own books" ON public.books FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own progress" ON public.reading_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);
`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <Dialog.Root open={authModalOpen} onOpenChange={setAuthModalOpen}>
      <AnimatePresence>
        {authModalOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[120]"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl rounded-2xl z-[121] overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                  <div className="flex items-center gap-2">
                    <Cloud className="text-[var(--color-accent)]" size={22} />
                    <Dialog.Title className="text-base font-bold text-[var(--color-text)]">
                      Sincronização em Nuvem (Supabase)
                    </Dialog.Title>
                  </div>
                  <Dialog.Close asChild>
                    <button className="p-1.5 rounded-full hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors">
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>

                {/* Feedback Alerts */}
                {feedback && (
                  <div
                    className={`mx-5 mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                      feedback.type === 'success'
                        ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                        : 'bg-red-500/10 text-red-600 border border-red-500/20'
                    }`}
                  >
                    {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{feedback.message}</span>
                  </div>
                )}

                {/* Body Content */}
                <div className="p-5 flex-1 overflow-y-auto">
                  {user ? (
                    // Logged in state
                    <div className="space-y-5">
                      <div className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-between">
                        <div>
                          <p className="text-xs text-[var(--color-text-secondary)]">Conectado como</p>
                          <p className="text-sm font-semibold text-[var(--color-text)] truncate max-w-[220px]">
                            {user.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-500/10 px-2.5 py-1 rounded-full font-medium">
                          <CheckCircle size={14} /> Ativo
                        </div>
                      </div>

                      {/* Sync status card */}
                      <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3 shadow-xs">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[var(--color-text-secondary)]">Status da Nuvem:</span>
                          <span className="font-medium capitalize text-[var(--color-text)]">
                            {syncStatus === 'synced'
                              ? 'Sincronizado'
                              : syncStatus === 'syncing'
                              ? 'Sincronizando...'
                              : syncStatus === 'error'
                              ? 'Erro de Conexão'
                              : 'Pronto'}
                          </span>
                        </div>

                        {lastSyncedAt && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[var(--color-text-secondary)]">Última Sincronização:</span>
                            <span className="text-[var(--color-text-secondary)]">
                              {formatDate(lastSyncedAt)}
                            </span>
                          </div>
                        )}

                        <button
                          onClick={handleManualSync}
                          disabled={loading}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--color-accent)] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity active:scale-98 disabled:opacity-50"
                        >
                          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                          {loading ? 'Sincronizando...' : 'Sincronizar Agora'}
                        </button>
                      </div>

                      {/* Sign Out Button */}
                      <button
                        onClick={signOut}
                        className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-lg text-xs font-medium transition-colors"
                      >
                        <LogOut size={15} /> Desconectar da Conta
                      </button>
                    </div>
                  ) : (
                    // Tabs: Login / Sign Up / Setup
                    <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
                      <Tabs.List className="flex border-b border-[var(--color-border)] mb-5">
                        <Tabs.Trigger
                          value="auth"
                          className="flex-1 pb-2.5 text-xs font-semibold text-[var(--color-text-secondary)] data-[state=active]:text-[var(--color-accent)] data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-accent)] transition-colors"
                        >
                          Entrar / Cadastro
                        </Tabs.Trigger>
                        <Tabs.Trigger
                          value="config"
                          className="flex-1 pb-2.5 text-xs font-semibold text-[var(--color-text-secondary)] data-[state=active]:text-[var(--color-accent)] data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-accent)] transition-colors flex items-center justify-center gap-1"
                        >
                          <Key size={13} /> Servidor Supabase
                        </Tabs.Trigger>
                      </Tabs.List>

                      {/* Login / Register Tab */}
                      <Tabs.Content value="auth" className="space-y-4 outline-none">
                        {!supabaseConfigured && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-300">
                            Configure a URL e a Anon Key do seu projeto Supabase na aba <strong>"Servidor Supabase"</strong> para habilitar a nuvem.
                          </div>
                        )}

                        <form onSubmit={handleSignIn} className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                              E-mail
                            </label>
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="seu@email.com"
                              className="w-full text-xs p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                              Senha
                            </label>
                            <input
                              type="password"
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full text-xs p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              type="submit"
                              disabled={loading || !supabaseConfigured}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[var(--color-accent)] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                              <LogIn size={15} /> Entrar
                            </button>
                            <button
                              type="button"
                              onClick={handleSignUp}
                              disabled={loading || !supabaseConfigured}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-semibold rounded-lg hover:bg-[var(--color-bg)] transition-colors disabled:opacity-50"
                            >
                              <UserPlus size={15} /> Criar Conta
                            </button>
                          </div>
                        </form>
                      </Tabs.Content>

                      {/* Supabase Config Tab */}
                      <Tabs.Content value="config" className="space-y-4 outline-none">
                        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                          Conecte o seu projeto gratuito do <strong>Supabase</strong> para armazenar seus livros e sincronizar o progresso de leitura em tempo real entre seus dispositivos.
                        </p>

                        <form onSubmit={handleSaveConfig} className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                              Project URL
                            </label>
                            <input
                              type="url"
                              required
                              value={supabaseUrl}
                              onChange={(e) => setSupabaseUrl(e.target.value)}
                              placeholder="https://xyzcompany.supabase.co"
                              className="w-full text-xs p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] font-mono text-[11px]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                              Anon / Public Key
                            </label>
                            <input
                              type="password"
                              required
                              value={supabaseKey}
                              onChange={(e) => setSupabaseKey(e.target.value)}
                              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                              className="w-full text-xs p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] font-mono text-[11px]"
                            />
                          </div>

                          <div className="pt-2 flex gap-2">
                            <button
                              type="submit"
                              className="flex-1 py-2.5 bg-[var(--color-accent)] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                            >
                              Salvar Conexão
                            </button>

                            {supabaseConfigured && (
                              <button
                                type="button"
                                onClick={removeConfig}
                                className="px-3 py-2.5 border border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-lg text-xs font-medium transition-colors"
                              >
                                Limpar
                              </button>
                            )}
                          </div>
                        </form>

                        {/* SQL Schema Copy helper */}
                        <div className="pt-3 border-t border-[var(--color-border)]">
                          <button
                            onClick={copySqlInstructions}
                            className="w-full flex items-center justify-center gap-1.5 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
                          >
                            {copiedSql ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            {copiedSql ? 'Script SQL Copiado!' : 'Copiar Script SQL das Tabelas'}
                          </button>
                          <p className="text-[10px] text-[var(--color-text-secondary)] text-center mt-1.5">
                            Copie e cole no <strong>SQL Editor</strong> do painel do Supabase.
                          </p>
                        </div>
                      </Tabs.Content>
                    </Tabs.Root>
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
