import React from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReaderStore } from '../../stores/reader-store';
import { useAppStore } from '../../stores/app-store';
import * as Slider from '@radix-ui/react-slider';

export const ReaderControls: React.FC = () => {
  const { zenMode, tickerSpeed, setTickerSpeed } = useAppStore();
  const { isPlaying, togglePlayPause, currentPage, totalPages, overallPercentage, prevPage, nextPage } = useReaderStore();

  return (
    <AnimatePresence>
      {!zenMode && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative z-30 bg-[var(--color-surface)]/90 backdrop-blur-md border-t border-[var(--color-border)] px-4 py-3 shrink-0"
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--color-border)]">
            <div
              className="h-full bg-[var(--color-accent)] transition-all duration-300 ease-linear"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>

          <div className="max-w-3xl mx-auto w-full flex items-center justify-between gap-4">
            {/* Speed control */}
            <div className="flex-1 flex items-center gap-3">
              <span className="text-xs font-medium text-[var(--color-text-secondary)] w-16 text-right shrink-0">
                {tickerSpeed} px/s
              </span>
              <Slider.Root
                className="relative flex items-center w-24 sm:w-32 h-5 touch-none"
                value={[tickerSpeed]}
                onValueChange={([v]) => setTickerSpeed(v)}
                min={50}
                max={500}
                step={10}
              >
                <Slider.Track className="bg-[var(--color-border)] relative grow rounded-full h-1">
                  <Slider.Range className="absolute bg-[var(--color-accent)] rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-4 h-4 bg-[var(--color-accent)] shadow-md rounded-full focus:outline-none" />
              </Slider.Root>
            </div>

            {/* Playback controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={prevPage}
                className="p-2 rounded-full hover:bg-[var(--color-bg)] transition-colors text-[var(--color-text)]"
                title="Página anterior"
              >
                <SkipBack size={18} />
              </button>

              <button
                onClick={togglePlayPause}
                className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-[var(--color-accent)] hover:opacity-90 text-white rounded-full shadow-lg transition-all active:scale-95"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                ) : (
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={nextPage}
                className="p-2 rounded-full hover:bg-[var(--color-bg)] transition-colors text-[var(--color-text)]"
                title="Próxima página"
              >
                <SkipForward size={18} />
              </button>
            </div>

            {/* Page info */}
            <div className="flex-1 flex flex-col items-end">
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                Página {currentPage + 1} de {totalPages || '?'}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {Math.round(overallPercentage)}%
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
