import React, { useMemo } from 'react';
import { useBooks } from '../../hooks/useBooks';
import { useAppStore } from '../../stores/app-store';
import { LibraryHeader } from './LibraryHeader';
import { BookCard } from './BookCard';
import { BookList } from './BookList';
import { UploadZone } from './UploadZone';
import { motion, LayoutGroup } from 'framer-motion';
import { BookOpen } from 'lucide-react';

export const LibraryView: React.FC = () => {
  const { books, loading, addBooks } = useBooks();
  const { viewMode, filterMode, searchQuery, openBook } = useAppStore();

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        !q ||
        book.title.toLowerCase().includes(q) ||
        (book.author && book.author.toLowerCase().includes(q));

      const matchesFilter = filterMode === 'all' || book.status === filterMode;

      return matchesSearch && matchesFilter;
    });
  }, [books, filterMode, searchQuery]);

  const handleOpenBook = (id: string) => {
    openBook(id);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden">
      <LibraryHeader onImportBooks={addBooks} />

      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {books.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center mt-16 gap-6">
              <div className="text-center space-y-3">
                <BookOpen size={64} className="mx-auto text-[var(--color-text-secondary)] opacity-40" />
                <h2 className="text-2xl font-semibold text-[var(--color-text)]">Sua biblioteca está vazia</h2>
                <p className="text-[var(--color-text-secondary)] max-w-md text-sm">
                  Arraste arquivos .epub, .txt ou .pdf aqui para começar sua leitura.
                </p>
              </div>
              <UploadZone onFiles={addBooks} />
            </div>
          ) : (
            <>
              <UploadZone onFiles={addBooks} compact />

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse bg-[var(--color-surface)] rounded-xl aspect-[2/3] w-full border border-[var(--color-border)]"
                    />
                  ))}
                </div>
              ) : filteredBooks.length > 0 ? (
                <LayoutGroup>
                  {viewMode === 'grid' ? (
                    <motion.div
                      layout
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 mt-6"
                    >
                      {filteredBooks.map((book) => (
                        <motion.div
                          layout
                          key={book.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <BookCard book={book} onOpen={handleOpenBook} />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      layout
                      className="flex flex-col rounded-xl overflow-hidden border border-[var(--color-border)] mt-6 shadow-sm"
                    >
                      {filteredBooks.map((book) => (
                        <motion.div layout key={book.id}>
                          <BookList book={book} onOpen={handleOpenBook} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </LayoutGroup>
              ) : (
                <div className="text-center py-20">
                  <p className="text-[var(--color-text-secondary)] text-base">
                    Nenhum livro encontrado para os filtros selecionados.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};
