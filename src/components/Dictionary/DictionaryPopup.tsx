import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, BookmarkPlus, Check } from 'lucide-react';
import { saveVocabulary } from '../../lib/db';
import type { VocabEntry } from '../../types';

interface DictionaryPopupProps {
  word: string;
  position: { x: number; y: number };
  onClose: () => void;
  bookId: string;
}

interface Definition {
  partOfSpeech: string;
  meanings: string[];
  example?: string;
}

export function DictionaryPopup({ word, position, onClose, bookId }: DictionaryPopupProps) {
  const [loading, setLoading] = useState(true);
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDefinition = async () => {
      setLoading(true);
      setError(null);
      setSaved(false);

      const cleanWord = word.replace(/[^\wÀ-ÿ]/g, '').toLowerCase().trim();
      if (!cleanWord) {
        setError('Palavra inválida');
        setLoading(false);
        return;
      }

      try {
        // Fetch from Dictionary API (Portuguese)
        const apiRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/pt/${cleanWord}`);
        if (!apiRes.ok) {
          throw new Error('Not found in primary API');
        }
        const apiData = await apiRes.json();
        if (isMounted && apiData && apiData.length > 0) {
          const defs: Definition[] = [];
          for (const entry of apiData) {
            if (entry.meanings) {
              for (const m of entry.meanings) {
                defs.push({
                  partOfSpeech: m.partOfSpeech || 'Definição',
                  meanings: (m.definitions || []).slice(0, 3).map((d: any) => d.definition),
                  example: m.definitions?.[0]?.example,
                });
              }
            }
          }
          if (defs.length > 0) {
            setDefinitions(defs);
            return;
          }
        }
        throw new Error('No meanings found');
      } catch (err) {
        // Fallback: Wiktionary public API
        try {
          const wikRes = await fetch(
            `https://pt.wiktionary.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(cleanWord)}&format=json&origin=*`
          );
          const wikData = await wikRes.json();
          const pages = wikData?.query?.pages;
          if (pages) {
            const pageId = Object.keys(pages)[0];
            const extract = pages[pageId]?.extract;
            if (extract && isMounted) {
              const lines = extract.split('\n').filter((l: string) => l.trim().length > 0);
              setDefinitions([
                {
                  partOfSpeech: 'Significado',
                  meanings: lines.slice(0, 3),
                },
              ]);
              return;
            }
          }
        } catch {
          // Ignore
        }

        if (isMounted) {
          setError('Definição não encontrada no dicionário público.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (word) fetchDefinition();

    return () => {
      isMounted = false;
    };
  }, [word]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSaveVocabulary = async () => {
    if (!word || !bookId) return;
    const firstDef = definitions[0]?.meanings[0] || 'Palavra salva';
    const entry: VocabEntry = {
      bookId,
      word: word.trim(),
      definition: firstDef,
      context: '',
      savedAt: Date.now(),
    };

    try {
      await saveVocabulary(entry);
      setSaved(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to save vocabulary', err);
    }
  };

  // Adjust position to stay cleanly inside the viewport
  const popupStyle = {
    top: Math.max(10, Math.min(position.y + 10, window.innerHeight - 340)),
    left: Math.max(10, Math.min(position.x - 140, window.innerWidth - 320)),
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        style={popupStyle}
        className="fixed w-[300px] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl rounded-xl z-[200] overflow-hidden flex flex-col max-h-[380px]"
      >
        <div className="flex items-center justify-between p-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
          <span className="font-bold text-[var(--color-text)] text-base capitalize truncate pr-2">
            {word}
          </span>
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] p-1 rounded-md hover:bg-[var(--color-surface)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 text-xs text-[var(--color-text)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Loader2 className="animate-spin text-[var(--color-accent)]" size={24} />
              <span className="text-[var(--color-text-secondary)]">Buscando definição...</span>
            </div>
          ) : error ? (
            <div className="text-center py-6 text-[var(--color-text-secondary)]">{error}</div>
          ) : (
            <div className="space-y-3">
              {definitions.map((def, i) => (
                <div key={i} className="space-y-1">
                  <span className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-wider">
                    {def.partOfSpeech}
                  </span>
                  <ul className="list-disc pl-4 space-y-1">
                    {def.meanings.map((m, j) => (
                      <li key={j} className="leading-relaxed">
                        {m}
                      </li>
                    ))}
                  </ul>
                  {def.example && (
                    <p className="text-[var(--color-text-secondary)] italic mt-1.5 text-[11px] border-l-2 border-[var(--color-accent)]/40 pl-2">
                      "{def.example}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && !error && (
          <div className="p-2.5 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
            <button
              onClick={handleSaveVocabulary}
              disabled={saved}
              className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-[var(--color-accent)] text-white hover:opacity-90 active:scale-98'
              }`}
            >
              {saved ? (
                <>
                  <Check size={15} /> Salvo no Vocabulário!
                </>
              ) : (
                <>
                  <BookmarkPlus size={15} /> Salvar no Vocabulário
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
