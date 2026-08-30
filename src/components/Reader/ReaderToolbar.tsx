import React from 'react';
import { ArrowLeft, Settings, EyeOff, Eye, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReaderStore } from '../../stores/reader-store';
import { useAppStore } from '../../stores/app-store';

interface ReaderToolbarProps {
  onOpenBookmarks?: () => void;
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  onOpenBookmarks,
  onPrevChapter,
  onNextChapter,
}) => {
  const { zenMode, toggleZenMode, goToLibrary, toggleSidebar } = useAppStore();
  const { chapterTitle, currentChapter, totalChapters } = useReaderStore();

  return (
    <AnimatePresence>
      {!zenMode && (
        <motion.div
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -64, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className="relative z-30 h-14 bg-[var(--color-surface)]/95 backdrop-blur-lg border-b border-[var(--color-border)] flex items-center justify-between px-3 sm:px-6 shrink-0"
        >
          {/* Back & Title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={goToLibrary}
              className="p-2 -ml-1 rounded-full hover:bg-[var(--color-bg)] active:scale-95 transition-all"
              title="Voltar à Biblioteca"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-semibold truncate max-w-[150px] sm:max-w-[300px] text-[var(--color-text)]">
                {chapterTitle || 'Leitura'}
              </span>
              <span className="text-[10px] text-[var(--color-text-secondary)] truncate">
                Capítulo {currentChapter + 1} de {totalChapters || 1}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Chapter Steppers */}
            {onPrevChapter && onNextChapter && (
              <div className="flex items-center gap-0.5 bg-[var(--color-bg)] rounded-xl p-0.5 border border-[var(--color-border)]">
                <button
                  onClick={onPrevChapter}
                  disabled={currentChapter === 0}
                  className="p-1 rounded-lg hover:bg-[var(--color-surface)] disabled:opacity-25 transition-colors text-[var(--color-text)]"
                  title="Capítulo anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[10px] font-semibold px-1.5 text-[var(--color-text-secondary)]">
                  {currentChapter + 1}/{totalChapters || 1}
                </span>
                <button
                  onClick={onNextChapter}
                  disabled={currentChapter >= totalChapters - 1}
                  className="p-1 rounded-lg hover:bg-[var(--color-surface)] disabled:opacity-25 transition-colors text-[var(--color-text)]"
                  title="Próximo capítulo"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Bookmark */}
            {onOpenBookmarks && (
              <button
                onClick={onOpenBookmarks}
                className="p-2 rounded-full hover:bg-[var(--color-bg)] transition-colors text-[var(--color-text)]"
                title="Marcadores"
              >
                <Bookmark size={18} />
              </button>
            )}

            {/* Zen Mode */}
            <button
              onClick={toggleZenMode}
              className="p-2 rounded-full hover:bg-[var(--color-bg)] transition-colors text-[var(--color-text)]"
              title={zenMode ? 'Sair do Modo Zen' : 'Modo Foco / Zen'}
            >
              {zenMode ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>

            {/* Settings */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-[var(--color-bg)] transition-colors text-[var(--color-text)]"
              title="Todas as Configurações"
            >
              <Settings size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
