"use client";

import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useTranslation } from "@/features/i18n/lib/useTranslation";
import {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useProjectsQuery,
  type ProjectSummary,
} from "@/features/persistence/hooks/useProjects";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function ProjectList({ initialProjects }: { initialProjects: ProjectSummary[] }) {
  const { t } = useTranslation();
  const { data: projects } = useProjectsQuery(initialProjects);
  const createProject = useCreateProjectMutation();
  const deleteProject = useDeleteProjectMutation();
  const [newName, setNewName] = useState("");

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-50">{t.dashboard.yourCities}</h1>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          createProject.mutate(newName || "Untitled City");
          setNewName("");
        }}
        className="mb-8 flex gap-2"
      >
        <input
          type="text"
          placeholder={t.dashboard.newCityName}
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={createProject.isPending}
          className="flex items-center gap-1.5 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:opacity-60"
        >
          {createProject.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {t.dashboard.newCity}
        </button>
      </form>

      {projects?.length === 0 && (
        <p className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-8 text-center text-sm text-zinc-500">
          {t.dashboard.noCities}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {projects?.map((project) => (
          <div
            key={project.id}
            className="group relative rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700"
          >
            <Link href={`/projects/${project.id}/editor`} className="block">
              <p className="mb-1 truncate font-medium text-zinc-100">{project.name}</p>
              <p className="text-xs text-zinc-500">
                {t.dashboard.updated} {formatDate(project.updatedAt)}
              </p>
              {project.isPublic && (
                <span className="mt-2 inline-block rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] text-emerald-400">
                  Shared
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete "${project.name}"? This can't be undone.`)) {
                  deleteProject.mutate(project.id);
                }
              }}
              className="absolute top-3 right-3 rounded-md p-1.5 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-800 hover:text-red-400"
              aria-label={`Delete ${project.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
