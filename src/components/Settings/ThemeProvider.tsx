import React, { useEffect } from 'react';
import { useAppStore } from '../../stores/app-store';

const themes: Record<string, { bg: string; text: string; textSecondary: string; accent: string; surface: string; border: string }> = {
  light: { bg: '#FAF9F6', text: '#2D2D2D', textSecondary: '#6B7280', accent: '#3B82F6', surface: '#FFFFFF', border: '#E5E7EB' },
  dark: { bg: '#1E1E2E', text: '#CDD6F4', textSecondary: '#9399B2', accent: '#89B4FA', surface: '#313244', border: '#45475A' },
  oled: { bg: '#000000', text: '#E0E0E0', textSecondary: '#888888', accent: '#BB86FC', surface: '#121212', border: '#333333' },
  sepia: { bg: '#F4ECD8', text: '#5B4636', textSecondary: '#8B7355', accent: '#D4A574', surface: '#EDE0CC', border: '#D4C4A8' },
  cyber: { bg: '#0D1117', text: '#00FF41', textSecondary: '#008F11', accent: '#00FF41', surface: '#161B22', border: '#30363D' },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    const currentTheme = (theme && themes[theme]) || themes.light;
    const root = document.documentElement;

    root.style.setProperty('--color-bg', currentTheme.bg);
    root.style.setProperty('--color-text', currentTheme.text);
    root.style.setProperty('--color-text-secondary', currentTheme.textSecondary);
    root.style.setProperty('--color-accent', currentTheme.accent);
    root.style.setProperty('--color-surface', currentTheme.surface);
    root.style.setProperty('--color-border', currentTheme.border);

    // Set dark class for Tailwind
    if (['dark', 'oled', 'cyber'].includes(theme)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Set meta theme-color for mobile
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', currentTheme.bg);
    }
  }, [theme]);

  return <>{children}</>;
}
