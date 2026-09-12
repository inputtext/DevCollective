import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type TypographyPreset = {
  id: string;
  name: string;
  description: string;
  display: string;
  body: string;
  mono: string;
  googleFamily?: string;
  externalCss?: string;
};

export const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
  { id: 'inter', name: 'Inter', description: 'Balanced / default', display: 'Inter', body: 'Inter', mono: 'JetBrains Mono', googleFamily: 'Inter:wght@400;500;600;700;800;900|JetBrains+Mono:wght@400;500;600;700' },
  { id: 'space-grotesk', name: 'Space Grotesk', description: 'Editorial / geometric', display: 'Space Grotesk', body: 'Inter', mono: 'JetBrains Mono', googleFamily: 'Space+Grotesk:wght@400;500;600;700|Inter:wght@400;500;600;700;800;900|JetBrains+Mono:wght@400;500;600;700' },
  { id: 'ibm-plex', name: 'IBM Plex', description: 'Technical / structured', display: 'IBM Plex Sans', body: 'IBM Plex Sans', mono: 'IBM Plex Mono', googleFamily: 'IBM+Plex+Sans:wght@400;500;600;700|IBM+Plex+Mono:wght@400;500;600;700' },
  { id: 'geist', name: 'Geist', description: 'Minimal / modern', display: 'Geist', body: 'Geist', mono: 'JetBrains Mono', googleFamily: 'JetBrains+Mono:wght@400;500;600;700', externalCss: 'https://cdn.jsdelivr.net/npm/@fontsource-variable/geist@5.2.5/index.css' },
  { id: 'dm-sans', name: 'DM Sans', description: 'Clean / approachable', display: 'DM Sans', body: 'DM Sans', mono: 'JetBrains Mono', googleFamily: 'DM+Sans:wght@400;500;600;700;800;900|JetBrains+Mono:wght@400;500;600;700' },
  { id: 'jetbrains', name: 'JetBrains Mono', description: 'Developer / monospace', display: 'JetBrains Mono', body: 'JetBrains Mono', mono: 'JetBrains Mono', googleFamily: 'JetBrains+Mono:wght@400;500;600;700;800' },
];

const STORAGE_KEY = 'devcollective-typography';
const STYLE_ID_PREFIX = 'dc-font-loader-';

type TypographyContextValue = {
  preset: TypographyPreset;
  presets: TypographyPreset[];
  changing: boolean;
  progress: number;
  setTypography: (id: string) => Promise<void>;
};

const TypographyContext = createContext<TypographyContextValue | null>(null);

const getPreset = (id: string) => TYPOGRAPHY_PRESETS.find((item) => item.id === id) || TYPOGRAPHY_PRESETS[0];

const loadStylesheet = (url: string, id: string) => new Promise<void>((resolve) => {
  const existing = document.getElementById(id) as HTMLLinkElement | null;
  if (existing) { resolve(); return; }
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = url;
  link.onload = () => resolve();
  link.onerror = () => resolve();
  document.head.appendChild(link);
});

const loadGoogleFonts = (family: string, id: string) => {
  const url = `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
  return loadStylesheet(url, id);
};

const waitForFonts = async (preset: TypographyPreset) => {
  const families = new Set([preset.display, preset.body, preset.mono]);
  await Promise.all(Array.from(families).map(async (family) => {
    try {
      await document.fonts.load(`700 16px "${family}"`);
      await document.fonts.load(`400 16px "${family}"`);
    } catch {
      // The CSS stack still provides a safe fallback if a remote font is unavailable.
    }
  }));
};

export const TypographyProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [presetId, setPresetId] = useState(() => {
    if (typeof window === 'undefined') return 'inter';
    return window.localStorage.getItem(STORAGE_KEY) || 'inter';
  });
  const [changing, setChanging] = useState(false);
  const [progress, setProgress] = useState(0);
  const preset = useMemo(() => getPreset(presetId), [presetId]);

  const applyPreset = useCallback((next: TypographyPreset) => {
    const root = document.documentElement;
    root.style.setProperty('--dc-font-ui', `"${next.body}", Inter, system-ui, sans-serif`);
    root.style.setProperty('--dc-font-display', `"${next.display}", Inter, system-ui, sans-serif`);
    root.style.setProperty('--dc-font-body', `"${next.body}", Inter, system-ui, sans-serif`);
    root.style.setProperty('--dc-font-mono', `"${next.mono}", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`);
    root.dataset.typography = next.id;
  }, []);

  useEffect(() => {
    const initial = getPreset(presetId);
    void (async () => {
      if (initial.googleFamily) await loadGoogleFonts(initial.googleFamily, `${STYLE_ID_PREFIX}${initial.id}-google`);
      if (initial.externalCss) await loadStylesheet(initial.externalCss, `${STYLE_ID_PREFIX}${initial.id}-external`);
      await waitForFonts(initial);
      applyPreset(initial);
    })();
  }, [applyPreset, presetId]);

  const setTypography = useCallback(async (id: string) => {
    if (id === presetId || changing) return;
    const next = getPreset(id);
    setChanging(true);
    setProgress(12);
    document.documentElement.classList.add('dc-type-transition');
    try {
      if (next.googleFamily) {
        setProgress(28);
        await loadGoogleFonts(next.googleFamily, `${STYLE_ID_PREFIX}${next.id}-google`);
      }
      if (next.externalCss) {
        setProgress(44);
        await loadStylesheet(next.externalCss, `${STYLE_ID_PREFIX}${next.id}-external`);
      }
      setProgress(62);
      await waitForFonts(next);
      setProgress(82);
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      applyPreset(next);
      window.localStorage.setItem(STORAGE_KEY, next.id);
      setPresetId(next.id);
      setProgress(100);
      await new Promise((resolve) => window.setTimeout(resolve, 420));
    } finally {
      document.documentElement.classList.remove('dc-type-transition');
      setChanging(false);
      setProgress(0);
    }
  }, [applyPreset, changing, presetId]);

  return <TypographyContext.Provider value={{ preset, presets: TYPOGRAPHY_PRESETS, changing, progress, setTypography }}>{children}</TypographyContext.Provider>;
};

export const useTypography = () => {
  const value = useContext(TypographyContext);
  if (!value) throw new Error('useTypography must be used inside TypographyProvider');
  return value;
};
