import { useEffect } from 'react';
import { useAppStore } from '../stores/app-store';
import { useReaderStore } from '../stores/reader-store';

export function useKeyboard() {
  const { 
    tickerSpeed, setTickerSpeed, 
    toggleZenMode, goToLibrary, currentView
  } = useAppStore();

  const {
    togglePlayPause,
    nextPage,
    prevPage
  } = useReaderStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextPage();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevPage();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setTickerSpeed(Math.min(tickerSpeed + 10, 1000));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setTickerSpeed(Math.max(tickerSpeed - 10, 10));
          break;
        case '[':
          e.preventDefault();
          setTickerSpeed(Math.max(tickerSpeed - 25, 10));
          break;
        case ']':
          e.preventDefault();
          setTickerSpeed(Math.min(tickerSpeed + 25, 1000));
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          toggleZenMode();
          break;
        case 'Escape':
          e.preventDefault();
          if (currentView === 'reader') {
            goToLibrary();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tickerSpeed, setTickerSpeed, toggleZenMode, togglePlayPause, nextPage, prevPage, goToLibrary, currentView]);
}
