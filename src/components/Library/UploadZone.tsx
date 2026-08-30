import React, { useRef, useState, useCallback, useEffect } from 'react';
import { UploadCloud, FileUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadZoneProps {
  onFiles?: (files: File[]) => void;
  compact?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFiles, compact = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const dragCounterRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    if (!onFiles || files.length === 0) return;
    setProcessing(true);
    try {
      await onFiles(files);
    } finally {
      setProcessing(false);
    }
  }, [onFiles]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  }, [handleFiles]);

  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => e.preventDefault();
    const handleWindowDrop = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  return (
    <>
      {/* Full-screen drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-accent)]/10 backdrop-blur-sm p-8"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="w-full max-w-2xl p-12 border-4 border-dashed border-[var(--color-accent)] rounded-3xl bg-[var(--color-bg)]/95 shadow-2xl flex flex-col items-center justify-center pointer-events-none"
            >
              <UploadCloud className="w-24 h-24 text-[var(--color-accent)] mb-6 animate-bounce" />
              <h2 className="text-3xl font-bold text-[var(--color-text)] mb-2 text-center">
                Solte seus arquivos aqui
              </h2>
              <p className="text-[var(--color-text-secondary)] text-center text-lg">
                EPUB, PDF, ou TXT suportados
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload area */}
      <div
        className={`w-full mx-auto border-2 border-dashed border-[var(--color-border)] rounded-xl hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface)] transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
          compact ? 'max-w-none p-4' : 'max-w-4xl p-8'
        } ${processing ? 'opacity-70 pointer-events-none' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {compact ? (
          <div className="flex items-center gap-3">
            <FileUp size={20} className="text-[var(--color-accent)]" />
            <span className="text-sm text-[var(--color-text-secondary)]">
              {processing ? 'Processando...' : 'Arraste arquivos ou clique para adicionar livros'}
            </span>
          </div>
        ) : (
          <>
            <div className="bg-[var(--color-accent)]/10 p-4 rounded-full mb-4">
              <FileUp className="w-8 h-8 text-[var(--color-accent)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">
              {processing ? 'Processando...' : 'Adicionar novos livros'}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              Arraste e solte arquivos aqui, ou clique para procurar
            </p>
            <button className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              Procurar Arquivos
            </button>
          </>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files) handleFiles(Array.from(e.target.files));
            e.target.value = '';
          }}
          className="hidden"
          multiple
          accept=".epub,.pdf,.txt"
        />
      </div>
    </>
  );
};
