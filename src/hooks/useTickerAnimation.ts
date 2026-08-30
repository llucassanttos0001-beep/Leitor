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
  const currentLineRef = useRef(currentLine);

  useEffect(() => {
    currentLineRef.current = currentLine;
  }, [currentLine]);

  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.getBoundingClientRect().width || window.innerWidth;
    const pageData = pages[currentPage];

    if (pageData && pageData.lines) {
      const newMap = new Map<number, number>();
      pageData.lines.forEach((_, idx) => {
        newMap.set(idx, idx < currentLineRef.current ? 0 : width);
      });
      positionsRef.current = newMap;
      setLinePositions(new Map(newMap));
      setActiveLineIndex(currentLineRef.current);
    }
  }, [currentPage, pages, containerRef]);

  useEffect(() => {
    if (!isPlaying) {
      setIsAnimating(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const pageData = pages[currentPage];
    if (!pageData || !pageData.lines || !containerRef.current) return;

    const linesCount = pageData.lines.length;
    let currentIdx = currentLineRef.current >= 0 ? currentLineRef.current : 0;
    const container = containerRef.current;

    if (currentIdx >= linesCount) {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        nextPage();
      }, pagePauseDuration * 1000);
      return () => clearTimeout(timer);
    }

    setIsAnimating(true);
    setActiveLineIndex(currentIdx);
    if (currentLine !== currentIdx) setCurrentLine(currentIdx);

    const animate = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      let currentPos = positionsRef.current.get(currentIdx) ?? 0;
      currentPos -= tickerSpeed * dt;

      const lineElements = container.querySelectorAll('.ticker-line');
      if (lineElements[currentIdx]) {
        const el = lineElements[currentIdx] as HTMLElement;
        if (currentPos > 0) {
          el.style.transform = `translate3d(${currentPos}px, 0, 0)`;
        } else {
          el.style.transform = `translate3d(0, 0, 0)`;
        }
      }

      if (currentPos <= 0) {
        positionsRef.current.set(currentIdx, 0);
        setLinePositions(new Map(positionsRef.current));

        currentIdx++;
        currentLineRef.current = currentIdx;
        setCurrentLine(currentIdx);
        setActiveLineIndex(currentIdx);

        if (currentIdx >= linesCount) {
          return;
        }
      } else {
        positionsRef.current.set(currentIdx, currentPos);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, tickerSpeed, pagePauseDuration, currentPage, pages, containerRef, nextPage, setCurrentLine, currentLine]);

  return { linePositions, activeLineIndex, isAnimating };
}
