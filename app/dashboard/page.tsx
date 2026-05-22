"use client";

import { useEffect, useState } from "react";
import DashboardClient from "./DashboardClient";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

type Role = "viewer" | "editor";

export default function DashboardPage() {
  const [role, setRole] = useState<Role>("viewer");

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();

    supabase.auth.getUser().then(({ data }) => {
      const email = data?.user?.email || "";

      // Only admin emails allowed edit access
      if (email.toLowerCase().endsWith("@kesariprojects.com")) {
        setRole("editor");
      } else {
        setRole("viewer");
      }
    });
  }, []);

  return <DashboardClient isEditor={role === "editor"} />;
}


