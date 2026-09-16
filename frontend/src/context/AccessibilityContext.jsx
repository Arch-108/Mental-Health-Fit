import { createContext, useContext, useEffect, useState } from 'react';

const AccessibilityContext = createContext(null);
const STORAGE_KEY = 'vantra_accessibility';

const DEFAULTS = {
  fontSize: 'normal', // 'normal' | 'large' | 'xlarge'
  colorMode: 'standard', // 'standard' | 'high-contrast' | 'colorblind-friendly'
  dyslexiaFont: false,
};

export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    const root = document.documentElement;
    root.setAttribute('data-font-size', settings.fontSize);
    root.setAttribute('data-color-mode', settings.colorMode);
    root.setAttribute('data-dyslexia-font', String(settings.dyslexiaFont));
  }, [settings]);

  function update(patch) {
    setSettings((s) => ({ ...s, ...patch }));
  }

  function reset() {
    setSettings(DEFAULTS);
  }

  return (
    <AccessibilityContext.Provider value={{ settings, update, reset }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used inside AccessibilityProvider');
  return ctx;
}
