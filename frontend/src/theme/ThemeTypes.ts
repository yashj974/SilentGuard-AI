import { createContext } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'orange' | 'emerald' | 'amber' | 'cyan' | 'indigo' | 'purple';

export interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  accentColor: AccentColor;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (accent: AccentColor) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
