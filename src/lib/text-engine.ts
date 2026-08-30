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
  isParagraphStart?: boolean;
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
    this.ctx.font = `${this.config.fontSize}px ${this.config.fontFamily || 'Inter, sans-serif'}`;
  }

  public measureText(text: string): number {
    return this.ctx.measureText(text).width;
  }

  public wrapParagraph(paragraph: string, maxWidth: number): string[] {
    const words = paragraph.split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) return [];

    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = this.ctx.measureText(testLine);

      // Wrap if width exceeds maxWidth, unless single word exceeds it
      if (metrics.width > maxWidth && currentLine) {
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
    if (!text || !text.trim()) return [];

    // Calculate usable dimensions with minimum safeguards for mobile
    const horizontalPadding = Math.min(this.config.marginHorizontal, Math.max(16, this.config.containerWidth * 0.05));
    const availableWidth = Math.max(200, this.config.containerWidth - horizontalPadding * 2);
    const actualLineHeight = Math.max(24, this.config.fontSize * this.config.lineHeight);

    // Calculate maximum lines that comfortably fit on screen without vertical cutoff
    const linesPerPage = Math.max(3, Math.floor((this.config.containerHeight - 40) / actualLineHeight));

    // Normalize raw text into clean paragraphs
    const rawParagraphs = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split(/\n\s*\n|\n/);

    const allLines: { text: string; isParagraphStart: boolean }[] = [];

    for (const p of rawParagraphs) {
      const cleanP = p.trim();
      if (!cleanP) continue;

      const wrapped = this.wrapParagraph(cleanP, availableWidth);
      wrapped.forEach((lineText, idx) => {
        allLines.push({
          text: lineText,
          isParagraphStart: idx === 0,
        });
      });
    }

    const pages: PageData[] = [];
    let currentLines: LineData[] = [];
    let pageIndex = 0;
    let globalLineIndex = 0;

    for (const item of allLines) {
      currentLines.push({
        lineIndex: globalLineIndex++,
        text: item.text,
        words: item.text.split(' ').filter((w) => w.length > 0),
        isParagraphStart: item.isParagraphStart,
      });

      if (currentLines.length >= linesPerPage) {
        pages.push({
          pageIndex: pageIndex++,
          lines: currentLines,
        });
        currentLines = [];
      }
    }

    if (currentLines.length > 0) {
      pages.push({
        pageIndex: pageIndex++,
        lines: currentLines,
      });
    }

    return pages;
  }
}
