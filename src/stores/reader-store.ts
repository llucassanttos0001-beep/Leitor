import { create } from 'zustand';

export interface PageData {
  lines: string[];
  pageNumber: number;
}

export interface ReaderState {
  isPlaying: boolean;
  currentChapter: number;
  currentPage: number;
  currentLine: number;
  totalChapters: number;
  totalPages: number;
  chapterTitle: string;
  chapterText: string;
  pages: PageData[];
  overallPercentage: number;
  sessionStartTime: number | null;
  pagesReadInSession: number;

  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  setChapter: (index: number, title: string, text: string, pages: PageData[]) => void;
  setCurrentPage: (page: number) => void;
  setCurrentLine: (line: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  nextLine: () => void;
  setTotalChapters: (n: number) => void;
  setOverallPercentage: (p: number) => void;
  startSession: () => void;
  endSession: () => void;
  reset: () => void;
  setPages: (pages: PageData[]) => void;
}

export const useReaderStore = create<ReaderState>((set, get) => ({
  isPlaying: false,
  currentChapter: 0,
  currentPage: 0,
  currentLine: -1,
  totalChapters: 0,
  totalPages: 0,
  chapterTitle: '',
  chapterText: '',
  pages: [],
  overallPercentage: 0,
  sessionStartTime: null,
  pagesReadInSession: 0,

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setChapter: (index, title, text, pages) => set({
    currentChapter: index,
    chapterTitle: title,
    chapterText: text,
    pages,
    totalPages: pages.length,
    currentPage: 0,
    currentLine: -1,
  }),
  setCurrentPage: (page) => set({ currentPage: page, currentLine: -1 }),
  setCurrentLine: (line) => set({ currentLine: line }),
  nextPage: () => {
    const { currentPage, totalPages, currentChapter, totalChapters, isPlaying } = get();
    if (currentPage < totalPages - 1) {
      set({ currentPage: currentPage + 1, currentLine: isPlaying ? 0 : -1 });
    } else if (currentChapter < totalChapters - 1) {
      set({ currentChapter: currentChapter + 1, currentPage: 0, currentLine: isPlaying ? 0 : -1 });
    } else {
      set({ isPlaying: false });
    }
  },
  prevPage: () => {
    const { currentPage, currentChapter } = get();
    if (currentPage > 0) {
      set({ currentPage: currentPage - 1, currentLine: -1 });
    } else if (currentChapter > 0) {
      set({ currentChapter: currentChapter - 1 });
    }
  },
  nextLine: () => set((state) => ({ currentLine: state.currentLine + 1 })),
  setTotalChapters: (n) => set({ totalChapters: n }),
  setOverallPercentage: (p) => set({ overallPercentage: p }),
  startSession: () => set({ sessionStartTime: Date.now(), pagesReadInSession: 0 }),
  endSession: () => set({ sessionStartTime: null }),
  reset: () => set({
    isPlaying: false,
    currentChapter: 0,
    currentPage: 0,
    currentLine: -1,
    totalChapters: 0,
    totalPages: 0,
    chapterTitle: '',
    chapterText: '',
    pages: [],
    overallPercentage: 0,
  }),
  setPages: (pages) => set({ pages, totalPages: pages.length }),
}));
