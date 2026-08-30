import React, { useState } from 'react';
import { useAuthStore } from '../../stores/auth-store';
import { syncEngine } from '../../lib/sync-engine';

export function WelcomeScreen() {
  const { signIn, signUp, continueAsGuest } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (isRegister && password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);

    if (isRegister) {
      const res = await signUp(email, password);
      setLoading(false);
      if (res.error) {
        setError(res.error);
      } else {
        if (useAuthStore.getState().user) {
          syncEngine.syncAll().catch(() => {});
        }
      }
    } else {
      const res = await signIn(email, password);
      setLoading(false);
      if (res.error) {
        setError(res.error);
      } else {
        syncEngine.syncAll().catch(() => {});
      }
    }
  };

  return (
    <div className="w-screen h-screen min-h-[100dvh] flex items-center justify-center p-6 bg-[var(--color-bg)] text-[var(--color-text)] select-none">
      <div className="w-full max-w-xs space-y-6">
        {/* Subtle Brand */}
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
            Leitor
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {isRegister ? 'Crie sua conta' : 'Acesse sua biblioteca'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Minimal Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)]/60 focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          <div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)]/60 focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[var(--color-text)] text-[var(--color-bg)] text-xs font-medium rounded-lg hover:opacity-90 active:scale-98 transition-all disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : isRegister ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>

        {/* Switch mode */}
        <div className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="hover:text-[var(--color-text)] transition-colors"
          >
            {isRegister ? 'Já tenho uma conta' : 'Criar nova conta'}
          </button>

          <button
            type="button"
            onClick={continueAsGuest}
            className="hover:text-[var(--color-text)] transition-colors"
          >
            Acesso local
          </button>
        </div>
      </div>
    </div>
  );
}
