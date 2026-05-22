"use client";

import React, { useEffect, useState } from "react";
import { getBrowserSupabaseClient } from "../../lib/supabase/client";
import IsEditorContext from './isEditorContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isEditor, setIsEditor] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    let mounted = true;

    async function loadRole() {
      try {
        const userRes = await supabase.auth.getUser();
        const user = userRes?.data?.user ?? null;

        if (!user) {
          if (mounted) setIsEditor(false);
          return;
        }

        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user role:", error);
          if (mounted) setIsEditor(false);
          return;
        }

        if (mounted) setIsEditor(data?.role === "editor");
      } catch (err) {
        console.error(err);
        if (mounted) setIsEditor(false);
      }
    }

    loadRole();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadRole();
    });

    return () => {
      mounted = false;
      try {
        // @ts-ignore
        authListener?.subscription?.unsubscribe?.();
        // @ts-ignore
        authListener?.unsubscribe?.();
      } catch (e) {
        // noop
      }
    };
  }, []);

  return <IsEditorContext.Provider value={isEditor}>{children}</IsEditorContext.Provider>;
}
