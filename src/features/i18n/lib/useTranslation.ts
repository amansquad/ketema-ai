"use client";

import { useEffect } from "react";

import { readStoredLocale, useLocaleStore } from "@/features/i18n/lib/useLocaleStore";
import { dictionary } from "@/features/i18n/locales/dictionary";

/**
 * Returns the current locale's dictionary object (`t.landing.headline`, not
 * a string-path lookup — keeps every call site type-checked against
 * Dictionary). Store defaults to "en" for SSR; on mount this re-syncs from
 * localStorage, so the first paint always matches the server and a stored
 * "am" preference applies right after hydration instead of causing a
 * mismatch.
 */
export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored !== locale) setLocale(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { t: dictionary[locale], locale, setLocale };
}
