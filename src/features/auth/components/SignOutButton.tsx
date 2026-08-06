"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { useTranslation } from "@/features/i18n/lib/useTranslation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/sign-in");
        router.refresh();
      }}
      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
    >
      <LogOut className="h-4 w-4" />
      {t.dashboard.signOut}
    </button>
  );
}
