import Dexie, { type Table } from 'dexie';
import type { Book, ReadingProgress, Bookmark, ReadingSession, VocabEntry, AppSettings } from '../types';

export class ReaderDatabase extends Dexie {
  books!: Table<Book, string>;
  readingProgress!: Table<ReadingProgress, string>;
  bookmarks!: Table<Bookmark, number>;
  readingSessions!: Table<ReadingSession, number>;
  vocabulary!: Table<VocabEntry, number>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('ReaderDB');
    this.version(1).stores({
      books: 'id, title, author, status, fileHash, dateAdded, lastAccessed, *collections, *tags',
      readingProgress: 'bookId',
      bookmarks: '++id, bookId',
      readingSessions: '++id, bookId',
      vocabulary: '++id, bookId',
      settings: 'key',
    });
  }
}

export const db = new ReaderDatabase();

// Book functions
export async function saveBook(book: Book): Promise<string> {
  await db.books.put(book);
  return book.id;
}

export async function getBook(id: string): Promise<Book | undefined> {
  return await db.books.get(id);
}

export async function getAllBooks(): Promise<Book[]> {
  return await db.books.toArray();
}

export async function deleteBook(id: string): Promise<void> {
  await db.books.delete(id);
  await db.readingProgress.delete(id);
  await db.bookmarks.where('bookId').equals(id).delete();
  await db.readingSessions.where('bookId').equals(id).delete();
  await db.vocabulary.where('bookId').equals(id).delete();
}

export async function updateBookStatus(id: string, status: Book['status']): Promise<void> {
  await db.books.update(id, { status, lastAccessed: Date.now() });
}

// Progress functions
export async function saveProgress(bookId: string, progress: Omit<ReadingProgress, 'bookId'>): Promise<void> {
  await db.readingProgress.put({ ...progress, bookId });
  await db.books.update(bookId, { lastAccessed: Date.now() });
}

export async function getProgress(bookId: string): Promise<ReadingProgress | undefined> {
  return await db.readingProgress.get(bookId);
}

// Bookmark functions
export async function addBookmark(bookmark: Bookmark): Promise<number> {
  return (await db.bookmarks.add(bookmark)) as number;
}

export async function getBookmarks(bookId: string): Promise<Bookmark[]> {
  return await db.bookmarks.where('bookId').equals(bookId).toArray();
}

export async function deleteBookmark(id: number): Promise<void> {
  await db.bookmarks.delete(id);
}

// Session functions
export async function addSession(session: ReadingSession): Promise<number> {
  return (await db.readingSessions.add(session)) as number;
}

export async function getSessions(bookId: string): Promise<ReadingSession[]> {
  return await db.readingSessions.where('bookId').equals(bookId).toArray();
}

// Vocabulary functions
export async function saveVocabulary(entry: VocabEntry): Promise<number> {
  return (await db.vocabulary.add(entry)) as number;
}

export async function getVocabulary(bookId: string): Promise<VocabEntry[]> {
  return await db.vocabulary.where('bookId').equals(bookId).toArray();
}

// Settings functions
export async function saveSetting(key: string, value: any): Promise<void> {
  await db.settings.put({ key, value });
}

export async function getSetting(key: string): Promise<any> {
  const setting = await db.settings.get(key);
  return setting?.value;
}

// Export / Import
export async function exportAllData(): Promise<string> {
  const data = {
    books: await db.books.toArray(),
    readingProgress: await db.readingProgress.toArray(),
    bookmarks: await db.bookmarks.toArray(),
    readingSessions: await db.readingSessions.toArray(),
    vocabulary: await db.vocabulary.toArray(),
    settings: await db.settings.toArray(),
  };
  return JSON.stringify(data);
}

export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json);

  await db.transaction('rw', [db.books, db.readingProgress, db.bookmarks, db.readingSessions, db.vocabulary, db.settings], async () => {
    if (data.books) await db.books.bulkPut(data.books);
    if (data.readingProgress) await db.readingProgress.bulkPut(data.readingProgress);
    if (data.bookmarks) await db.bookmarks.bulkPut(data.bookmarks);
    if (data.readingSessions) await db.readingSessions.bulkPut(data.readingSessions);
    if (data.vocabulary) await db.vocabulary.bulkPut(data.vocabulary);
    if (data.settings) await db.settings.bulkPut(data.settings);
  });
}
