import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cloud, RefreshCw, CheckCircle, AlertCircle, LogOut, ShieldCheck, User } from 'lucide-react';
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
    signOut,
  } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleManualSync = async () => {
    setLoading(true);
    setFeedback(null);
    const res = await syncEngine.syncAll();
    setLoading(false);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Biblioteca e progresso sincronizados com a nuvem!' });
    } else {
      setFeedback({ type: 'error', message: res.message || 'Erro ao sincronizar com a nuvem.' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setAuthModalOpen(false);
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
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl rounded-3xl z-[121] overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                  <div className="flex items-center gap-2">
                    <Cloud className="text-[var(--color-accent)]" size={20} />
                    <Dialog.Title className="text-base font-bold text-[var(--color-text)]">
                      Sincronização em Nuvem
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
                    className={`mx-5 mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                      feedback.type === 'success'
                        ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                        : 'bg-red-500/10 text-red-600 border border-red-500/20'
                    }`}
                  >
                    {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{feedback.message}</span>
                  </div>
                )}

                {/* Content */}
                <div className="p-6 space-y-5">
                  {/* Account badge */}
                  <div className="p-4 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center font-bold">
                        <User size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-[var(--color-text-secondary)]">Conta Conectada</p>
                        <p className="text-sm font-semibold text-[var(--color-text)] truncate max-w-[200px]">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2.5 py-1 rounded-full font-medium shrink-0">
                      <ShieldCheck size={14} /> Ativo
                    </div>
                  </div>

                  {/* Sync status card */}
                  <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--color-text-secondary)]">Status da Nuvem:</span>
                      <span className="font-semibold text-[var(--color-text)]">
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
                      disabled={loading || !user}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white text-xs font-bold rounded-xl hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 shadow-sm"
                    >
                      <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                      {loading ? 'Sincronizando com a Nuvem...' : 'Sincronizar Agora'}
                    </button>
                  </div>

                  {/* Disconnect Button */}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <LogOut size={15} /> Desconectar da Conta
                  </button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
