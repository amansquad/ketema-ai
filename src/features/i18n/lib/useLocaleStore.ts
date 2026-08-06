import { create } from "zustand";

import type { Locale } from "@/features/i18n/locales/dictionary";

const STORAGE_KEY = "ketema-locale";

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "am" ? "am" : "en";
}

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: "en", // SSR-safe default; the client re-syncs from localStorage on mount (see useTranslation)
  setLocale: (locale) => {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, locale);
    set({ locale });
  },
}));

export { readStoredLocale };
