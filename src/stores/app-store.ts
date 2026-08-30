import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 'light' | 'dark' | 'oled' | 'sepia' | 'cyber';

export interface AppState {
  currentView: 'library' | 'reader';
  currentBookId: string | null;
  theme: ThemeName;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  wordSpacing: number;
  marginHorizontal: number;
  brightness: number;
  colorTemperature: number;
  tickerSpeed: number;
  zenMode: boolean;
  fadePastLines: boolean;
  pagePauseDuration: number;
  ambientSound: 'off' | 'white' | 'brown' | 'rain';
  ambientVolume: number;
  viewMode: 'grid' | 'list';
  filterMode: 'all' | 'reading' | 'unread' | 'completed';
  searchQuery: string;
  sidebarOpen: boolean;

  setCurrentView: (view: 'library' | 'reader') => void;
  setCurrentBookId: (id: string | null) => void;
  setTheme: (theme: ThemeName) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setLineHeight: (height: number) => void;
  setWordSpacing: (spacing: number) => void;
  setMarginHorizontal: (margin: number) => void;
  setBrightness: (brightness: number) => void;
  setColorTemperature: (temp: number) => void;
  setTickerSpeed: (speed: number) => void;
  toggleZenMode: () => void;
  toggleFadePastLines: () => void;
  setPagePauseDuration: (duration: number) => void;
  setAmbientSound: (sound: 'off' | 'white' | 'brown' | 'rain') => void;
  setAmbientVolume: (volume: number) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setFilterMode: (mode: 'all' | 'reading' | 'unread' | 'completed') => void;
  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
  openBook: (bookId: string) => void;
  goToLibrary: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentView: 'library',
      currentBookId: null,
      theme: 'light',
      fontSize: 18,
      fontFamily: 'Inter',
      lineHeight: 1.6,
      wordSpacing: 0,
      marginHorizontal: 40,
      brightness: 100,
      colorTemperature: 6500,
      tickerSpeed: 150,
      zenMode: false,
      fadePastLines: true,
      pagePauseDuration: 1.5,
      ambientSound: 'off',
      ambientVolume: 0.3,
      viewMode: 'grid',
      filterMode: 'all',
      searchQuery: '',
      sidebarOpen: false,

      setCurrentView: (view) => set({ currentView: view }),
      setCurrentBookId: (id) => set({ currentBookId: id }),
      setTheme: (theme) => set({ theme }),
      setFontSize: (size) => set({ fontSize: size }),
      setFontFamily: (family) => set({ fontFamily: family }),
      setLineHeight: (height) => set({ lineHeight: height }),
      setWordSpacing: (spacing) => set({ wordSpacing: spacing }),
      setMarginHorizontal: (margin) => set({ marginHorizontal: margin }),
      setBrightness: (brightness) => set({ brightness }),
      setColorTemperature: (temp) => set({ colorTemperature: temp }),
      setTickerSpeed: (speed) => set({ tickerSpeed: speed }),
      toggleZenMode: () => set((state) => ({ zenMode: !state.zenMode })),
      toggleFadePastLines: () => set((state) => ({ fadePastLines: !state.fadePastLines })),
      setPagePauseDuration: (duration) => set({ pagePauseDuration: duration }),
      setAmbientSound: (sound) => set({ ambientSound: sound }),
      setAmbientVolume: (volume) => set({ ambientVolume: volume }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setFilterMode: (mode) => set({ filterMode: mode }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      openBook: (bookId) => set({ currentBookId: bookId, currentView: 'reader', zenMode: false, sidebarOpen: false }),
      goToLibrary: () => set({ currentView: 'library', currentBookId: null, zenMode: false, sidebarOpen: false }),
    }),
    {
      name: 'leitor-app-storage',
      partialize: (state) => {
        // Don't persist navigation state — always start at library on reload
        const { currentView, currentBookId, searchQuery, sidebarOpen, ...rest } = state;
        return rest as any;
      },
    }
  )
);
