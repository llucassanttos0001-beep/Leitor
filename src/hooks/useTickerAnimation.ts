import { useState, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { useAppStore } from '../stores/app-store';
import { useReaderStore } from '../stores/reader-store';

export function useTickerAnimation(containerRef: RefObject<HTMLDivElement | null>) {
  const { tickerSpeed, pagePauseDuration } = useAppStore();
  const {
    isPlaying,
    currentLine,
    setCurrentLine,
    pages,
    currentPage,
    nextPage,
  } = useReaderStore();

  const [linePositions, setLinePositions] = useState<Map<number, number>>(new Map());
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const positionsRef = useRef<Map<number, number>>(new Map());
  const startedLinesRef = useRef<Set<number>>(new Set());
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize positions on page change or container resize
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || window.innerWidth;
    const pageData = pages[currentPage];

    if (pageData && pageData.lines) {
      const newMap = new Map<number, number>();
      const started = new Set<number>();

      pageData.lines.forEach((_, idx) => {
        // If restoring a previously read line, keep it in place
        if (idx < currentLine && currentLine > 0) {
          newMap.set(idx, 0);
          started.add(idx);
        } else {
          newMap.set(idx, width);
        }
      });

      positionsRef.current = newMap;
      startedLinesRef.current = started;
      setLinePositions(new Map(newMap));
      setActiveLineIndex(currentLine >= 0 ? currentLine : 0);
    }
  }, [currentPage, pages, containerRef, currentLine]);

  // Main animation loop with fluid cascade effect
  useEffect(() => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }

    if (!isPlaying) {
      setIsAnimating(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      lastTimeRef.current = null;
      return;
    }

    const pageData = pages[currentPage];
    if (!pageData || !pageData.lines || !containerRef.current) return;

    const linesCount = pageData.lines.length;
    if (linesCount === 0) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth || window.innerWidth;

    // The offset distance after which the NEXT line starts cascading in (e.g. 35% of width)
    const cascadeThreshold = Math.max(80, containerWidth * 0.35);

    setIsAnimating(true);

    // Make sure at least the first active line is started
    let initialActive = currentLine >= 0 && currentLine < linesCount ? currentLine : 0;
    startedLinesRef.current.add(initialActive);

    const animate = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const dt = Math.min(0.1, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      let allSettled = true;
      let highestActive = 0;

      const lineElements = container.querySelectorAll('.ticker-line');

      for (let i = 0; i < linesCount; i++) {
        // Check if line i should start sliding in because line i-1 crossed the cascade threshold
        if (!startedLinesRef.current.has(i)) {
          if (i > 0 && startedLinesRef.current.has(i - 1)) {
            const prevPos = positionsRef.current.get(i - 1) ?? containerWidth;
            if (containerWidth - prevPos >= cascadeThreshold) {
              startedLinesRef.current.add(i);
            }
          }
        }

        if (startedLinesRef.current.has(i)) {
          let pos = positionsRef.current.get(i) ?? containerWidth;

          if (pos > 0) {
            allSettled = false;
            highestActive = i;

            // Speed calculation with natural fluid damping as it nears 0
            const moveDelta = tickerSpeed * dt;
            pos = Math.max(0, pos - moveDelta);
            positionsRef.current.set(i, pos);

            // Apply direct hardware-accelerated transform for 60-120fps smoothness
            if (lineElements[i]) {
              (lineElements[i] as HTMLElement).style.transform = `translate3d(${pos}px, 0, 0)`;
              (lineElements[i] as HTMLElement).style.opacity = '1';
            }
          } else {
            if (lineElements[i]) {
              (lineElements[i] as HTMLElement).style.transform = `translate3d(0, 0, 0)`;
            }
          }
        } else {
          allSettled = false;
        }
      }

      setActiveLineIndex(highestActive);
      setCurrentLine(highestActive);

      // Once all lines on the page have cascaded into position
      if (allSettled && startedLinesRef.current.size >= linesCount) {
        setIsAnimating(false);
        setLinePositions(new Map(positionsRef.current));

        // Pause duration before advancing to the next page smoothly
        pauseTimerRef.current = setTimeout(() => {
          nextPage();
        }, Math.max(800, pagePauseDuration * 1000));

        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [isPlaying, tickerSpeed, pagePauseDuration, currentPage, pages, containerRef, nextPage, setCurrentLine, currentLine]);

  return { linePositions, activeLineIndex, isAnimating };
}
