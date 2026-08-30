import React from 'react';
import type { Book } from '../../types';
import { motion } from 'framer-motion';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { Edit2, RefreshCw, Trash2, Download, BookOpen, Clock } from 'lucide-react';
import { useBooks } from '../../hooks/useBooks';
import { db, saveProgress, getProgress, getBookmarks } from '../../lib/db';
import { formatDate } from '../../lib/utils';

interface BookCardProps {
  book: Book;
  onOpen: (id: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onOpen }) => {
  const { deleteBook, refreshBooks, updateStatus } = useBooks();

  const statusColor =
    book.status === 'reading'
      ? 'bg-green-500'
      : book.status === 'completed'
      ? 'bg-blue-500'
      : 'bg-gray-400';
  const statusLabel =
    book.status === 'reading'
      ? 'Lendo'
      : book.status === 'completed'
      ? 'Concluído'
      : 'Não Lido';

  const isRecent = Date.now() - book.lastAccessed < 1000 * 60 * 60 * 24 && book.status === 'reading';

  const handleRename = async (e: Event) => {
    e.stopPropagation();
    const newTitle = prompt('Novo título do livro:', book.title);
    if (newTitle && newTitle.trim()) {
      await db.books.update(book.id, { title: newTitle.trim() });
      await refreshBooks();
    }
  };

  const handleResetProgress = async (e: Event) => {
    e.stopPropagation();
    if (confirm(`Deseja resetar o progresso de leitura de "${book.title}"?`)) {
      await saveProgress(book.id, {
        currentChapter: 0,
        currentPage: 0,
        currentLine: -1,
        overallPercentage: 0,
        totalReadingTimeMs: 0,
        lastPosition: '',
        updatedAt: Date.now(),
      });
      await updateStatus(book.id, 'unread');
    }
  };

  const handleExportProgress = async (e: Event) => {
    e.stopPropagation();
    const progress = await getProgress(book.id);
    const bookmarks = await getBookmarks(book.id);
    const data = {
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        format: book.format,
      },
      progress,
      bookmarks,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progresso-${book.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (e: Event) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja excluir "${book.title}" da sua biblioteca?`)) {
      await deleteBook(book.id);
    }
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <motion.div
          whileHover={{ scale: 1.03, y: -4 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative flex flex-col cursor-pointer rounded-xl overflow-hidden shadow-md bg-[var(--color-surface)] border border-[var(--color-border)] h-full group"
          onClick={() => onOpen(book.id)}
        >
          {/* Cover image */}
          <div className="relative aspect-[2/3] bg-[var(--color-bg)] w-full overflow-hidden">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
            ) : (
              <div className="flex items-center justify-center w-full h-full p-4 text-center bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/5">
                <BookOpen size={40} className="text-[var(--color-accent)] opacity-50" />
              </div>
            )}

            {/* Retomar Leitura Badge */}
            {isRecent && (
              <div className="absolute top-2 left-2 bg-[var(--color-accent)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 backdrop-blur-sm">
                <Clock size={10} /> Retomar
              </div>
            )}

            {/* Status dot */}
            <div
              className={`absolute top-2 right-2 w-3 h-3 rounded-full ${statusColor} shadow-sm border-2 border-white/80`}
              title={statusLabel}
            />
          </div>

          {/* Info */}
          <div className="p-3 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-[var(--color-text)] line-clamp-2 leading-tight mb-1 text-sm">
                {book.title}
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] truncate">
                {book.author || 'Autor desconhecido'}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[10px] text-[var(--color-text-secondary)]">
              <span className="uppercase font-semibold tracking-wider">{book.format}</span>
              <span>{formatDate(book.lastAccessed)}</span>
            </div>
          </div>
        </motion.div>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="min-w-[200px] bg-[var(--color-surface)] rounded-lg p-1.5 shadow-2xl border border-[var(--color-border)] z-[200]">
          <ContextMenu.Item
            onSelect={handleRename}
            className="flex items-center px-3 py-2 text-xs text-[var(--color-text)] cursor-pointer hover:bg-[var(--color-bg)] rounded outline-none select-none transition-colors"
          >
            <Edit2 size={14} className="mr-2 text-[var(--color-text-secondary)]" /> Renomear
          </ContextMenu.Item>
          <ContextMenu.Item
            onSelect={handleExportProgress}
            className="flex items-center px-3 py-2 text-xs text-[var(--color-text)] cursor-pointer hover:bg-[var(--color-bg)] rounded outline-none select-none transition-colors"
          >
            <Download size={14} className="mr-2 text-[var(--color-text-secondary)]" /> Exportar Progresso
          </ContextMenu.Item>
          <ContextMenu.Item
            onSelect={handleResetProgress}
            className="flex items-center px-3 py-2 text-xs text-[var(--color-text)] cursor-pointer hover:bg-[var(--color-bg)] rounded outline-none select-none transition-colors"
          >
            <RefreshCw size={14} className="mr-2 text-[var(--color-text-secondary)]" /> Resetar Progresso
          </ContextMenu.Item>
          <ContextMenu.Separator className="h-px bg-[var(--color-border)] my-1" />
          <ContextMenu.Item
            onSelect={handleDelete}
            className="flex items-center px-3 py-2 text-xs text-red-500 cursor-pointer hover:bg-red-500/10 rounded outline-none select-none transition-colors"
          >
            <Trash2 size={14} className="mr-2" /> Excluir
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};
