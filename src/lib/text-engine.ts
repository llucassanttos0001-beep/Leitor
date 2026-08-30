export interface TextEngineConfig {
  containerWidth: number;
  containerHeight: number;
  fontSize: number;
  lineHeight: number;
  wordSpacing: number;
  fontFamily: string;
  marginHorizontal: number;
}

export interface LineData {
  lineIndex: number;
  text: string;
  words: string[];
}

export interface PageData {
  pageIndex: number;
  lines: LineData[];
}

export class TextEngine {
  private config: TextEngineConfig;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(config: TextEngineConfig) {
    this.config = config;
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');
    this.ctx = ctx;
    this.updateFont();
  }

  public updateConfig(config: Partial<TextEngineConfig>): void {
    this.config = { ...this.config, ...config };
    this.updateFont();
  }

  private updateFont(): void {
    this.ctx.font = `${this.config.fontSize}px ${this.config.fontFamily}`;
    // HTML5 Canvas doesn't support wordSpacing directly in measureText for all browsers easily,
    // but we approximate by adjusting space width if necessary.
  }

  public measureText(text: string): number {
    return this.ctx.measureText(text).width;
  }

  public wrapLine(text: string, maxWidth: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word) continue;

      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = this.ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  public paginateText(text: string): PageData[] {
    if (!text) return [];

    const availableWidth = Math.max(10, this.config.containerWidth - 2 * this.config.marginHorizontal);
    // Line height is typically a multiplier like 1.5, actual pixels = fontSize * lineHeight
    const actualLineHeight = this.config.fontSize * this.config.lineHeight;
    const linesPerPage = Math.floor(this.config.containerHeight / actualLineHeight);
    
    if (linesPerPage <= 0) return [];

    const paragraphs = text.split(/\n+/);
    const allLines: string[] = [];

    for (const p of paragraphs) {
      const trimmed = p.trim();
      if (!trimmed) {
        allLines.push(''); // Empty line for spacing
        continue;
      }
      const wrapped = this.wrapLine(trimmed, availableWidth);
      allLines.push(...wrapped);
    }

    const pages: PageData[] = [];
    let currentLines: LineData[] = [];
    let pageIndex = 0;
    let globalLineIndex = 0;

    for (const line of allLines) {
      currentLines.push({
        lineIndex: globalLineIndex++,
        text: line,
        words: line.split(' ').filter(w => w.length > 0)
      });

      if (currentLines.length >= linesPerPage) {
        pages.push({
          pageIndex: pageIndex++,
          lines: currentLines
        });
        currentLines = [];
      }
    }

    if (currentLines.length > 0) {
      pages.push({
        pageIndex: pageIndex++,
        lines: currentLines
      });
    }

    return pages;
  }
}
