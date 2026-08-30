import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useReaderStore } from '../stores/reader-store';
import { useAppStore } from '../stores/app-store';
import { getBook, saveProgress, getProgress, updateBookStatus } from '../lib/db';
import { TextEngine } from '../lib/text-engine';
import type { Book, ChapterInfo } from '../types';

export function useReader(bookId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [book, setBook] = useState<Book | null>(null);

  const epubRef = useRef<any>(null);
  const chaptersRef = useRef<ChapterInfo[]>([]);
  const txtDataRef = useRef<Map<number, string>>(new Map());
  const mountedRef = useRef(true);
  const loadedBookIdRef = useRef<string | null>(null);

  const fontSize = useAppStore((s) => s.fontSize);
  const fontFamily = useAppStore((s) => s.fontFamily);
  const lineHeight = useAppStore((s) => s.lineHeight);
  const wordSpacing = useAppStore((s) => s.wordSpacing);
  const marginHorizontal = useAppStore((s) => s.marginHorizontal);

  const readerStore = useReaderStore;

  // Build a text engine once, update config as needed
  const textEngine = useMemo(() => {
    try {
      return new TextEngine({
        containerWidth: window.innerWidth,
        containerHeight: Math.max(300, window.innerHeight - 160),
        fontSize,
        lineHeight,
        wordSpacing,
        fontFamily,
        marginHorizontal,
      });
    } catch {
      return null;
    }
  }, [fontSize, fontFamily, lineHeight, wordSpacing, marginHorizontal]);

  const paginateText = useCallback((text: string) => {
    if (textEngine) {
      textEngine.updateConfig({
        containerWidth: window.innerWidth,
        containerHeight: Math.max(300, window.innerHeight - 160),
      });
      return textEngine.paginateText(text);
    }
    // Fallback
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    const pages = [];
    const lpp = 20;
    for (let i = 0; i < lines.length; i += lpp) {
      pages.push({
        pageIndex: pages.length,
        lines: lines.slice(i, i + lpp).map((l, idx) => ({
          lineIndex: idx,
          text: l,
          words: l.split(' '),
        })),
      });
    }
    return pages;
  }, [textEngine]);

  const loadChapter = useCallback(async (index: number) => {
    const chapters = chaptersRef.current;
    if (!chapters[index]) return;

    const chapterMeta = chapters[index];
    let text = '';

    // TXT book
    if (txtDataRef.current.has(index)) {
      text = txtDataRef.current.get(index) || '';
    }
    // EPUB book
    else if (epubRef.current) {
      const epub = epubRef.current;
      const spine = epub.spine as any;
      let spineItem: any = null;

      if (spine?.get) {
        spineItem = spine.get(chapterMeta.href);
      }
      if (!spineItem && spine?.items) {
        spineItem = spine.items.find(
          (item: any) => item.href === chapterMeta.href || item.url === chapterMeta.href
        );
      }

      if (spineItem) {
        try {
          await spineItem.load(epub.load.bind(epub));
          const el = spineItem.document?.body;
          text = el?.textContent || el?.innerText || '';
        } catch {
          text = `Capítulo ${index + 1}: ${chapterMeta.title}\n\nConteúdo não disponível.`;
        }
      } else {
        text = `Capítulo ${index + 1}: ${chapterMeta.title}\n\nConteúdo não disponível.`;
      }
    }

    if (!text.trim()) {
      text = `Capítulo ${index + 1}\n\nConteúdo vazio.`;
    }

    const paginated = paginateText(text);
    const storePages = paginated.map((p, idx) => ({
      lines: p.lines.map((l) => l.text),
      pageNumber: idx,
    }));

    if (!mountedRef.current) return;

    readerStore.getState().setChapter(index, chapterMeta.title, text, storePages);

    const totalCh = chapters.length || 1;
    const pct = Math.min(100, Math.round(((index + 0.5) / totalCh) * 100));
    readerStore.getState().setOverallPercentage(pct);

    if (bookId) {
      updateBookStatus(bookId, 'reading').catch(() => {});
    }
  }, [bookId, paginateText, readerStore]);

  // Main load effect — runs once per bookId
  useEffect(() => {
    if (!bookId) return;
    if (loadedBookIdRef.current === bookId) return; // prevent re-load

    mountedRef.current = true;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      txtDataRef.current.clear();
      chaptersRef.current = [];
      readerStore.getState().reset();

      try {
        const bookData = await getBook(bookId);
        if (cancelled) return;
        if (!bookData) throw new Error('Livro não encontrado no banco de dados.');
        setBook(bookData);

        let chapterList: ChapterInfo[] = [];

        if (bookData.format === 'txt') {
          // ---- TXT ----
          const decoder = new TextDecoder('utf-8');
          const textContent = decoder.decode(bookData.fileData);
          const rawChapters = textContent.split(/(?=Capítulo\s+\d+|Chapter\s+\d+)/i);

          if (rawChapters.length > 1) {
            rawChapters.forEach((chText, idx) => {
              const firstLine = chText.trim().split('\n')[0] || `Capítulo ${idx + 1}`;
              chapterList.push({ href: `ch-${idx}`, title: firstLine.substring(0, 40), index: idx });
              txtDataRef.current.set(idx, chText.trim());
            });
          } else {
            chapterList = [{ href: 'ch-0', title: bookData.title, index: 0 }];
            txtDataRef.current.set(0, textContent.trim());
          }
        } else {
          // ---- EPUB ----
          const ePubModule = await import('epubjs');
          const ePub = (ePubModule.default || ePubModule) as any;

          if (cancelled) return;
          const epub = ePub(bookData.fileData);
          epubRef.current = epub;
          await epub.ready;

          if (cancelled) { epub.destroy(); return; }

          try {
            const navigation = await epub.loaded.navigation;
            if (navigation?.toc?.length > 0) {
              chapterList = navigation.toc.map((navItem: any, idx: number) => ({
                href: navItem.href,
                title: navItem.label?.trim() || `Capítulo ${idx + 1}`,
                index: idx,
              }));
            }
          } catch { /* fallback below */ }

          if (chapterList.length === 0) {
            const spine = epub.spine as any;
            if (spine?.items?.length > 0) {
              chapterList = spine.items.map((item: any, idx: number) => ({
                href: item.href || item.url || '',
                title: `Capítulo ${idx + 1}`,
                index: idx,
              }));
            }
          }

          if (chapterList.length === 0) {
            chapterList = [{ href: '', title: 'Conteúdo', index: 0 }];
          }
        }

        if (cancelled) return;

        chaptersRef.current = chapterList;
        readerStore.getState().setTotalChapters(chapterList.length);

        // Restore progress or load first chapter
        const progress = await getProgress(bookId);
        if (cancelled) return;

        if (progress && progress.currentChapter < chapterList.length) {
          await loadChapter(progress.currentChapter);
          if (!cancelled) {
            readerStore.getState().setCurrentPage(progress.currentPage || 0);
            readerStore.getState().setCurrentLine(progress.currentLine ?? -1);
          }
        } else {
          await loadChapter(0);
        }

        if (!cancelled) {
          loadedBookIdRef.current = bookId;
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Falha ao carregar o livro.');
          console.error('useReader load error:', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      try { epubRef.current?.destroy?.(); } catch {}
      epubRef.current = null;
      loadedBookIdRef.current = null;
    };
  // loadChapter uses refs so it's stable enough — only re-run when bookId changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  // Auto-save progress
  useEffect(() => {
    if (!bookId) return;
    const interval = setInterval(() => {
      const state = readerStore.getState();
      saveProgress(bookId, {
        currentChapter: state.currentChapter,
        currentPage: state.currentPage,
        currentLine: state.currentLine,
        overallPercentage: state.overallPercentage,
        totalReadingTimeMs: 0,
        lastPosition: JSON.stringify({
          chapter: state.currentChapter,
          page: state.currentPage,
          line: state.currentLine,
        }),
        updatedAt: Date.now(),
      }).catch(() => {});
    }, 8000);
    return () => clearInterval(interval);
  }, [bookId, readerStore]);

  return { loading, error, book, loadChapter };
}
