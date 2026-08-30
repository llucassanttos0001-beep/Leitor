import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReaderStore } from '../../stores/reader-store';
import { useAppStore } from '../../stores/app-store';

interface ReaderControlsProps {
  onOpenQuickSettings?: () => void;
}

export const ReaderControls: React.FC<ReaderControlsProps> = ({ onOpenQuickSettings }) => {
  const { zenMode } = useAppStore();
  const {
    isPlaying,
    togglePlayPause,
    currentPage,
    totalPages,
    overallPercentage,
    prevPage,
    nextPage,
  } = useReaderStore();

  return (
    <AnimatePresence>
      {!zenMode && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className="relative z-30 bg-[var(--color-surface)]/95 backdrop-blur-lg border-t border-[var(--color-border)] px-4 py-2.5 shrink-0 safe-bottom"
        >
          {/* Top Progress bar line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-border)]">
            <div
              className="h-full bg-[var(--color-accent)] transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, overallPercentage))}%` }}
            />
          </div>

          <div className="max-w-xl mx-auto w-full flex items-center justify-between gap-3">
            {/* Quick Appearance (Aa) button */}
            {onOpenQuickSettings && (
              <button
                onClick={onOpenQuickSettings}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors text-xs font-semibold shrink-0"
                title="Ajustes de Leitura e Tipografia"
              >
                <Type size={15} className="text-[var(--color-accent)]" />
                <span>Aa</span>
              </button>
            )}

            {/* Playback & Page Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                className="p-2 rounded-full hover:bg-[var(--color-bg)] active:scale-95 disabled:opacity-30 transition-all text-[var(--color-text)]"
                title="Página anterior"
              >
                <SkipBack size={18} />
              </button>

              <button
                onClick={togglePlayPause}
                className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center bg-[var(--color-accent)] hover:opacity-95 text-white rounded-full shadow-lg transition-all active:scale-95"
                title={isPlaying ? 'Pausar leitura' : 'Iniciar leitura em cascata'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={nextPage}
                disabled={currentPage >= totalPages - 1}
                className="p-2 rounded-full hover:bg-[var(--color-bg)] active:scale-95 disabled:opacity-30 transition-all text-[var(--color-text)]"
                title="Próxima página"
              >
                <SkipForward size={18} />
              </button>
            </div>

            {/* Page & Progress Info */}
            <div className="flex flex-col items-end text-right min-w-[75px] shrink-0">
              <span className="text-[11px] font-semibold text-[var(--color-text)]">
                Pág. {currentPage + 1}/{totalPages || 1}
              </span>
              <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">
                {Math.round(overallPercentage)}% lido
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
