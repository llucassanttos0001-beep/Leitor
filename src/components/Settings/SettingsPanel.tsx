import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import * as Slider from '@radix-ui/react-slider';
import * as Switch from '@radix-ui/react-switch';
import * as Select from '@radix-ui/react-select';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, Thermometer, ChevronDown, Check, Volume2, Download, Upload, Trash2 } from 'lucide-react';
import { useAppStore, type ThemeName } from '../../stores/app-store';
import { exportAllData, importAllData, db } from '../../lib/db';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const THEMES: { id: ThemeName; name: string; color: string }[] = [
  { id: 'light', name: 'Light', color: '#FAF9F6' },
  { id: 'dark', name: 'Dark', color: '#1E1E2E' },
  { id: 'oled', name: 'OLED', color: '#000000' },
  { id: 'sepia', name: 'Sépia', color: '#F4ECD8' },
  { id: 'cyber', name: 'Cyber', color: '#0D1117' },
];

const FONTS = [
  { id: 'Inter', name: 'Inter' },
  { id: 'Roboto', name: 'Roboto' },
  { id: 'Merriweather', name: 'Merriweather' },
  { id: 'Georgia', name: 'Georgia' },
  { id: 'JetBrains Mono', name: 'JetBrains Mono' },
  { id: 'OpenDyslexic', name: 'OpenDyslexic' },
];

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const {
    theme, setTheme,
    brightness, setBrightness,
    colorTemperature, setColorTemperature,
    fontFamily, setFontFamily,
    fontSize, setFontSize,
    lineHeight, setLineHeight,
    wordSpacing, setWordSpacing,
    marginHorizontal, setMarginHorizontal,
    tickerSpeed, setTickerSpeed,
    pagePauseDuration, setPagePauseDuration,
    fadePastLines, toggleFadePastLines,
    zenMode, toggleZenMode,
    ambientSound, setAmbientSound,
    ambientVolume, setAmbientVolume,
  } = useAppStore();

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leitor-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importAllData(text);
      window.location.reload();
    } catch (err) {
      console.error('Import failed:', err);
    }
  };

  const handleClearData = async () => {
    if (confirm('Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita.')) {
      try {
        await db.delete();
        localStorage.clear();
        window.location.reload();
      } catch (err) {
        console.error('Clear failed:', err);
      }
    }
  };

  const soundMap: Record<string, 'off' | 'white' | 'brown' | 'rain'> = {
    'Off': 'off',
    'White Noise': 'white',
    'Brown Noise': 'brown',
    'Chuva': 'rain',
  };

  const reverseSoundMap: Record<string, string> = {
    'off': 'Off',
    'white': 'White Noise',
    'brown': 'Brown Noise',
    'rain': 'Chuva',
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
                className="fixed inset-0 bg-black/50 z-[100]"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-full max-w-md bg-[var(--color-bg)] border-l border-[var(--color-border)] shadow-2xl z-[101] flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                  <Dialog.Title className="text-lg font-semibold text-[var(--color-text)]">
                    Configurações
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="p-2 rounded-full hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors">
                      <X size={20} />
                    </button>
                  </Dialog.Close>
                </div>

                <Tabs.Root defaultValue="appearance" className="flex-1 flex flex-col overflow-hidden">
                  <Tabs.List className="flex border-b border-[var(--color-border)] overflow-x-auto shrink-0">
                    {[
                      { value: 'appearance', label: 'Aparência' },
                      { value: 'typography', label: 'Tipografia' },
                      { value: 'reading', label: 'Leitura' },
                      { value: 'audio', label: 'Áudio' },
                      { value: 'data', label: 'Dados' },
                    ].map(tab => (
                      <Tabs.Trigger
                        key={tab.value}
                        value={tab.value}
                        className="px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] data-[state=active]:text-[var(--color-accent)] data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-accent)] whitespace-nowrap transition-colors"
                      >
                        {tab.label}
                      </Tabs.Trigger>
                    ))}
                  </Tabs.List>

                  <div className="flex-1 overflow-y-auto p-6">
                    {/* Appearance Tab */}
                    <Tabs.Content value="appearance" className="space-y-8 outline-none">
                      <div className="space-y-4">
                        <label className="text-sm font-medium text-[var(--color-text)]">Tema</label>
                        <div className="flex gap-4">
                          {THEMES.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => setTheme(t.id)}
                              className={`w-10 h-10 rounded-full border-2 transition-all ${theme === t.id ? 'border-[var(--color-accent)] scale-110 ring-2 ring-[var(--color-accent)]/30' : 'border-[var(--color-border)] hover:scale-105'}`}
                              style={{ backgroundColor: t.color }}
                              title={t.name}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <label className="text-sm font-medium text-[var(--color-text)]">Brilho</label>
                          <span className="text-sm text-[var(--color-text-secondary)]">{brightness}%</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Moon size={18} className="text-[var(--color-text-secondary)]" />
                          <Slider.Root className="relative flex items-center w-full h-5 touch-none" value={[brightness]} onValueChange={([v]) => setBrightness(v)} max={100} step={1}>
                            <Slider.Track className="bg-[var(--color-border)] relative grow rounded-full h-1.5">
                              <Slider.Range className="absolute bg-[var(--color-accent)] rounded-full h-full" />
                            </Slider.Track>
                            <Slider.Thumb className="block w-5 h-5 bg-[var(--color-accent)] shadow-md rounded-full hover:bg-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50" />
                          </Slider.Root>
                          <Sun size={18} className="text-[var(--color-text-secondary)]" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <label className="text-sm font-medium text-[var(--color-text)]">Temperatura de Cor</label>
                          <span className="text-sm text-[var(--color-text-secondary)]">{colorTemperature}K</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Thermometer size={18} className="text-orange-400" />
                          <Slider.Root className="relative flex items-center w-full h-5 touch-none" value={[colorTemperature]} onValueChange={([v]) => setColorTemperature(v)} min={2700} max={6500} step={100}>
                            <Slider.Track className="bg-gradient-to-r from-orange-400 to-blue-200 relative grow rounded-full h-1.5">
                              <Slider.Range className="absolute bg-transparent rounded-full h-full" />
                            </Slider.Track>
                            <Slider.Thumb className="block w-5 h-5 bg-white border border-[var(--color-border)] shadow-md rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50" />
                          </Slider.Root>
                          <Thermometer size={18} className="text-blue-400" />
                        </div>
                      </div>
                    </Tabs.Content>

                    {/* Typography Tab */}
                    <Tabs.Content value="typography" className="space-y-8 outline-none">
                      <div className="space-y-4">
                        <label className="text-sm font-medium text-[var(--color-text)]">Fonte</label>
                        <Select.Root value={fontFamily} onValueChange={setFontFamily}>
                          <Select.Trigger className="flex items-center justify-between w-full p-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text)]">
                            <Select.Value />
                            <Select.Icon><ChevronDown size={16} /></Select.Icon>
                          </Select.Trigger>
                          <Select.Portal>
                            <Select.Content className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden z-[200]">
                              <Select.Viewport>
                                {FONTS.map(font => (
                                  <Select.Item key={font.id} value={font.id} className="flex items-center p-3 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] cursor-pointer outline-none data-[highlighted]:bg-[var(--color-bg)]" style={{ fontFamily: font.id }}>
                                    <Select.ItemText>{font.name}</Select.ItemText>
                                    <Select.ItemIndicator className="ml-auto"><Check size={16} /></Select.ItemIndicator>
                                  </Select.Item>
                                ))}
                              </Select.Viewport>
                            </Select.Content>
                          </Select.Portal>
                        </Select.Root>
                      </div>

                      <SliderSetting label="Tamanho da Fonte" value={fontSize} unit="px" min={12} max={36} step={1} onChange={setFontSize} />
                      <SliderSetting label="Espaçamento de Linhas" value={lineHeight} unit="" min={1.0} max={3.0} step={0.1} onChange={setLineHeight} />
                      <SliderSetting label="Espaçamento de Palavras" value={wordSpacing} unit="px" min={0} max={10} step={1} onChange={setWordSpacing} />
                      <SliderSetting label="Margens" value={marginHorizontal} unit="px" min={10} max={80} step={5} onChange={setMarginHorizontal} />
                    </Tabs.Content>

                    {/* Reading Tab */}
                    <Tabs.Content value="reading" className="space-y-8 outline-none">
                      <SliderSetting label="Velocidade do Ticker" value={tickerSpeed} unit="px/s" min={50} max={500} step={10} onChange={setTickerSpeed} />
                      <SliderSetting label="Pausa entre Páginas" value={pagePauseDuration} unit="s" min={0.5} max={3.0} step={0.1} onChange={setPagePauseDuration} />

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[var(--color-text)]">Esmaecer Linhas Passadas</label>
                        <Switch.Root checked={fadePastLines} onCheckedChange={toggleFadePastLines} className="w-11 h-6 bg-[var(--color-border)] rounded-full relative data-[state=checked]:bg-[var(--color-accent)] outline-none cursor-pointer transition-colors">
                          <Switch.Thumb className="block w-5 h-5 bg-white rounded-full shadow-sm transition-transform translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
                        </Switch.Root>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[var(--color-text)]">Modo Zen</label>
                        <Switch.Root checked={zenMode} onCheckedChange={toggleZenMode} className="w-11 h-6 bg-[var(--color-border)] rounded-full relative data-[state=checked]:bg-[var(--color-accent)] outline-none cursor-pointer transition-colors">
                          <Switch.Thumb className="block w-5 h-5 bg-white rounded-full shadow-sm transition-transform translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
                        </Switch.Root>
                      </div>
                    </Tabs.Content>

                    {/* Audio Tab */}
                    <Tabs.Content value="audio" className="space-y-8 outline-none">
                      <div className="space-y-4">
                        <label className="text-sm font-medium text-[var(--color-text)]">Som Ambiente</label>
                        <Select.Root value={reverseSoundMap[ambientSound]} onValueChange={(v) => setAmbientSound(soundMap[v])}>
                          <Select.Trigger className="flex items-center justify-between w-full p-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text)]">
                            <Select.Value />
                            <Select.Icon><ChevronDown size={16} /></Select.Icon>
                          </Select.Trigger>
                          <Select.Portal>
                            <Select.Content className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden z-[200]">
                              <Select.Viewport>
                                {Object.keys(soundMap).map(sound => (
                                  <Select.Item key={sound} value={sound} className="flex items-center p-3 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] cursor-pointer outline-none data-[highlighted]:bg-[var(--color-bg)]">
                                    <Select.ItemText>{sound}</Select.ItemText>
                                    <Select.ItemIndicator className="ml-auto"><Check size={16} /></Select.ItemIndicator>
                                  </Select.Item>
                                ))}
                              </Select.Viewport>
                            </Select.Content>
                          </Select.Portal>
                        </Select.Root>
                      </div>

                      {ambientSound !== 'off' && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-[var(--color-text)]">Volume ({Math.round(ambientVolume * 100)}%)</label>
                            <Volume2 size={16} className="text-[var(--color-text-secondary)]" />
                          </div>
                          <Slider.Root className="relative flex items-center w-full h-5 touch-none" value={[ambientVolume]} onValueChange={([v]) => setAmbientVolume(v)} max={1} step={0.01}>
                            <Slider.Track className="bg-[var(--color-border)] relative grow rounded-full h-1.5">
                              <Slider.Range className="absolute bg-[var(--color-accent)] rounded-full h-full" />
                            </Slider.Track>
                            <Slider.Thumb className="block w-5 h-5 bg-[var(--color-accent)] shadow-md rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50" />
                          </Slider.Root>
                        </div>
                      )}
                    </Tabs.Content>

                    {/* Data Tab */}
                    <Tabs.Content value="data" className="space-y-6 outline-none">
                      <div className="space-y-3">
                        <button
                          onClick={handleExport}
                          className="flex w-full items-center justify-center gap-2 p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors"
                        >
                          <Download size={18} /> Exportar Backup (.json)
                        </button>

                        <label className="flex w-full items-center justify-center gap-2 p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer">
                          <Upload size={18} /> Importar Backup
                          <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                        </label>

                        <button
                          onClick={handleClearData}
                          className="flex w-full items-center justify-center gap-2 p-3 border border-red-500/30 bg-red-500/10 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/20 transition-colors mt-8"
                        >
                          <Trash2 size={18} /> Limpar Todos os Dados
                        </button>
                      </div>
                    </Tabs.Content>
                  </div>
                </Tabs.Root>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

// Reusable slider setting component
function SliderSetting({ label, value, unit, min, max, step, onChange }: {
  label: string; value: number; unit: string; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  const displayValue = step < 1 ? value.toFixed(1) : value;
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <label className="text-sm font-medium text-[var(--color-text)]">{label}</label>
        <span className="text-sm text-[var(--color-text-secondary)]">{displayValue}{unit}</span>
      </div>
      <Slider.Root className="relative flex items-center w-full h-5 touch-none" value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step}>
        <Slider.Track className="bg-[var(--color-border)] relative grow rounded-full h-1.5">
          <Slider.Range className="absolute bg-[var(--color-accent)] rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb className="block w-5 h-5 bg-[var(--color-accent)] shadow-md rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50" />
      </Slider.Root>
    </div>
  );
}
