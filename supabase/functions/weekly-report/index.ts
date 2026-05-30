// Supabase Edge Function: weekly-report
// Sends a weekly compliance summary email via Resend API
// Intended to be invoked by a cron scheduler (pg_cron, Vercel Cron, etc.)
// Protected by CRON_SECRET environment variable

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ComplianceRow {
  certificate_name: string;
  owner_name: string;
  next_renewal_date: string | null;
  days_remaining: number | null;
}

type Priority = "Critical" | "High" | "Medium" | "Normal";

interface GroupedItems {
  critical: ComplianceRow[];
  high: ComplianceRow[];
  medium: ComplianceRow[];
  normal: ComplianceRow[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function classifyPriority(daysRemaining: number | null): Priority {
  if (daysRemaining === null) return "Normal";
  if (daysRemaining < 0) return "Critical";
  if (daysRemaining <= 7) return "Critical";
  if (daysRemaining <= 30) return "High";
  if (daysRemaining <= 90) return "Medium";
  return "Normal";
}

function htmlEscape(str: string): string {
  return str
    .replace(/&/g, "&#38;")
    .replace(/</g, "&#60;")
    .replace(/>/g, "&#62;")
    .replace(/"/g, "&#34;")
    .replace(/'/g, "&#39;");
}

function formatDaysLabel(days: number | null): string {
  if (days === null) return "N/A";
  if (days < 0)
    return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return "Due today";
  return `${days} day${days === 1 ? "" : "s"} left`;
}

// ─── Main Handler ────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  try {
    // ── 1. Method check ────────────────────────────────────────────────────
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ ok: false, error: "Method not allowed. Use POST." }),
        { status: 405, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── 2. CRON_SECRET authentication (hard match) ─────────────────────────
    const authHeader = req.headers.get("authorization") || "";
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (!cronSecret) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "CRON_SECRET env var is not configured on the server.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
    const expected = `Bearer ${cronSecret}`;
    if (authHeader !== expected) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── 3. Validate required env vars ──────────────────────────────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const recipientsRaw = Deno.env.get("REPORT_RECIPIENTS");

    const missing: string[] = [];
    if (!supabaseUrl) missing.push("SUPABASE_URL");
    if (!supabaseServiceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    if (!resendApiKey) missing.push("RESEND_API_KEY");
    if (!recipientsRaw) missing.push("REPORT_RECIPIENTS");

    if (missing.length > 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Missing required environment variables: ${missing.join(", ")}`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── 4. Parse recipients ────────────────────────────────────────────────
    const recipients = recipientsRaw!
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "REPORT_RECIPIENTS is empty after parsing.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── 5. Initialize Supabase client (service role) ───────────────────────
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: { persistSession: false },
    });

    // ── 6. Query compliances_with_status view ──────────────────────────────
    const { data: rows, error: queryError } = await supabase
      .from("compliances_with_status")
      .select("certificate_name, owner_name, next_renewal_date, days_remaining")
      .not("next_renewal_date", "is", null)
      .order("days_remaining", { ascending: true, nullsFirst: false });

    if (queryError) {
      console.error("Supabase query error:", queryError);
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Database query failed.",
          details: queryError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const allRows = (rows ?? []) as ComplianceRow[];

    // ── 7. Classify ────────────────────────────────────────────────────────
    const grouped: GroupedItems = {
      critical: [],
      high: [],
      medium: [],
      normal: [],
    };

    for (const row of allRows) {
      // Skip rows without next_renewal_date (safety net, query already filters)
      if (!row.next_renewal_date) continue;

      const priority = classifyPriority(row.days_remaining);
      grouped[priority.toLowerCase() as keyof GroupedItems].push(row);
    }

    // ── 8. Sort within each group ──────────────────────────────────────────
    // Critical: most overdue first (smallest daysRemaining)
    grouped.critical.sort(
      (a, b) => (a.days_remaining ?? 0) - (b.days_remaining ?? 0),
    );
    // Others: nearest due first
    const sortNear = (a: ComplianceRow, b: ComplianceRow) =>
      (a.days_remaining ?? 999) - (b.days_remaining ?? 999);
    grouped.high.sort(sortNear);
    grouped.medium.sort(sortNear);
    grouped.normal.sort(sortNear);

    // ── 9. Build HTML email ────────────────────────────────────────────────
    const total = allRows.length;

    function buildTableRows(items: ComplianceRow[]): string {
      return items
        .map(
          (r) => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:13px;">${htmlEscape(r.certificate_name)}</td>
              <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:13px;">${htmlEscape(r.owner_name)}</td>
              <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:600;">${formatDaysLabel(r.days_remaining)}</td>
            </tr>`,
        )
        .join("");
    }

    function buildSection(
      title: string,
      icon: string,
      color: string,
      border: string,
      items: ComplianceRow[],
    ): string {
      if (items.length === 0) return "";
      const rowsHtml = buildTableRows(items);
      return `
        <div style="margin: 20px 0;">
          <h3 style="font-size:14px;font-weight:600;margin:0 0 8px;padding-bottom:4px;border-bottom:2px solid ${border};color:${color};">
            ${icon} ${title} (${items.length})
          </h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="text-align:left;padding:8px;font-size:11px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0;">Certificate</th>
                <th style="text-align:left;padding:8px;font-size:11px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0;">Owner</th>
                <th style="text-align:left;padding:8px;font-size:11px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0;">Status</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>`;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .header { background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0; font-size: 20px; }
    .header p { margin: 4px 0 0; opacity: 0.9; font-size: 13px; }
    .summary { background: white; padding: 20px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; }
    .stats { display: flex; gap: 12px; margin: 16px 0; flex-wrap: wrap; }
    .stat { flex: 1; min-width: 100px; background: #f8fafc; border-radius: 8px; padding: 12px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: 700; margin: 0; }
    .stat-label { font-size: 11px; color: #64748b; margin: 2px 0 0; text-transform: uppercase; }
    .footer { text-align: center; padding: 16px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Weekly Compliance Report</h1>
      <p>Gramercy Dashboard — KIPL &bull; ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
    </div>

    <div class="summary">
      <div class="stats">
        <div class="stat"><p class="stat-value" style="color:#16a34a;">${total}</p><p class="stat-label">Total</p></div>
        <div class="stat"><p class="stat-value" style="color:#dc2626;">${grouped.critical.length}</p><p class="stat-label">Critical</p></div>
        <div class="stat"><p class="stat-value" style="color:#ea580c;">${grouped.high.length}</p><p class="stat-label">High</p></div>
        <div class="stat"><p class="stat-value" style="color:#ca8a04;">${grouped.medium.length}</p><p class="stat-label">Medium</p></div>
        <div class="stat"><p class="stat-value" style="color:#22c55e;">${grouped.normal.length}</p><p class="stat-label">Normal</p></div>
      </div>

      ${buildSection("Critical", "🔴", "#dc2626", "#dc2626", grouped.critical)}
      ${buildSection("High Priority", "🟠", "#ea580c", "#ea580c", grouped.high)}
      ${buildSection("Medium", "🟡", "#ca8a04", "#ca8a04", grouped.medium)}
      ${buildSection("Normal", "🟢", "#22c55e", "#22c55e", grouped.normal)}
    </div>

    <div class="footer">
      <p>Grammercy Compliance Dashboard &bull; Kesari Infrabuild Pvt. Ltd.</p>
      <p>This is an automated report. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

    // ── 10. Send via Resend API ────────────────────────────────────────────
    const fromEmail =
      Deno.env.get("FROM_EMAIL") || "compliance@kesariprojects.com";
    const fromName = Deno.env.get("FROM_NAME") || "Gramercy Compliance";

    const resendPayload: Record<string, unknown> = {
      from: `${fromName} <${fromEmail}>`,
      to: [recipients[0]],
      subject: `Weekly Compliance Report — ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`,
      html,
    };

    if (recipients.length > 1) {
      resendPayload.bcc = recipients.slice(1);
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    const resendBody = await resendRes.text();
    let resendJson: Record<string, unknown> | null = null;
    try {
      resendJson = JSON.parse(resendBody);
    } catch {
      // non-JSON response
    }

    if (!resendRes.ok) {
      console.error("Resend API error:", resendRes.status, resendBody);
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Resend API returned status ${resendRes.status}`,
          details: resendJson ?? resendBody,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── 11. Success response ───────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        ok: true,
        sent_to: recipients.length,
        summary: {
          total,
          critical: grouped.critical.length,
          high: grouped.high.length,
          medium: grouped.medium.length,
          normal: grouped.normal.length,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Weekly report error:", err);
    const message =
      err instanceof Error ? err.message : "Unknown internal error";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
