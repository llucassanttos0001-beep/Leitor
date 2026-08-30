import { useRef } from 'react';
import { useReaderStore } from '../../stores/reader-store';
import { useAppStore } from '../../stores/app-store';
import { useTickerAnimation } from '../../hooks/useTickerAnimation';

interface TickerDisplayProps {
  onWordClick?: (word: string, pos: { x: number; y: number }) => void;
  onCenterTap?: () => void;
}

export const TickerDisplay: React.FC<TickerDisplayProps> = ({ onWordClick, onCenterTap }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const isPlaying = useReaderStore((s) => s.isPlaying);
  const togglePlayPause = useReaderStore((s) => s.togglePlayPause);
  const pages = useReaderStore((s) => s.pages);
  const currentPage = useReaderStore((s) => s.currentPage);

  const fontSize = useAppStore((s) => s.fontSize);
  const fontFamily = useAppStore((s) => s.fontFamily);
  const lineHeight = useAppStore((s) => s.lineHeight);
  const wordSpacing = useAppStore((s) => s.wordSpacing);
  const marginHorizontal = useAppStore((s) => s.marginHorizontal);

  useTickerAnimation(containerRef);

  const currentPageData = pages[currentPage];
  const lines = currentPageData?.lines || [];

  const handleContainerClick = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0 && !isPlaying && onWordClick) {
      onWordClick(selectedText, { x: e.clientX, y: e.clientY });
      return;
    }

    if (onCenterTap) {
      onCenterTap();
    } else {
      togglePlayPause();
    }
  };

  const handleWordClick = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    if (!isPlaying && onWordClick) {
      const cleanWord = word.replace(/[^\wÀ-ÿ]/g, '');
      if (cleanWord) {
        onWordClick(cleanWord, { x: e.clientX, y: e.clientY });
      }
    } else {
      togglePlayPause();
    }
  };

  // Line spacing in pixels
  const lineSpacingPx = Math.max(28, fontSize * lineHeight);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden cursor-pointer select-text flex justify-center items-center px-4 sm:px-8"
      onClick={handleContainerClick}
    >
      <div
        className="relative w-full max-w-2xl h-full flex flex-col justify-center"
        style={{
          paddingLeft: `${Math.min(marginHorizontal, 20)}px`,
          paddingRight: `${Math.min(marginHorizontal, 20)}px`,
        }}
      >
        <div
          className="relative w-full overflow-hidden"
          style={{ minHeight: `${Math.max(100, lines.length * lineSpacingPx)}px` }}
        >
          {lines.map((lineText, index) => {
            const words = lineText.split(' ');

            return (
              <div
                key={`${currentPage}-${index}`}
                className="ticker-line absolute left-0 right-0 will-change-transform"
                style={{
                  top: `${index * lineSpacingPx}px`,
                  fontSize: `${fontSize}px`,
                  fontFamily: fontFamily || 'Inter, serif',
                  lineHeight: `${lineHeight}`,
                  letterSpacing: '0.01em',
                  wordSpacing: `${wordSpacing}px`,
                  color: 'var(--color-text)',
                  whiteSpace: 'nowrap',
                }}
              >
                {words.map((word, wIdx) => (
                  <span
                    key={wIdx}
                    onClick={(e) => handleWordClick(e, word)}
                    className="hover:text-[var(--color-accent)] transition-colors inline-block cursor-text"
                  >
                    {word}
                    {wIdx < words.length - 1 ? '\u00A0' : ''}
                  </span>
                ))}
              </div>
            );
          })}

          {lines.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
              <p className="text-[var(--color-text-secondary)] text-sm sm:text-base font-medium">
                Pressione Iniciar ou toque na tela para ler em cascata
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
