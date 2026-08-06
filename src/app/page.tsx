import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-6 text-center">
      <p className="mb-3 font-mono text-sm tracking-widest text-emerald-400 uppercase">
        ኬተማ · Ketema AI
      </p>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
        Build a smart city, right in your browser.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-zinc-400">
        A 3D digital twin editor for urban planning — place buildings, roads,
        and infrastructure, then simulate traffic, energy, and weather.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/projects/demo/editor"
          className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
        >
          Try it locally
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
        >
          Sign in &amp; save cities
        </Link>
      </div>
    </div>
  );
}
