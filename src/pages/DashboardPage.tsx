import { useMemo, useState } from "react";
import { AlertTriangle, TrendingUp, Users, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusPieChart } from "@/components/charts/StatusPieChart";
import { RenewalBarChart } from "@/components/charts/RenewalBarChart";
import { CardSkeleton } from "@/components/common/Skeleton";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { useCompliances } from "@/hooks/useCompliances";
import { daysLabel, daysColor } from "@/utils/status";
import { cn } from "@/utils/cn";
import type { ComplianceRow } from "@/types";

type ViewMode = "table" | "owners";

// ─── AlertCard: defined outside component to avoid "components created during render" warning ───

function AlertCard({
  items,
  title,
  color,
  bgColor,
  borderColor,
}: {
  items: ComplianceRow[];
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div className={cn("card p-4 border-t-4", borderColor)}>
      <div className="flex items-center justify-between mb-3">
        <h4
          className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            color,
          )}
        >
          {title}
        </h4>
        <span className={cn("text-lg font-bold", color)}>{items.length}</span>
      </div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No items</p>
        ) : (
          items.slice(0, 10).map((item) => (
            <div
              key={item.compliance_id}
              className={cn("p-2 rounded-lg text-xs", bgColor)}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate flex-1">
                  {item.certificate_name}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-semibold",
                    daysColor(item.days_remaining),
                  )}
                >
                  {daysLabel(item.days_remaining)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-slate-500 dark:text-slate-400">
                <span className="truncate">{item.owner_name}</span>
                <span>·</span>
                <span className="truncate">{item.category_name}</span>
              </div>
            </div>
          ))
        )}
        {items.length > 10 && (
          <p className="text-xs text-slate-400 text-center pt-1">
            +{items.length - 10} more
          </p>
        )}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data, loading, error, refetch } = useCompliances();
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const stats = useMemo(() => {
    if (!data.length)
      return { total: 0, active: 0, dueSoon: 0, overdue: 0, critical: 0 };
    return {
      total: data.length,
      active: data.filter((r) => r.status === "Active").length,
      dueSoon: data.filter((r) => r.status === "Due Soon").length,
      overdue: data.filter((r) => r.status === "Overdue").length,
      critical: data.filter(
        (r) =>
          (r.days_remaining !== null && r.days_remaining <= 7) ||
          r.status === "Overdue",
      ).length,
    };
  }, [data]);

  // Alert classifications
  const alerts = useMemo(() => {
    const critical: ComplianceRow[] = [];
    const high: ComplianceRow[] = [];
    const medium: ComplianceRow[] = [];
    const normal: ComplianceRow[] = [];

    data.forEach((r) => {
      const days = r.days_remaining;
      if (days === null) {
        normal.push(r);
      } else if (days <= 0 || days <= 7) {
        critical.push(r);
      } else if (days <= 30) {
        high.push(r);
      } else if (days <= 90) {
        medium.push(r);
      } else {
        normal.push(r);
      }
    });

    return { critical, high, medium, normal };
  }, [data]);

  // Owner analytics
  const ownerStats = useMemo(() => {
    const map = new Map<
      string,
      {
        total: number;
        critical: number;
        active: number;
        overdue: number;
        riskScore: number;
      }
    >();

    data.forEach((r) => {
      const owner = r.owner_name;
      if (!map.has(owner)) {
        map.set(owner, {
          total: 0,
          critical: 0,
          active: 0,
          overdue: 0,
          riskScore: 0,
        });
      }
      const entry = map.get(owner)!;
      entry.total++;
      if (r.status === "Active") entry.active++;
      if (r.status === "Overdue") entry.overdue++;
      if (r.days_remaining !== null && r.days_remaining <= 7) entry.critical++;
    });

    map.forEach((entry) => {
      entry.riskScore = Math.min(100, entry.overdue * 50 + entry.critical * 30);
    });

    return Array.from(map.entries())
      .map(([owner, d]) => ({ owner, ...d }))
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [data]);

  const criticalCount = data.filter(
    (r) => r.status === "Overdue" || r.status === "Expired",
  ).length;

  return (
    <AppShell title="Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : error ? (
            <div className="col-span-full">
              <ErrorMessage
                message="Failed to load dashboard"
                onRetry={refetch}
              />
            </div>
          ) : (
            <>
              <StatCard
                label="Total Certifications"
                value={stats.total}
                icon={<ShieldCheck size={18} />}
                color="blue"
              />
              <StatCard
                label="Active"
                value={stats.active}
                subtext={`${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% of total`}
                icon={<TrendingUp size={18} />}
                color="green"
              />
              <StatCard
                label="Due Soon"
                value={stats.dueSoon}
                icon={<TrendingUp size={18} />}
                color="yellow"
              />
              <StatCard
                label="Overdue"
                value={stats.overdue}
                icon={<AlertTriangle size={18} />}
                color="red"
              />
              <StatCard
                label="Critical (≤7d)"
                value={stats.critical}
                icon={<AlertTriangle size={18} />}
                color="red"
              />
            </>
          )}
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5 flex">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                viewMode === "table"
                  ? "bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700",
              )}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode("owners")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                viewMode === "owners"
                  ? "bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700",
              )}
            >
              By Owner
            </button>
          </div>
        </div>

        {/* Live Alerts */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-500" />
            Live Alerts
          </h3>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AlertCard
                items={alerts.critical}
                title="🔴 Critical (≤7d)"
                color="text-red-600 dark:text-red-400"
                bgColor="bg-red-50 dark:bg-red-900/10"
                borderColor="border-t-red-500"
              />
              <AlertCard
                items={alerts.high}
                title="🟠 High (≤30d)"
                color="text-orange-600 dark:text-orange-400"
                bgColor="bg-orange-50 dark:bg-orange-900/10"
                borderColor="border-t-orange-500"
              />
              <AlertCard
                items={alerts.medium}
                title="🟡 Medium (60-90d)"
                color="text-yellow-600 dark:text-yellow-400"
                bgColor="bg-yellow-50 dark:bg-yellow-900/10"
                borderColor="border-t-yellow-500"
              />
              <AlertCard
                items={alerts.normal}
                title="🟢 Normal (>90d)"
                color="text-green-600 dark:text-green-400"
                bgColor="bg-green-50 dark:bg-green-900/10"
                borderColor="border-t-green-500"
              />
            </div>
          )}
        </div>

        {/* Owner Dashboard */}
        {viewMode === "owners" && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
              <Users size={15} className="text-brand-600" />
              Owner Dashboard
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ownerStats.map((owner) => {
                const riskLevel =
                  owner.riskScore >= 80
                    ? {
                        label: "Critical",
                        color: "text-red-600",
                        bg: "bg-red-100",
                      }
                    : owner.riskScore >= 60
                      ? {
                          label: "High",
                          color: "text-orange-600",
                          bg: "bg-orange-100",
                        }
                      : owner.riskScore >= 40
                        ? {
                            label: "Medium",
                            color: "text-yellow-600",
                            bg: "bg-yellow-100",
                          }
                        : {
                            label: "Low",
                            color: "text-green-600",
                            bg: "bg-green-100",
                          };
                return (
                  <div key={owner.owner} className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                        {owner.owner}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          riskLevel.bg,
                          riskLevel.color,
                        )}
                      >
                        {riskLevel.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">
                          {owner.total}
                        </p>
                        <p className="text-[10px] text-slate-400">Total</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-red-600">
                          {owner.critical}
                        </p>
                        <p className="text-[10px] text-slate-400">Critical</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-600">
                          {owner.active}
                        </p>
                        <p className="text-[10px] text-slate-400">Active</p>
                      </div>
                    </div>
                    {owner.overdue > 0 && (
                      <div className="mt-2 text-center">
                        <span className="badge-red text-xs">
                          {owner.overdue} overdue
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Charts */}
        {!loading && data.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
                Compliance Status Distribution
              </h3>
              <StatusPieChart data={data} />
            </div>
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
                Upcoming Renewals (6 Months)
              </h3>
              <RenewalBarChart data={data} />
            </div>
          </div>
        )}

        {/* Critical Alerts Banner */}
        {criticalCount > 0 && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle
              size={18}
              className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {criticalCount} compliance{criticalCount === 1 ? "" : "s"}{" "}
                overdue or expired
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                Immediate action required. Visit the Alerts page for details.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
