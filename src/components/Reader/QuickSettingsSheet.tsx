import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Slider from '@radix-ui/react-slider';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, Gauge, Type } from 'lucide-react';
import { useAppStore, type ThemeName } from '../../stores/app-store';

interface QuickSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const THEMES: { id: ThemeName; name: string; bg: string; text: string }[] = [
  { id: 'light', name: 'Claro', bg: '#FAF9F6', text: '#2B2B2B' },
  { id: 'sepia', name: 'Sépia', bg: '#F4ECD8', text: '#433422' },
  { id: 'dark', name: 'Noturno', bg: '#1E1E2E', text: '#CDD6F4' },
  { id: 'oled', name: 'OLED', bg: '#000000', text: '#E0E0E0' },
];

const FONTS = [
  { id: 'Inter', name: 'Sem serifa (Inter)' },
  { id: 'Merriweather', name: 'Serifada (Livro)' },
  { id: 'Georgia', name: 'Clássica (Georgia)' },
  { id: 'OpenDyslexic', name: 'OpenDyslexic' },
];

export const QuickSettingsSheet: React.FC<QuickSettingsSheetProps> = ({ isOpen, onClose }) => {
  const {
    theme, setTheme,
    fontSize, setFontSize,
    fontFamily, setFontFamily,
    brightness, setBrightness,
    tickerSpeed, setTickerSpeed,
    pagePauseDuration, setPagePauseDuration,
  } = useAppStore();

  const handleDecreaseFont = () => {
    setFontSize(Math.max(13, fontSize - 1));
  };

  const handleIncreaseFont = () => {
    setFontSize(Math.min(32, fontSize + 1));
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[130]"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-[var(--color-surface)] border-t border-[var(--color-border)] rounded-t-3xl shadow-2xl z-[131] p-6 space-y-6 pb-8"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                  <div className="flex items-center gap-2">
                    <Type size={18} className="text-[var(--color-accent)]" />
                    <Dialog.Title className="text-sm font-semibold text-[var(--color-text)]">
                      Aparência e Leitura
                    </Dialog.Title>
                  </div>
                  <Dialog.Close asChild>
                    <button className="p-1 rounded-full hover:bg-[var(--color-bg)] text-[var(--color-text-secondary)] transition-colors">
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>

                {/* Font Size & Family */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 bg-[var(--color-bg)] p-2 rounded-2xl border border-[var(--color-border)]">
                    <button
                      onClick={handleDecreaseFont}
                      disabled={fontSize <= 13}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-[var(--color-text)] bg-[var(--color-surface)] hover:bg-[var(--color-border)] transition-colors disabled:opacity-30"
                    >
                      A-
                    </button>
                    <span className="text-xs font-semibold text-[var(--color-text)] px-2">
                      {fontSize}px
                    </span>
                    <button
                      onClick={handleIncreaseFont}
                      disabled={fontSize >= 32}
                      className="flex-1 py-2 rounded-xl text-sm font-bold text-[var(--color-text)] bg-[var(--color-surface)] hover:bg-[var(--color-border)] transition-colors disabled:opacity-30"
                    >
                      A+
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {FONTS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFontFamily(f.id)}
                        className={`p-2.5 rounded-xl text-xs font-medium border text-left truncate transition-all ${
                          fontFamily === f.id
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-semibold'
                            : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]'
                        }`}
                        style={{ fontFamily: f.id }}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Themes */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">Tema de Fundo</span>
                  <div className="grid grid-cols-4 gap-2">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          theme === t.id
                            ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/30 scale-102'
                            : 'border-[var(--color-border)] hover:opacity-90'
                        }`}
                        style={{ backgroundColor: t.bg, color: t.text }}
                      >
                        <span className="text-xs font-semibold">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Speed & Pause Duration */}
                <div className="space-y-4 pt-2 border-t border-[var(--color-border)]">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                        <Gauge size={14} /> Velocidade da Cascata
                      </span>
                      <span className="font-semibold text-[var(--color-text)]">{tickerSpeed} px/s</span>
                    </div>
                    <Slider.Root
                      className="relative flex items-center w-full h-5 touch-none"
                      value={[tickerSpeed]}
                      onValueChange={([v]) => setTickerSpeed(v)}
                      min={60}
                      max={450}
                      step={10}
                    >
                      <Slider.Track className="bg-[var(--color-border)] relative grow rounded-full h-1.5">
                        <Slider.Range className="absolute bg-[var(--color-accent)] rounded-full h-full" />
                      </Slider.Track>
                      <Slider.Thumb className="block w-5 h-5 bg-[var(--color-accent)] shadow-md rounded-full focus:outline-none" />
                    </Slider.Root>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-text-secondary)]">Pausa entre páginas</span>
                      <span className="font-semibold text-[var(--color-text)]">{pagePauseDuration.toFixed(1)}s</span>
                    </div>
                    <Slider.Root
                      className="relative flex items-center w-full h-5 touch-none"
                      value={[pagePauseDuration]}
                      onValueChange={([v]) => setPagePauseDuration(v)}
                      min={0.5}
                      max={4.0}
                      step={0.5}
                    >
                      <Slider.Track className="bg-[var(--color-border)] relative grow rounded-full h-1.5">
                        <Slider.Range className="absolute bg-[var(--color-accent)] rounded-full h-full" />
                      </Slider.Track>
                      <Slider.Thumb className="block w-5 h-5 bg-[var(--color-accent)] shadow-md rounded-full focus:outline-none" />
                    </Slider.Root>
                  </div>

                  {/* Brightness */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                        <Sun size={14} /> Brilho da Tela
                      </span>
                      <span className="font-semibold text-[var(--color-text)]">{brightness}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Moon size={16} className="text-[var(--color-text-secondary)] shrink-0" />
                      <Slider.Root
                        className="relative flex items-center w-full h-5 touch-none"
                        value={[brightness]}
                        onValueChange={([v]) => setBrightness(v)}
                        min={15}
                        max={100}
                        step={1}
                      >
                        <Slider.Track className="bg-[var(--color-border)] relative grow rounded-full h-1.5">
                          <Slider.Range className="absolute bg-[var(--color-accent)] rounded-full h-full" />
                        </Slider.Track>
                        <Slider.Thumb className="block w-5 h-5 bg-[var(--color-accent)] shadow-md rounded-full focus:outline-none" />
                      </Slider.Root>
                      <Sun size={16} className="text-[var(--color-text-secondary)] shrink-0" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};
