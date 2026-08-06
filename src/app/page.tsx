"use client";

import Link from "next/link";

import { LocaleSwitcher } from "@/features/i18n/components/LocaleSwitcher";
import { useTranslation } from "@/features/i18n/lib/useTranslation";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-6 text-center">
      <LocaleSwitcher className="absolute top-4 right-4" />
      <p className="mb-3 font-mono text-sm tracking-widest text-emerald-400 uppercase">{t.landing.tagline}</p>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
        {t.landing.headline}
      </h1>
      <p className="mt-4 max-w-xl text-lg text-zinc-400">{t.landing.subtitle}</p>
      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/projects/demo/editor"
          className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
        >
          {t.landing.tryLocally}
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
        >
          {t.landing.signInAndSave}
        </Link>
      </div>
    </div>
  );
}
