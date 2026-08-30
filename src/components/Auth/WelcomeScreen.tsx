import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, LogIn, UserPlus, CheckCircle, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../stores/auth-store';
import { syncEngine } from '../../lib/sync-engine';

export function WelcomeScreen() {
  const { signIn, signUp, continueAsGuest } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (isRegister && password.length < 6) {
      setFeedback({ type: 'error', message: 'A senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    if (isRegister) {
      const res = await signUp(email, password);
      setLoading(false);
      if (res.error) {
        setFeedback({ type: 'error', message: res.error });
      } else {
        setFeedback({ type: 'success', message: res.message || 'Conta criada com sucesso!' });
        if (useAuthStore.getState().user) {
          syncEngine.syncAll().catch(() => {});
        }
      }
    } else {
      const res = await signIn(email, password);
      setLoading(false);
      if (res.error) {
        setFeedback({ type: 'error', message: res.error });
      } else {
        setFeedback({ type: 'success', message: 'Autenticado com sucesso!' });
        syncEngine.syncAll().catch(() => {});
      }
    }
  };

  return (
    <div className="relative w-screen h-screen min-h-[100dvh] flex items-center justify-center p-4 bg-[var(--color-bg)] text-[var(--color-text)] overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--color-accent)]/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl rounded-3xl p-6 sm:p-8 flex flex-col"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] mb-3 shadow-inner">
            <BookOpen size={28} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">
            Leitor
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-xs mx-auto">
            Plataforma privada de leitura imersiva com animação contínua e sincronização em nuvem.
          </p>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-[11px] text-[var(--color-text-secondary)] mb-6 mx-auto">
          <ShieldCheck size={14} className="text-[var(--color-accent)]" />
          <span>Acesso Privado & Criptografia Ponta a Ponta</span>
        </div>

        {/* Feedback Alert */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`p-3 rounded-xl text-xs flex items-center gap-2 mb-4 ${
                feedback.type === 'success'
                  ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                  : 'bg-red-500/10 text-red-600 border border-red-500/20'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full text-xs p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
              Senha
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white text-xs font-bold rounded-xl hover:opacity-90 active:scale-98 transition-all shadow-md disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : isRegister ? (
              <>
                <UserPlus size={16} /> Criar Minha Conta
              </>
            ) : (
              <>
                <LogIn size={16} /> Entrar na Minha Biblioteca
              </>
            )}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div className="mt-4 pt-4 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-text-secondary)]">
          {isRegister ? (
            <p>
              Já possui uma conta?{' '}
              <button
                onClick={() => {
                  setIsRegister(false);
                  setFeedback(null);
                }}
                className="text-[var(--color-accent)] font-semibold hover:underline"
              >
                Fazer login
              </button>
            </p>
          ) : (
            <p>
              Novo por aqui?{' '}
              <button
                onClick={() => {
                  setIsRegister(true);
                  setFeedback(null);
                }}
                className="text-[var(--color-accent)] font-semibold hover:underline"
              >
                Criar uma conta
              </button>
            </p>
          )}
        </div>

        {/* Guest Mode fallback */}
        <div className="mt-4 text-center">
          <button
            onClick={continueAsGuest}
            className="text-[11px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors inline-flex items-center gap-1"
          >
            <span>Modo Demonstração Offline (Local)</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
