"use client";

import type { ChangeEvent, KeyboardEvent, ReactNode } from "react";

const inputClass =
  "w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-emerald-500";

export function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-zinc-800 px-3 py-3 last:border-b-0">
      <p className="mb-2 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">{title}</p>
      {children}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  onCommit,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") event.currentTarget.blur();
  }

  return (
    <label className="mb-2 flex items-center gap-2 last:mb-0">
      <span className="w-20 shrink-0 text-xs text-zinc-400">{label}</span>
      <input
        type="text"
        className={inputClass}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        onBlur={onCommit}
        onKeyDown={handleKeyDown}
      />
    </label>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  onCommit,
  step = 0.1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onCommit: () => void;
  step?: number;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") event.currentTarget.blur();
  }

  return (
    <label className="flex items-center gap-1">
      <span className="w-4 text-[11px] text-zinc-500">{label}</span>
      <input
        type="number"
        step={step}
        className={`${inputClass} px-1.5 py-1 text-center`}
        value={Number.isFinite(value) ? Number(value.toFixed(3)) : 0}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.valueAsNumber || 0)}
        onBlur={onCommit}
        onKeyDown={handleKeyDown}
      />
    </label>
  );
}

export function Vector3Row({
  label,
  values,
  onChange,
  onCommit,
  step = 0.1,
}: {
  label: string;
  values: [number, number, number];
  onChange: (index: 0 | 1 | 2, value: number) => void;
  onCommit: () => void;
  step?: number;
}) {
  return (
    <div className="mb-2 flex items-center gap-2 last:mb-0">
      <span className="w-20 shrink-0 text-xs text-zinc-400">{label}</span>
      <div className="grid flex-1 grid-cols-3 gap-1">
        <NumberField label="X" value={values[0]} onChange={(v) => onChange(0, v)} onCommit={onCommit} step={step} />
        <NumberField label="Y" value={values[1]} onChange={(v) => onChange(1, v)} onCommit={onCommit} step={step} />
        <NumberField label="Z" value={values[2]} onChange={(v) => onChange(2, v)} onCommit={onCommit} step={step} />
      </div>
    </div>
  );
}

export function ColorField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (value: string) => void;
}) {
  return (
    <label className="mb-2 flex items-center gap-2 last:mb-0">
      <span className="w-20 shrink-0 text-xs text-zinc-400">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onCommit(event.target.value)}
        className="h-7 w-full cursor-pointer rounded-md border border-zinc-700 bg-zinc-800"
      />
    </label>
  );
}

export function SliderField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
}) {
  return (
    <label className="mb-2 flex items-center gap-2 last:mb-0">
      <span className="w-20 shrink-0 text-xs text-zinc-400">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onCommit(event.target.valueAsNumber)}
        className="flex-1 accent-emerald-500"
      />
      <span className="w-8 text-right text-[11px] text-zinc-500">{value.toFixed(2)}</span>
    </label>
  );
}
