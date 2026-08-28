/**
 * SafeSense AI — Global Language Context
 * Persists language + interaction mode across all pages.
 * Language: 'en' | 'hi' | 'mr'
 * Mode: 'text' | 'voice'
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Language, InteractionMode } from '../types';
import { getStoredUser, storeUser } from '../lib/mockAuth';
import { apiUpdateProfile } from '../lib/apiClient';

interface LanguageContextValue {
  language: Language;
  mode: InteractionMode;
  setLanguage: (lang: Language) => void;
  setMode: (mode: InteractionMode) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY_LANG = 'safesense_language';
const STORAGE_KEY_MODE = 'safesense_mode';

function loadLanguage(): Language {
  try {
    const v = localStorage.getItem(STORAGE_KEY_LANG);
    if (v === 'en' || v === 'hi' || v === 'mr') return v;
  } catch {
    // ignore
  }
  return 'en';
}

function loadMode(): InteractionMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY_MODE);
    if (v === 'text' || v === 'voice') return v;
  } catch {
    // ignore
  }
  return 'text';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(loadLanguage);
  const [mode, setModeState] = useState<InteractionMode>(loadMode);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY_LANG, lang);
      const user = getStoredUser();
      if (user) {
        storeUser({ ...user, language: lang });
        if (localStorage.getItem('safesense_token')) {
          apiUpdateProfile({ language: lang }).catch(() => { });
        }
      }
    } catch { /* ignore */ }
  }, []);

  const setMode = useCallback((m: InteractionMode) => {
    setModeState(m);
    try { localStorage.setItem(STORAGE_KEY_MODE, m); } catch { /* ignore */ }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, mode, setLanguage, setMode }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
