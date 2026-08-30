import { useEffect } from 'react';
import { ThemeProvider } from './components/Settings/ThemeProvider';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { LibraryView } from './components/Library/LibraryView';
import { ReaderView } from './components/Reader/ReaderView';
import { WelcomeScreen } from './components/Auth/WelcomeScreen';
import { AuthModal } from './components/Auth/AuthModal';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './stores/app-store';
import { useAuthStore } from './stores/auth-store';
import { useAmbientAudio } from './hooks/useAmbientAudio';
import { Loader2 } from 'lucide-react';

function App() {
  const currentView = useAppStore((s) => s.currentView);
  const brightness = useAppStore((s) => s.brightness);
  const colorTemperature = useAppStore((s) => s.colorTemperature);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  const { user, session, loading, initAuth } = useAuthStore();

  // Initialize auth session on mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Initialize ambient audio synthesizer
  useAmbientAudio();

  // Calculate brightness overlay opacity
  const bVal = brightness ?? 100;
  const brightnessOpacity = (100 - bVal) / 100;

  // Calculate color temperature overlay
  const tVal = colorTemperature ?? 6500;
  const tempAlpha = Math.max(0, ((6500 - tVal) / (6500 - 2700)) * 0.35);

  const isAuthenticated = Boolean(user && session);

  return (
    <ThemeProvider>
      <div className="relative w-screen h-screen min-h-[100dvh] flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
            <span className="text-xs text-[var(--color-text-secondary)] font-medium">
              Protegendo e carregando sua biblioteca...
            </span>
          </div>
        ) : !isAuthenticated ? (
          // Auth Guard: Unauthenticated visitors see the secure Welcome/Login screen
          <WelcomeScreen />
        ) : (
          // Authenticated View: Private library & Reader
          <>
            <AnimatePresence mode="wait">
              {currentView === 'library' ? (
                <motion.div
                  key="library"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="w-full h-full"
                >
                  <LibraryView />
                </motion.div>
              ) : (
                <motion.div
                  key="reader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="w-full h-full"
                >
                  <ReaderView />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Brightness Overlay */}
            {brightnessOpacity > 0 && (
              <div
                className="fixed inset-0 z-[90] pointer-events-none"
                style={{ backgroundColor: `rgba(0,0,0,${brightnessOpacity})` }}
              />
            )}

            {/* Color Temperature Overlay */}
            {tempAlpha > 0 && (
              <div
                className="fixed inset-0 z-[89] pointer-events-none"
                style={{
                  backgroundColor: `rgba(255,140,0,${tempAlpha})`,
                  mixBlendMode: 'multiply',
                }}
              />
            )}

            {/* Settings Panel */}
            <SettingsPanel isOpen={sidebarOpen} onClose={toggleSidebar} />

            {/* Supabase User & Cloud Sync Modal */}
            <AuthModal />
          </>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
