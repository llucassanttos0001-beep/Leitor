import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/auth-store';
import { syncEngine } from '../../lib/sync-engine';
import { ArrowRight, Lock } from 'lucide-react';

export function WelcomeScreen() {
  const { loginWithMasterKey } = useAuthStore();
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoCheckedRef = useRef(false);

  // Auto-login via Secret URL Hash (e.g. https://leitor-alpha.vercel.app/#minha-chave)
  useEffect(() => {
    if (autoCheckedRef.current) return;
    autoCheckedRef.current = true;

    const hash = window.location.hash.replace(/^#/, '').trim();
    if (hash) {
      // Immediately wipe secret from browser URL & history
      window.history.replaceState(null, '', window.location.pathname + window.location.search);

      const secret = decodeURIComponent(hash);
      if (secret.length >= 3) {
        setLoading(true);
        loginWithMasterKey(secret).then((res) => {
          setLoading(false);
          if (!res.error) {
            syncEngine.syncAll().catch(() => {});
          }
        });
      }
    }
  }, [loginWithMasterKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || loading) return;

    setLoading(true);
    setError(null);

    const res = await loginWithMasterKey(key);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      syncEngine.syncAll().catch(() => {});
    }
  };

  return (
    <div className="w-screen h-screen min-h-[100dvh] flex items-center justify-center p-6 bg-[var(--color-bg)] text-[var(--color-text)] select-none">
      <div className="w-full max-w-xs space-y-6">
        {/* Subtle, Anonymous Header */}
        <div className="space-y-1 text-center">
          <div className="w-9 h-9 mx-auto rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] mb-3">
            <Lock size={16} />
          </div>
          <h1 className="text-base font-medium tracking-tight text-[var(--color-text)]">
            Leitor
          </h1>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="text-xs text-center text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Minimalist Single-Key Access Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative flex items-center">
            <input
              type="password"
              autoFocus
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Chave de acesso"
              disabled={loading}
              className="w-full text-xs px-3.5 py-2.5 pr-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)]/50 focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />

            <button
              type="submit"
              disabled={loading || !key.trim()}
              className="absolute right-1.5 p-1.5 rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 active:scale-95 disabled:opacity-30 transition-all"
              title="Entrar"
            >
              <ArrowRight size={14} className={loading ? 'animate-pulse' : ''} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
