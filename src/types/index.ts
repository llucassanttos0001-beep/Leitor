export interface Book {
  id: string;
  title: string;
  author: string;
  genre?: string;
  tags: string[];
  coverUrl?: string;
  fileHash: string;
  fileData: ArrayBuffer;
  format: 'epub' | 'pdf' | 'txt';
  totalChapters?: number;
  estimatedPages?: number;
  status: 'unread' | 'reading' | 'completed';
  dateAdded: number;
  lastAccessed: number;
  collections: string[];
}

export interface ReadingProgress {
  id?: string;
  bookId: string;
  currentChapter: number;
  currentPage: number;
  currentLine: number;
  overallPercentage: number;
  totalReadingTimeMs: number;
  lastPosition: string;
  updatedAt: number;
}

export interface Bookmark {
  id?: number;
  bookId: string;
  chapter: number;
  page: number;
  line: number;
  excerpt: string;
  note?: string;
  createdAt: number;
}

export interface ReadingSession {
  id?: number;
  bookId: string;
  startTime: number;
  endTime: number;
  pagesRead: number;
  chaptersRead: number;
}

export interface VocabEntry {
  id?: number;
  bookId: string;
  word: string;
  definition: string;
  context: string;
  savedAt: number;
}

export interface AppSettings {
  key: string;
  value: any;
}

export interface ReadingTheme {
  name: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
}

export type FontFamily = 'serif' | 'sans-serif' | 'monospace' | string;

export interface ReaderState {
  currentChapter: number;
  currentPage: number;
  fontSize: number;
  fontFamily: FontFamily;
  theme: ReadingTheme;
  lineHeight: number;
  margins: number;
}

export interface ChapterInfo {
  href: string;
  title: string;
  index: number;
}

export interface BookMetadata {
  title: string;
  author: string;
  description: string;
  coverBlob: Blob | null;
  chapters: ChapterInfo[];
  language?: string;
}

export type ViewMode = 'grid' | 'list';
export type FilterMode = 'all' | 'unread' | 'reading' | 'completed';
export type SortMode = 'recent' | 'title' | 'author' | 'dateAdded';
