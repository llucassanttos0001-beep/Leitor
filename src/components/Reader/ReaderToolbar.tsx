import React from 'react';
import { ArrowLeft, Settings, EyeOff, Eye, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReaderStore } from '../../stores/reader-store';
import { useAppStore } from '../../stores/app-store';

interface ReaderToolbarProps {
  onOpenBookmarks?: () => void;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({ onOpenBookmarks }) => {
  const { zenMode, toggleZenMode, goToLibrary, toggleSidebar } = useAppStore();
  const { chapterTitle, currentChapter, totalChapters } = useReaderStore();

  return (
    <AnimatePresence>
      {!zenMode && (
        <motion.div
          initial={{ y: -64 }}
          animate={{ y: 0 }}
          exit={{ y: -64 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative z-30 h-14 bg-[var(--color-surface)]/90 backdrop-blur-md border-b border-[var(--color-border)] flex items-center justify-between px-4 shrink-0"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={goToLibrary}
              className="p-2 -ml-2 rounded-full hover:bg-[var(--color-bg)] transition-colors"
              title="Voltar à Biblioteca"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-semibold truncate max-w-[180px] sm:max-w-[300px] text-[var(--color-text)]">
                {chapterTitle || 'Lendo...'}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)] truncate max-w-[180px] sm:max-w-[300px]">
                Capítulo {currentChapter + 1} de {totalChapters || '?'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Chapter navigation */}
            <div className="hidden sm:flex items-center gap-1 mr-2">
              <button
                disabled={currentChapter === 0}
                className="p-1.5 rounded-full hover:bg-[var(--color-bg)] disabled:opacity-30 transition-colors text-[var(--color-text)]"
                title="Capítulo anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-medium px-2 text-[var(--color-text-secondary)]">
                {currentChapter + 1} / {totalChapters || '-'}
              </span>
              <button
                disabled={currentChapter >= totalChapters - 1}
                className="p-1.5 rounded-full hover:bg-[var(--color-bg)] disabled:opacity-30 transition-colors text-[var(--color-text)]"
                title="Próximo capítulo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Bookmark button */}
            {onOpenBookmarks && (
              <button
                onClick={onOpenBookmarks}
                className="p-2 rounded-full hover:bg-[var(--color-bg)] transition-colors text-[var(--color-text)]"
                title="Marcadores"
              >
                <Bookmark className="w-5 h-5" />
              </button>
            )}

            {/* Zen Mode */}
            <button
              onClick={toggleZenMode}
              className="p-2 rounded-full hover:bg-[var(--color-bg)] transition-colors"
              title="Modo Zen"
            >
              {zenMode ? (
                <Eye className="w-5 h-5 text-[var(--color-text)]" />
              ) : (
                <EyeOff className="w-5 h-5 text-[var(--color-text)]" />
              )}
            </button>

            {/* Settings */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-[var(--color-bg)] transition-colors"
              title="Configurações"
            >
              <Settings className="w-5 h-5 text-[var(--color-text)]" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
