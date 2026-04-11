"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
export type PaletteId = 'serene' | 'clay' | 'moss' | 'desert' | 'ocean' | 'spring' | 'sunset' | 'vintage' | 'custom';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  paletteId: PaletteId;
  setPaletteId: (id: PaletteId) => void;
  isGrayscale: boolean;
  setGrayscale: (value: boolean) => void;
  bgType: 'color' | 'image';
  setBgType: (type: 'color' | 'image') => void;
  bgValue: string;
  setBgValue: (value: string) => void;
  glassBlur: number;
  setGlassBlur: (value: number) => void;
  customPrimary: string;
  setCustomPrimary: (value: string) => void;
  customSecondary: string;
  setCustomSecondary: (value: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const clampChannel = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const toHex = (value: number) => clampChannel(value).toString(16).padStart(2, '0');

const colorPairFromHex = (hex: string) => {
  const sanitized = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(sanitized)) {
    return { primary: '#7C9885', secondary: '#C4A882' };
  }

  const red = parseInt(sanitized.slice(0, 2), 16);
  const green = parseInt(sanitized.slice(2, 4), 16);
  const blue = parseInt(sanitized.slice(4, 6), 16);

  const primary = `#${toHex(red - 36)}${toHex(green - 26)}${toHex(blue - 20)}`;
  const secondary = `#${toHex(red + 24)}${toHex(green + 18)}${toHex(blue + 12)}`;

  return { primary, secondary };
};

const imagePairFromValue = (value: string) => {
  const presets = [
    { match: '1501854140801-50d01698950b', primary: '#5B7A5A', secondary: '#9EB89A' },
    { match: '1557683311-eac922347aa1', primary: '#646EA6', secondary: '#A8B2D8' },
    { match: '1486406146926-c627a92ad1ab', primary: '#667A8D', secondary: '#B5C4CF' },
    { match: '1483347756197-71ef80e95f73', primary: '#5E789E', secondary: '#A9C1E0' },
    { match: '1507525428034-b723cf961d3e', primary: '#4F8095', secondary: '#A6CAD8' },
    { match: '1464822759023-fed622ff2c3b', primary: '#6C7F74', secondary: '#B9C8BE' },
    { match: '1477959858617-67f85cf4f1df', primary: '#6E587F', secondary: '#B9A9C9' },
    { match: '1509316785289-025f5b846b35', primary: '#8D7860', secondary: '#D0B796' }
  ] as const;

  return presets.find(item => value.includes(item.match)) ?? { primary: '#7C9885', secondary: '#C4A882' };
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [paletteId, setPaletteIdState] = useState<PaletteId>('serene');
  const [isGrayscale, setGrayscaleState] = useState<boolean>(false);
  const [bgType, setBgTypeState] = useState<'color' | 'image'>('color');
  const [bgValue, setBgValueState] = useState<string>('');
  const [glassBlur, setGlassBlurState] = useState<number>(0);
  const [customPrimary, setCustomPrimaryState] = useState<string>('#7C9885');
  const [customSecondary, setCustomSecondaryState] = useState<string>('#C4A882');

  // Sync with LocalStorage once on mount
  useEffect(() => {
    const initTheme = () => {
      try {
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) setTheme(savedTheme);
        else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');

        const savedPalette = localStorage.getItem('palette') as PaletteId;
        if (savedPalette) setPaletteIdState(savedPalette);

        const savedGrayscale = localStorage.getItem('grayscale') === 'true';
        setGrayscaleState(savedGrayscale);

        const savedBgType = localStorage.getItem('bgType') as 'color' | 'image';
        if (savedBgType) setBgTypeState(savedBgType);

        const savedBgValue = localStorage.getItem('bgValue');
        if (savedBgValue) setBgValueState(savedBgValue);

        const savedBlur = localStorage.getItem('glassBlur');
        if (savedBlur) setGlassBlurState(Number(savedBlur));

        const savedCustomPrimary = localStorage.getItem('customPrimary');
        if (savedCustomPrimary) setCustomPrimaryState(savedCustomPrimary);
        const savedCustomSecondary = localStorage.getItem('customSecondary');
        if (savedCustomSecondary) setCustomSecondaryState(savedCustomSecondary);
      } catch (e) {
        console.warn("Could not load settings from localStorage", e);
      }
    };

    const timeout = setTimeout(initTheme, 0);
    return () => clearTimeout(timeout);
  }, []);

  // Update DOM and LocalStorage when states change
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', paletteId);
    localStorage.setItem('palette', paletteId);
  }, [paletteId]);

  // Apply custom colors directly as inline styles on <html>
  useEffect(() => {
    if (paletteId === 'custom') {
      document.documentElement.style.setProperty('--accent-primary', customPrimary);
      document.documentElement.style.setProperty('--accent-secondary', customSecondary);
    }
    localStorage.setItem('customPrimary', customPrimary);
    localStorage.setItem('customSecondary', customSecondary);
  }, [paletteId, customPrimary, customSecondary]);

  useEffect(() => {
    document.documentElement.classList.toggle('force-grayscale', isGrayscale);
    localStorage.setItem('grayscale', String(isGrayscale));
  }, [isGrayscale]);

  useEffect(() => {
    localStorage.setItem('bgType', bgType);
    localStorage.setItem('bgValue', bgValue);
    localStorage.setItem('glassBlur', String(glassBlur));
  }, [bgType, bgValue, glassBlur]);

  // Automatically adapt tile accents to the selected background source.
  useEffect(() => {
    const fallbackColor = theme === 'dark' ? '#1A1410' : '#F2EBE3';
    const effectiveValue = bgValue || fallbackColor;
    const pair = bgType === 'color' ? colorPairFromHex(effectiveValue) : imagePairFromValue(effectiveValue);

    document.documentElement.style.setProperty('--accent-primary', pair.primary);
    document.documentElement.style.setProperty('--accent-secondary', pair.secondary);
    localStorage.setItem('customPrimary', pair.primary);
    localStorage.setItem('customSecondary', pair.secondary);
  }, [bgType, bgValue, theme]);

  // Use useMemo to prevent unnecessary re-renders of consuming components
  const value = React.useMemo(() => ({
    theme,
    toggleTheme: () => setTheme(prev => prev === 'light' ? 'dark' : 'light'),
    paletteId,
    setPaletteId: (id: PaletteId) => setPaletteIdState(id),
    isGrayscale,
    setGrayscale: (value: boolean) => setGrayscaleState(value),
    bgType,
    setBgType: (type: 'color' | 'image') => setBgTypeState(type),
    bgValue,
    setBgValue: (value: string) => setBgValueState(value),
    glassBlur,
    setGlassBlur: (value: number) => setGlassBlurState(value),
    customPrimary,
    setCustomPrimary: (value: string) => setCustomPrimaryState(value),
    customSecondary,
    setCustomSecondary: (value: string) => setCustomSecondaryState(value),
  }), [theme, paletteId, isGrayscale, bgType, bgValue, glassBlur, customPrimary, customSecondary]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
