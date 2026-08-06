import { TriangleAlert } from "lucide-react";

export function NotConfiguredNotice({
  title = "Supabase isn't configured yet",
  description = "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, and DATABASE_URL/DIRECT_URL in .env.local — see .env.example.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex max-w-md flex-col items-center gap-3 rounded-lg border border-amber-900/50 bg-amber-950/30 px-6 py-8 text-center">
      <TriangleAlert className="h-6 w-6 text-amber-400" />
      <p className="text-sm font-semibold text-amber-200">{title}</p>
      <p className="text-xs text-amber-200/70">{description}</p>
    </div>
  );
}
