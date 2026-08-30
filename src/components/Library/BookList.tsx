import React from 'react';
import type { Book } from '../../types';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { Edit2, RefreshCw, Trash2, Download, BookOpen } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { useBooks } from '../../hooks/useBooks';
import { db, saveProgress, getProgress, getBookmarks } from '../../lib/db';

interface BookListProps {
  book: Book;
  onOpen: (id: string) => void;
}

export const BookList: React.FC<BookListProps> = ({ book, onOpen }) => {
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
        <div
          onClick={() => onOpen(book.id)}
          className="flex items-center p-3 cursor-pointer bg-[var(--color-surface)] hover:bg-[var(--color-bg)] border-b border-[var(--color-border)] transition-colors group"
        >
          <div className="relative w-[50px] h-[75px] flex-shrink-0 bg-[var(--color-bg)] rounded overflow-hidden mr-4 shadow-sm">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <BookOpen size={20} className="text-[var(--color-text-secondary)] opacity-40" />
              </div>
            )}
            <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${statusColor} shadow-sm`} />
          </div>

          <div className="flex-1 min-w-0 mr-4">
            <h3 className="font-semibold text-sm text-[var(--color-text)] truncate">{book.title}</h3>
            <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">
              {book.author || 'Autor desconhecido'}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  book.status === 'reading'
                    ? 'bg-green-500/10 text-green-600'
                    : book.status === 'completed'
                    ? 'bg-blue-500/10 text-blue-600'
                    : 'bg-gray-500/10 text-gray-500'
                }`}
              >
                {statusLabel}
              </span>
              <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-semibold">
                {book.format}
              </span>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end min-w-[100px]">
            <div className="text-xs text-[var(--color-text-secondary)]">
              {formatDate(book.lastAccessed)}
            </div>
          </div>
        </div>
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
