import { useState, useEffect, useCallback } from 'react';
import { saveBook as dbSaveBook, getAllBooks, deleteBook as dbDeleteBook, updateBookStatus } from '../lib/db';
import { generateCover } from '../lib/cover-generator';
import { hashArrayBuffer, generateId } from '../lib/utils';
import { createDemoBooks } from '../lib/sample-books';
import type { Book } from '../types';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshBooks = useCallback(async () => {
    try {
      setLoading(true);
      let allBooks = await getAllBooks();

      // If database is completely empty on initial run, populate with sample books
      if (!allBooks || allBooks.length === 0) {
        try {
          const demoBooks = await createDemoBooks();
          for (const b of demoBooks) {
            await dbSaveBook(b);
          }
          allBooks = await getAllBooks();
        } catch (e) {
          console.warn('Demo books seeding warning:', e);
        }
      }

      setBooks((allBooks || []).sort((a, b) => b.lastAccessed - a.lastAccessed));
    } catch (err) {
      console.error('Failed to load books:', err);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBooks();
  }, [refreshBooks]);

  const addBooks = async (files: File[]) => {
    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        const fileHash = await hashArrayBuffer(buffer);

        let title = file.name.replace(/\.[^/.]+$/, '');
        let author = 'Autor Desconhecido';
        let coverUrl = '';
        let totalChapters = 1;

        if (file.name.endsWith('.epub')) {
          try {
            const ePubModule = await import('epubjs');
            const ePub = (ePubModule.default || ePubModule) as any;
            const book = ePub(buffer);
            await book.ready;
            const metadata = await book.loaded.metadata;

            title = metadata.title || title;
            author = metadata.creator || author;

            // Extract cover
            try {
              const coverUrlStr = await book.coverUrl();
              if (coverUrlStr) {
                const response = await fetch(coverUrlStr);
                const blob = await response.blob();
                const reader = new FileReader();
                coverUrl = await new Promise<string>((resolve) => {
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(blob);
                });
              }
            } catch {
              // Cover extraction fallback
            }

            // Count chapters
            try {
              const nav = await book.loaded.navigation;
              if (nav && nav.toc) {
                totalChapters = Math.max(1, nav.toc.length);
              }
            } catch {
              // Navigation fallback
            }

            book.destroy();
          } catch (err) {
            console.warn('Failed to parse epub metadata:', err);
          }
        }

        // Generate cover if none found
        if (!coverUrl) {
          coverUrl = generateCover(title, author);
        }

        const newBook: Book = {
          id: generateId(),
          title,
          author,
          genre: '',
          tags: [],
          coverUrl,
          fileHash,
          fileData: buffer,
          format: file.name.endsWith('.epub') ? 'epub' : file.name.endsWith('.pdf') ? 'pdf' : 'txt',
          totalChapters,
          estimatedPages: Math.max(1, Math.ceil(buffer.byteLength / 2000)),
          status: 'unread',
          dateAdded: Date.now(),
          lastAccessed: Date.now(),
          collections: [],
        };

        await dbSaveBook(newBook);
      } catch (err) {
        console.error(`Failed to process book ${file.name}:`, err);
      }
    }
    await refreshBooks();
  };

  const deleteBook = async (id: string) => {
    try {
      await dbDeleteBook(id);
      await refreshBooks();
    } catch (err) {
      console.error('Failed to delete book:', err);
    }
  };

  const updateStatus = async (id: string, status: Book['status']) => {
    try {
      await updateBookStatus(id, status);
      await refreshBooks();
    } catch (err) {
      console.error('Failed to update book status:', err);
    }
  };

  return { books, loading, addBooks, deleteBook, updateStatus, refreshBooks };
}
