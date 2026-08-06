"use client";

import { useTranslation } from "@/features/i18n/lib/useTranslation";
import { LOCALES } from "@/features/i18n/locales/dictionary";

export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useTranslation();

  return (
    <div className={`flex items-center gap-0.5 rounded-md bg-zinc-800/60 p-0.5 ${className}`}>
      {LOCALES.map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => setLocale(option.code)}
          title={option.label}
          aria-pressed={locale === option.code}
          className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
            locale === option.code ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-white"
          }`}
        >
          {option.nativeLabel}
        </button>
      ))}
    </div>
  );
}
