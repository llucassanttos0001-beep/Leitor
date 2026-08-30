import { useState } from 'react';
import { useAppStore } from '../../stores/app-store';
import { useReaderStore } from '../../stores/reader-store';
import { useReader } from '../../hooks/useReader';
import { useKeyboard } from '../../hooks/useKeyboard';
import { ReaderToolbar } from './ReaderToolbar';
import { ReaderControls } from './ReaderControls';
import { TickerDisplay } from './TickerDisplay';
import { BookmarkPanel } from '../Bookmarks/BookmarkPanel';
import { DictionaryPopup } from '../Dictionary/DictionaryPopup';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export const ReaderView: React.FC = () => {
  const currentBookId = useAppStore((s) => s.currentBookId);
  const goToLibrary = useAppStore((s) => s.goToLibrary);
  const { loading, error, loadChapter } = useReader(currentBookId);
  const setCurrentPage = useReaderStore((s) => s.setCurrentPage);
  const setCurrentLine = useReaderStore((s) => s.setCurrentLine);

  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [dictState, setDictState] = useState<{ word: string; pos: { x: number; y: number } } | null>(null);

  useKeyboard();

  const handleNavigateBookmark = async (chapter: number, page: number, line: number) => {
    await loadChapter(chapter);
    setCurrentPage(page);
    setCurrentLine(line);
  };

  if (!currentBookId) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center space-y-4">
          <p className="text-[var(--color-text-secondary)] text-lg">Nenhum livro selecionado</p>
          <button
            onClick={goToLibrary}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <ArrowLeft size={18} /> Voltar à Biblioteca
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-[var(--color-accent)] animate-spin" />
          <p className="text-[var(--color-text-secondary)] font-medium">Carregando livro...</p>
          <button
            onClick={goToLibrary}
            className="mt-4 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] underline"
          >
            Cancelar e voltar
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--color-bg)] flex-col gap-4 p-8">
        <AlertCircle size={48} className="text-red-500" />
        <p className="text-red-500 font-medium">Erro ao carregar livro</p>
        <p className="text-[var(--color-text-secondary)] text-center max-w-md text-sm">{error}</p>
        <button
          onClick={goToLibrary}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-lg hover:bg-[var(--color-bg)] transition-colors"
        >
          <ArrowLeft size={18} /> Voltar à Biblioteca
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-[var(--color-bg)] overflow-hidden select-none flex flex-col">
      <ReaderToolbar onOpenBookmarks={() => setBookmarksOpen(true)} />
      <div className="flex-1 relative overflow-hidden">
        <TickerDisplay onWordClick={(word, pos) => setDictState({ word, pos })} />
      </div>
      <ReaderControls />

      <BookmarkPanel
        bookId={currentBookId}
        isOpen={bookmarksOpen}
        onClose={() => setBookmarksOpen(false)}
        onNavigate={handleNavigateBookmark}
      />

      {dictState && (
        <DictionaryPopup
          word={dictState.word}
          position={dictState.pos}
          onClose={() => setDictState(null)}
          bookId={currentBookId}
        />
      )}
    </div>
  );
};
