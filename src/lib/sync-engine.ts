import { getSupabaseClient } from './supabase';
import { db, getAllBooks, saveBook, getProgress, saveProgress, getBookmarks, addBookmark } from './db';
import { useAuthStore } from '../stores/auth-store';
import { useAppStore } from '../stores/app-store';
import type { Book, Bookmark } from '../types';

export class SyncEngine {
  private isSyncing = false;

  public async syncAll(): Promise<{ success: boolean; message?: string }> {
    const client = getSupabaseClient();
    const user = useAuthStore.getState().user;

    if (!client || !user) {
      useAuthStore.getState().setSyncStatus('offline');
      return { success: false, message: 'Usuário não autenticado no Supabase' };
    }

    if (this.isSyncing) {
      return { success: true, message: 'Sincronização já em andamento' };
    }

    try {
      this.isSyncing = true;
      useAuthStore.getState().setSyncStatus('syncing');

      // 1. Sync User Settings
      await this.syncSettings(client, user.id);

      // 2. Sync Books Metadata
      await this.syncBooks(client, user.id);

      // 3. Sync Reading Progress
      await this.syncReadingProgress(client, user.id);

      // 4. Sync Bookmarks
      await this.syncBookmarks(client, user.id);

      useAuthStore.getState().setSyncStatus('synced');
      useAuthStore.getState().setLastSyncedAt(Date.now());
      return { success: true };
    } catch (err: any) {
      console.error('Cloud Sync failed:', err);
      useAuthStore.getState().setSyncStatus('error');
      return { success: false, message: err.message || 'Erro durante sincronização' };
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncSettings(client: any, userId: string): Promise<void> {
    try {
      // Get remote settings
      const { data, error } = await client
        .from('user_settings')
        .select('settings, updated_at')
        .eq('user_id', userId)
        .single();

      const appStore = useAppStore.getState();
      const localSettings = {
        theme: appStore.theme,
        fontSize: appStore.fontSize,
        fontFamily: appStore.fontFamily,
        lineHeight: appStore.lineHeight,
        wordSpacing: appStore.wordSpacing,
        marginHorizontal: appStore.marginHorizontal,
        tickerSpeed: appStore.tickerSpeed,
        pagePauseDuration: appStore.pagePauseDuration,
        fadePastLines: appStore.fadePastLines,
      };

      if (!data || error) {
        // Push local settings to cloud
        await client.from('user_settings').upsert({
          user_id: userId,
          settings: localSettings,
          updated_at: new Date().toISOString(),
        });
      } else if (data?.settings) {
        // Apply remote settings locally
        const s = data.settings;
        if (s.theme) appStore.setTheme(s.theme);
        if (s.fontSize) appStore.setFontSize(s.fontSize);
        if (s.fontFamily) appStore.setFontFamily(s.fontFamily);
        if (s.lineHeight) appStore.setLineHeight(s.lineHeight);
        if (s.wordSpacing !== undefined) appStore.setWordSpacing(s.wordSpacing);
        if (s.marginHorizontal !== undefined) appStore.setMarginHorizontal(s.marginHorizontal);
        if (s.tickerSpeed) appStore.setTickerSpeed(s.tickerSpeed);
        if (s.pagePauseDuration) appStore.setPagePauseDuration(s.pagePauseDuration);
      }
    } catch (err) {
      console.warn('Sync settings error:', err);
    }
  }

  private async syncBooks(client: any, userId: string): Promise<void> {
    try {
      // Get remote books
      const { data: remoteBooks, error } = await client
        .from('books')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const localBooks = await getAllBooks();
      const localBookMap = new Map(localBooks.map((b) => [b.id, b]));
      const remoteBookMap = new Map((remoteBooks || []).map((b: any) => [b.id, b]));

      // Upload local books not in cloud
      for (const localBook of localBooks) {
        if (!remoteBookMap.has(localBook.id)) {
          await client.from('books').insert({
            id: localBook.id,
            user_id: userId,
            title: localBook.title,
            author: localBook.author,
            genre: localBook.genre,
            tags: localBook.tags,
            cover_url: localBook.coverUrl,
            format: localBook.format,
            total_chapters: localBook.totalChapters,
            estimated_pages: localBook.estimatedPages,
            status: localBook.status,
            date_added: localBook.dateAdded,
            last_accessed: localBook.lastAccessed,
            collections: localBook.collections,
          });
        }
      }

      // Download remote books not in local
      for (const remoteBook of (remoteBooks || [])) {
        if (!localBookMap.has(remoteBook.id)) {
          const newBook: Book = {
            id: remoteBook.id,
            title: remoteBook.title,
            author: remoteBook.author,
            genre: remoteBook.genre || '',
            tags: remoteBook.tags || [],
            coverUrl: remoteBook.cover_url || '',
            fileHash: remoteBook.file_hash || '',
            fileData: new ArrayBuffer(0),
            format: remoteBook.format || 'epub',
            totalChapters: remoteBook.total_chapters || 1,
            estimatedPages: remoteBook.estimated_pages || 1,
            status: remoteBook.status || 'unread',
            dateAdded: Number(remoteBook.date_added) || Date.now(),
            lastAccessed: Number(remoteBook.last_accessed) || Date.now(),
            collections: remoteBook.collections || [],
          };
          await saveBook(newBook);
        }
      }
    } catch (err) {
      console.warn('Sync books error:', err);
    }
  }

  private async syncReadingProgress(client: any, userId: string): Promise<void> {
    try {
      const localBooks = await getAllBooks();

      for (const book of localBooks) {
        const localProgress = await getProgress(book.id);

        const { data: remoteProgress } = await client
          .from('reading_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('book_id', book.id)
          .single();

        if (localProgress && (!remoteProgress || localProgress.updatedAt > (remoteProgress.updated_at || 0))) {
          // Push local progress to cloud
          await client.from('reading_progress').upsert({
            user_id: userId,
            book_id: book.id,
            current_chapter: localProgress.currentChapter,
            current_page: localProgress.currentPage,
            current_line: localProgress.currentLine,
            overall_percentage: localProgress.overallPercentage,
            total_reading_time_ms: localProgress.totalReadingTimeMs,
            last_position: localProgress.lastPosition,
            updated_at: localProgress.updatedAt,
          });
        } else if (remoteProgress && (!localProgress || remoteProgress.updated_at > localProgress.updatedAt)) {
          // Pull cloud progress to local
          await saveProgress(book.id, {
            currentChapter: remoteProgress.current_chapter,
            currentPage: remoteProgress.current_page,
            currentLine: remoteProgress.current_line,
            overallPercentage: remoteProgress.overall_percentage,
            totalReadingTimeMs: remoteProgress.total_reading_time_ms,
            lastPosition: remoteProgress.last_position,
            updatedAt: remoteProgress.updated_at,
          });
        }
      }
    } catch (err) {
      console.warn('Sync reading progress error:', err);
    }
  }

  private async syncBookmarks(client: any, userId: string): Promise<void> {
    try {
      const localBooks = await getAllBooks();

      for (const book of localBooks) {
        const localBookmarks = await getBookmarks(book.id);

        const { data: remoteBookmarks } = await client
          .from('bookmarks')
          .select('*')
          .eq('user_id', userId)
          .eq('book_id', book.id);

        const remoteMap = new Map((remoteBookmarks || []).map((b: any) => [`${b.chapter}-${b.page}-${b.line}`, b]));
        const localMap = new Map(localBookmarks.map((b) => [`${b.chapter}-${b.page}-${b.line}`, b]));

        // Upload local bookmarks
        for (const localBm of localBookmarks) {
          const key = `${localBm.chapter}-${localBm.page}-${localBm.line}`;
          if (!remoteMap.has(key)) {
            await client.from('bookmarks').insert({
              user_id: userId,
              book_id: book.id,
              chapter: localBm.chapter,
              page: localBm.page,
              line: localBm.line,
              excerpt: localBm.excerpt,
              note: localBm.note || '',
              created_at: localBm.createdAt,
            });
          }
        }

        // Download remote bookmarks
        for (const remoteBm of (remoteBookmarks || [])) {
          const key = `${remoteBm.chapter}-${remoteBm.page}-${remoteBm.line}`;
          if (!localMap.has(key)) {
            const newBm: Bookmark = {
              bookId: book.id,
              chapter: remoteBm.chapter,
              page: remoteBm.page,
              line: remoteBm.line,
              excerpt: remoteBm.excerpt,
              note: remoteBm.note || undefined,
              createdAt: Number(remoteBm.created_at) || Date.now(),
            };
            await addBookmark(newBm);
          }
        }
      }
    } catch (err) {
      console.warn('Sync bookmarks error:', err);
    }
  }
}

export const syncEngine = new SyncEngine();
