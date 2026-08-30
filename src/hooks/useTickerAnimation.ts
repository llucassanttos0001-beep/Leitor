import { useState, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { useAppStore } from '../stores/app-store';
import { useReaderStore } from '../stores/reader-store';

export function useTickerAnimation(containerRef: RefObject<HTMLDivElement | null>) {
  const { tickerSpeed, pagePauseDuration } = useAppStore();
  const {
    isPlaying,
    pages,
    currentPage,
    nextPage,
  } = useReaderStore();

  const [activeLineIndex, setActiveLineIndex] = useState(0);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const positionsRef = useRef<number[]>([]);
  const startedLinesRef = useRef<boolean[]>([]);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentPageRef = useRef(currentPage);

  // Initialize line positions when the page changes
  useEffect(() => {
    currentPageRef.current = currentPage;
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }

    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || window.innerWidth;
    const pageData = pages[currentPage];
    const lineCount = pageData?.lines?.length || 0;

    // Reset all lines to starting position (off-screen right)
    positionsRef.current = new Array(lineCount).fill(width);
    startedLinesRef.current = new Array(lineCount).fill(false);

    // Apply initial transforms to DOM
    const lineElements = containerRef.current.querySelectorAll('.ticker-line');
    lineElements.forEach((el) => {
      (el as HTMLElement).style.transform = `translate3d(${width}px, 0, 0)`;
      (el as HTMLElement).style.opacity = '1';
    });

    setActiveLineIndex(0);
  }, [currentPage, pages, containerRef]);

  // Main animation loop
  useEffect(() => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }

    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const pageData = pages[currentPage];
    if (!pageData || !pageData.lines || pageData.lines.length === 0 || !containerRef.current) {
      return;
    }

    const linesCount = pageData.lines.length;
    const container = containerRef.current;
    const containerWidth = container.clientWidth || window.innerWidth;

    // Ensure positions array matches linesCount
    if (positionsRef.current.length !== linesCount) {
      positionsRef.current = new Array(linesCount).fill(containerWidth);
      startedLinesRef.current = new Array(linesCount).fill(false);
    }

    // Start Line 0 if nothing started yet
    if (!startedLinesRef.current.some(Boolean)) {
      startedLinesRef.current[0] = true;
    }

    // Cascade delay distance: when line i has traveled 35% of the width, line i+1 starts!
    const cascadeTriggerDistance = Math.max(60, containerWidth * 0.35);

    const animate = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const dt = Math.min(0.08, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      const lineElements = container.querySelectorAll('.ticker-line');
      let allSettled = true;

      for (let i = 0; i < linesCount; i++) {
        // Check cascade trigger for line i
        if (!startedLinesRef.current[i] && i > 0 && startedLinesRef.current[i - 1]) {
          const prevDistanceTraveled = containerWidth - positionsRef.current[i - 1];
          if (prevDistanceTraveled >= cascadeTriggerDistance) {
            startedLinesRef.current[i] = true;
          }
        }

        if (startedLinesRef.current[i]) {
          let pos = positionsRef.current[i];

          if (pos > 0) {
            allSettled = false;

            // Move left smoothly
            const delta = tickerSpeed * dt;
            pos = Math.max(0, pos - delta);
            positionsRef.current[i] = pos;

            if (lineElements[i]) {
              (lineElements[i] as HTMLElement).style.transform = `translate3d(${pos}px, 0, 0)`;
            }
          } else {
            // Already docked at final resting position (0px)
            if (lineElements[i]) {
              (lineElements[i] as HTMLElement).style.transform = 'translate3d(0, 0, 0)';
            }
          }
        } else {
          allSettled = false;
        }
      }

      // If all lines have finished entering and are seated at 0px
      if (allSettled && startedLinesRef.current.every(Boolean)) {
        setActiveLineIndex(linesCount - 1);

        // Pause on completed page before moving to next
        pauseTimerRef.current = setTimeout(() => {
          if (useReaderStore.getState().isPlaying) {
            nextPage();
          }
        }, Math.max(800, pagePauseDuration * 1000));

        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, [isPlaying, tickerSpeed, pagePauseDuration, currentPage, pages, containerRef, nextPage]);

  return { activeLineIndex };
}
