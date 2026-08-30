import { useRef } from 'react';
import { useReaderStore } from '../../stores/reader-store';
import { useAppStore } from '../../stores/app-store';
import { useTickerAnimation } from '../../hooks/useTickerAnimation';

interface TickerDisplayProps {
  onWordClick?: (word: string, pos: { x: number; y: number }) => void;
}

export const TickerDisplay: React.FC<TickerDisplayProps> = ({ onWordClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const isPlaying = useReaderStore((s) => s.isPlaying);
  const togglePlayPause = useReaderStore((s) => s.togglePlayPause);
  const pages = useReaderStore((s) => s.pages);
  const currentPage = useReaderStore((s) => s.currentPage);
  const currentLine = useReaderStore((s) => s.currentLine);

  const fontSize = useAppStore((s) => s.fontSize);
  const fontFamily = useAppStore((s) => s.fontFamily);
  const lineHeight = useAppStore((s) => s.lineHeight);
  const wordSpacing = useAppStore((s) => s.wordSpacing);
  const marginHorizontal = useAppStore((s) => s.marginHorizontal);
  const fadePastLines = useAppStore((s) => s.fadePastLines);

  const { linePositions, activeLineIndex } = useTickerAnimation(containerRef);

  const currentPageData = pages[currentPage];
  const lines = currentPageData?.lines || [];

  const handleContainerClick = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0 && !isPlaying && onWordClick) {
      onWordClick(selectedText, { x: e.clientX, y: e.clientY });
      return;
    }
    togglePlayPause();
  };

  const handleWordDoubleClick = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    if (!isPlaying && onWordClick) {
      const cleanWord = word.replace(/[^\wÀ-ÿ]/g, '');
      if (cleanWord) {
        onWordClick(cleanWord, { x: e.clientX, y: e.clientY });
      }
    }
  };

  const totalTextHeight = lines.length * (fontSize * lineHeight);
  const containerHeight = containerRef.current?.clientHeight || window.innerHeight - 160;
  const topOffset = Math.max(20, (containerHeight - totalTextHeight) / 2);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden cursor-pointer select-text"
      onClick={handleContainerClick}
      style={{
        paddingLeft: `${marginHorizontal}px`,
        paddingRight: `${marginHorizontal}px`,
      }}
    >
      <div className="relative w-full h-full">
        {lines.map((lineText, index) => {
          const isPast = index < activeLineIndex;
          const isActive = index === activeLineIndex;
          const isFuture = index > activeLineIndex && (currentLine === -1 || index > currentLine);
          const offset = linePositions.get(index);
          const xOffset =
            offset !== undefined ? offset : containerRef.current?.clientWidth || window.innerWidth;

          const words = lineText.split(' ');

          return (
            <div
              key={`${currentPage}-${index}`}
              className="ticker-line absolute left-0 right-0"
              style={{
                transform: `translate3d(${xOffset}px, 0, 0)`,
                top: `${topOffset + index * (fontSize * lineHeight)}px`,
                fontSize: `${fontSize}px`,
                fontFamily,
                lineHeight: `${lineHeight}`,
                wordSpacing: `${wordSpacing}px`,
                opacity: fadePastLines && isPast ? 0.35 : isFuture ? 0.15 : 1,
                transition: 'opacity 0.3s ease',
                whiteSpace: 'nowrap',
                color: 'var(--color-text)',
                fontWeight: isActive ? 500 : 400,
              }}
            >
              {words.map((word, wIdx) => (
                <span
                  key={wIdx}
                  onDoubleClick={(e) => handleWordDoubleClick(e, word)}
                  className="hover:text-[var(--color-accent)] transition-colors inline-block"
                >
                  {word}
                  {wIdx < words.length - 1 ? '\u00A0' : ''}
                </span>
              ))}
            </div>
          );
        })}

        {lines.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[var(--color-text-secondary)] text-lg">
              Pressione Play ou Espaço para começar
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
