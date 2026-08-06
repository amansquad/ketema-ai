"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";

export const USER_QUERY_KEY = ["auth", "user"] as const;

export function useUser() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: USER_QUERY_KEY,
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error) return null;
      return data.user;
    },
  });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
    });
    return () => subscription.subscription.unsubscribe();
  }, [queryClient]);

  return query;
}
