"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

type UserRole = "loading" | "editor" | "viewer" | "unauthenticated";

export default function DashboardPage() {
  const [role, setRole] = useState<UserRole>("loading");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setRole("viewer");
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user;
      if (!user || !user.email) {
        setRole("unauthenticated");
        return;
      }

      setEmail(user.email);

      if (user.email.toLowerCase().endsWith("@kesariprojects.com")) {
        setRole("editor");
      } else {
        setRole("viewer");
      }
    });
  }, []);

  const isEditor = role === "editor";

  return (
    <main className="min-h-screen px-6 py-10" style={{ backgroundColor: "#F5F8F4" }}>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-green-700 font-medium">Protected Dashboard</p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-800">GRAMMERCY DASHBOARD</h1>
              <p className="mt-2 text-sm text-gray-500">
                Compliance dashboard by <strong>KIPL</strong> for Grammercy
              </p>
            </div>
          </div>
        </section>

        {/* Auth Status */}
        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {role === "loading" && (
            <p className="text-gray-500">Loading...</p>
          )}

          {role === "unauthenticated" && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">You are not signed in.</p>
              <a
                href="/login"
                className="inline-flex rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800 transition"
              >
                Sign in with @kesariprojects.com
              </a>
            </div>
          )}

          {role === "viewer" && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Signed in as <span className="font-mono">{email}</span></p>
              <p className="text-green-700 font-medium text-lg">📊 Dashboard (View Only)</p>
              <p className="mt-2 text-gray-600">You can view the compliance data. Editing requires a @kesariprojects.com account.</p>
            </div>
          )}

          {role === "editor" && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Signed in as <span className="font-mono">{email}</span></p>
              <p className="text-green-700 font-medium text-lg">📊 Dashboard (Editor Mode)</p>
              <p className="mt-2 text-gray-600">You have full edit access.</p>
            </div>
          )}
        </section>

        {/* Role Badge */}
        {role !== "loading" && role !== "unauthenticated" && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
            <span
              className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                isEditor
                  ? "bg-green-100 text-green-700 ring-1 ring-green-300"
                  : "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
              }`}
            >
              {isEditor ? "🟢 Editor" : "🔵 Viewer"}
            </span>
          </section>
        )}
      </div>
    </main>
  );
}