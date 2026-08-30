import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Bookmark as BookmarkIcon } from 'lucide-react';
import { getBookmarks, addBookmark, deleteBookmark } from '../../lib/db';
import { useReaderStore } from '../../stores/reader-store';
import type { Bookmark } from '../../types';
import { formatDate } from '../../lib/utils';

interface BookmarkPanelProps {
  bookId: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (chapter: number, page: number, line: number) => void;
}

export function BookmarkPanel({ bookId, isOpen, onClose, onNavigate }: BookmarkPanelProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const { currentChapter, currentPage, currentLine, pages } = useReaderStore();

  const loadBookmarks = useCallback(async () => {
    if (!bookId) return;
    try {
      const bms = await getBookmarks(bookId);
      setBookmarks(bms.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error('Failed to load bookmarks', err);
    }
  }, [bookId]);

  useEffect(() => {
    if (isOpen) {
      loadBookmarks();
    }
  }, [isOpen, loadBookmarks]);

  const handleAddBookmark = async () => {
    if (!bookId) return;
    const pageData = pages[currentPage];
    const lines = pageData?.lines || [];
    const activeLineText = (currentLine >= 0 && lines[currentLine]) ? lines[currentLine] : lines[0] || 'Trecho marcado';

    const newBm: Bookmark = {
      bookId,
      chapter: currentChapter,
      page: currentPage,
      line: Math.max(0, currentLine),
      excerpt: activeLineText.substring(0, 120),
      note: newNote.trim() || undefined,
      createdAt: Date.now(),
    };

    try {
      await addBookmark(newBm);
      setNewNote('');
      setIsAdding(false);
      await loadBookmarks();
    } catch (err) {
      console.error('Failed to add bookmark', err);
    }
  };

  const handleDelete = async (id?: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (id === undefined) return;
    try {
      await deleteBookmark(id);
      await loadBookmarks();
    } catch (err) {
      console.error('Failed to delete bookmark', err);
    }
  };

  const handleSelectBookmark = (bm: Bookmark) => {
    if (onNavigate) {
      onNavigate(bm.chapter, bm.page, bm.line);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[100]"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-full max-w-sm bg-[var(--color-bg)] border-r border-[var(--color-border)] shadow-2xl z-[101] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <BookmarkIcon className="text-[var(--color-accent)]" size={20} />
                <h2 className="text-lg font-semibold text-[var(--color-text)]">Marcadores</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-[var(--color-border)]">
              {!isAdding ? (
                <button
                  onClick={() => setIsAdding(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] hover:bg-[var(--color-accent)] hover:text-white hover:border-[var(--color-accent)] transition-colors text-sm font-medium"
                >
                  <Plus size={18} /> Marcar Posição Atual
                </button>
              ) : (
                <div className="space-y-3 bg-[var(--color-surface)] p-3 rounded-lg border border-[var(--color-border)]">
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Capítulo {currentChapter + 1} • Pág {currentPage + 1}
                  </p>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Adicionar nota (opcional)..."
                    className="w-full text-xs p-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddBookmark}
                      className="flex-1 py-1.5 bg-[var(--color-accent)] text-white text-xs font-medium rounded hover:opacity-90 transition-opacity"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setIsAdding(false)}
                      className="px-3 py-1.5 bg-[var(--color-bg)] text-[var(--color-text)] text-xs rounded border border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {bookmarks.length === 0 ? (
                <div className="text-center py-12 text-[var(--color-text-secondary)]">
                  <BookmarkIcon size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Nenhum marcador adicionado ainda.</p>
                </div>
              ) : (
                bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    onClick={() => handleSelectBookmark(bm)}
                    className="group p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] transition-all cursor-pointer relative shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-1 pr-6">
                      <span className="text-xs font-semibold text-[var(--color-accent)]">
                        Cap. {bm.chapter + 1} • Pág {bm.page + 1}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-secondary)]">
                        {formatDate(bm.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text)] italic line-clamp-2">
                      "{bm.excerpt}"
                    </p>
                    {bm.note && (
                      <div className="mt-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg)] p-1.5 rounded">
                        Nota: {bm.note}
                      </div>
                    )}
                    <button
                      onClick={(e) => handleDelete(bm.id, e)}
                      className="absolute top-2 right-2 p-1.5 text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10"
                      title="Excluir marcador"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
