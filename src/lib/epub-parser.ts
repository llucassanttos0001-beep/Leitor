import ePub, { type Book as EpubBook } from 'epubjs';
import type { BookMetadata, ChapterInfo } from '../types';

export async function parseEpub(arrayBuffer: ArrayBuffer): Promise<BookMetadata> {
  const book = ePub(arrayBuffer);
  
  try {
    await book.ready;
    
    // Extract metadata
    const metadata = book.packaging.metadata;
    
    const title = metadata.title || 'Unknown Title';
    const author = metadata.creator || 'Unknown Author';
    const description = metadata.description || '';
    const language = metadata.language || 'en';

    // Extract cover
    let coverBlob: Blob | null = null;
    try {
      coverBlob = await extractCoverImage(book);
    } catch (e) {
      console.warn('Failed to extract cover image:', e);
    }

    // Extract chapters
    let chapters: ChapterInfo[] = [];
    try {
      chapters = await getChapterList(book);
    } catch (e) {
      console.warn('Failed to extract chapters:', e);
    }

    return {
      title,
      author,
      description,
      coverBlob,
      chapters,
      language
    };
  } catch (error) {
    console.error('Error parsing EPUB:', error);
    throw new Error('Failed to parse EPUB file');
  } finally {
    book.destroy();
  }
}

export async function extractChapterText(book: EpubBook, chapterHref: string): Promise<string> {
  try {
    const doc = await book.load(chapterHref);
    if (!doc) return '';
    
    // We could extract text Content here. This depends heavily on epubjs Document format
    // A simple text extraction by getting the body innerText:
    if (doc instanceof Document) {
      return doc.body.innerText || doc.body.textContent || '';
    }
    
    return '';
  } catch (error) {
    console.error(`Error extracting chapter text for ${chapterHref}:`, error);
    return '';
  }
}

export async function getChapterList(book: EpubBook): Promise<ChapterInfo[]> {
  try {
    const navigation = book.navigation;
    const chapters: ChapterInfo[] = [];
    let index = 0;

    const processNavItem = (item: any) => {
      chapters.push({
        href: item.href,
        title: item.label.trim() || `Chapter ${index + 1}`,
        index: index++
      });
      if (item.subitems && item.subitems.length > 0) {
        item.subitems.forEach(processNavItem);
      }
    };

    if (navigation && navigation.toc && navigation.toc.length > 0) {
      navigation.toc.forEach(processNavItem);
    } else {
      // Fallback to spine if no TOC
      const spine = book.spine as any;
      if (spine && spine.spineItems) {
        spine.spineItems.forEach((item: any, idx: number) => {
          chapters.push({
            href: item.href,
            title: `Chapter ${idx + 1}`,
            index: idx
          });
        });
      }
    }

    return chapters;
  } catch (error) {
    console.error('Error getting chapter list:', error);
    return [];
  }
}

export async function extractCoverImage(book: EpubBook): Promise<Blob | null> {
  try {
    const coverUrl = await book.coverUrl();
    if (!coverUrl) return null;
    
    // epubjs often returns a blob URL for coverUrl
    if (coverUrl.startsWith('blob:')) {
      const response = await fetch(coverUrl);
      return await response.blob();
    }
    
    const archive = (book as any).archive;
    if (archive && coverUrl) {
      const blob = await archive.getBlob(coverUrl);
      return blob || null;
    }

    return null;
  } catch (error) {
    console.error('Error extracting cover:', error);
    return null;
  }
}
