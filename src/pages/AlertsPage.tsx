import { useMemo } from "react";
import { AlertTriangle, Download } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useCompliances } from "@/hooks/useCompliances";
import { exportAlerts } from "@/utils/export";
import { formatDate } from "@/utils/date";
import { statusBadgeClass, daysLabel, daysColor } from "@/utils/status";
import { CardSkeleton } from "@/components/common/Skeleton";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { EmptyState } from "@/components/common/EmptyState";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { cn } from "@/utils/cn";
import type { ComplianceRow } from "@/types";

interface AlertSectionProps {
  items: ComplianceRow[];
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeColor: string;
  onExport: (items: ComplianceRow[], label: string) => void;
}

function AlertSection({
  items,
  title,
  icon,
  color,
  bgColor,
  borderColor,
  badgeColor,
  onExport,
}: AlertSectionProps) {
  return (
    <div className={cn("card overflow-hidden", borderColor)}>
      <div
        className={cn("px-4 py-3 flex items-center justify-between", bgColor)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <h3 className={cn("text-sm font-semibold", color)}>{title}</h3>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold",
              badgeColor,
            )}
          >
            {items.length}
          </span>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => onExport(items, title.toLowerCase())}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1"
            title="Export this category"
          >
            <Download size={13} />
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-slate-400">
              All clear — no items in this category
            </p>
          </div>
        ) : (
          items.slice(0, 20).map((item) => (
            <div
              key={item.compliance_id}
              className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800 dark:text-white truncate">
                      {item.certificate_name}
                    </span>
                    <span className={statusBadgeClass(item.status)}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                    {item.certificate_no}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold shrink-0",
                    daysColor(item.days_remaining),
                  )}
                >
                  {daysLabel(item.days_remaining)}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span>{item.owner_name}</span>
                <span>·</span>
                <span>{item.category_name}</span>
                <span>·</span>
                <span>Next: {formatDate(item.next_renewal_date)}</span>
              </div>
            </div>
          ))
        )}
        {items.length > 20 && (
          <div className="px-4 py-2 text-center border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-400">
              +{items.length - 20} more items
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function AlertsPage() {
  const { data, loading, error, refetch } = useCompliances();
  const { toasts, push, dismiss } = useToast();

  const alerts = useMemo(() => {
    const critical: ComplianceRow[] = [];
    const high: ComplianceRow[] = [];
    const medium: ComplianceRow[] = [];
    const normal: ComplianceRow[] = [];

    data.forEach((r) => {
      const days = r.days_remaining;
      if (days === null) {
        normal.push(r);
      } else if (days <= 7) {
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

  const handleExport = async (items: ComplianceRow[], label: string) => {
    try {
      const alertItems = items.map((r) => ({
        compliance_id: r.compliance_id,
        certificate_no: r.certificate_no,
        certificate_name: r.certificate_name,
        owner_name: r.owner_name,
        category_name: r.category_name,
        department_name: r.department_name,
        next_renewal_date: r.next_renewal_date,
        days_remaining: r.days_remaining,
        status: r.status,
      }));
      await exportAlerts(alertItems);
      push(
        `Exported ${items.length} ${label} alert${items.length === 1 ? "" : "s"}`,
        "success",
      );
    } catch (err) {
      push(err instanceof Error ? err.message : "Export failed", "error");
    }
  };

  return (
    <AppShell title="Alerts">
      <div className="max-w-full mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            Live Alerts Panel
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            All compliances classified by urgency — showing {data.length} total
            items
          </p>
        </div>

        {error ? (
          <ErrorMessage message="Failed to load alerts" onRetry={refetch} />
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            title="No compliance data"
            description="Add compliances to see alerts."
            icon={<AlertTriangle size={24} className="text-slate-300" />}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AlertSection
              items={alerts.critical}
              title="Critical"
              icon="🔴"
              color="text-red-600 dark:text-red-400"
              bgColor="bg-red-50 dark:bg-red-900/10"
              borderColor="border-t-2 border-t-red-500"
              badgeColor="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              onExport={handleExport}
            />
            <AlertSection
              items={alerts.high}
              title="High Priority"
              icon="🟠"
              color="text-orange-600 dark:text-orange-400"
              bgColor="bg-orange-50 dark:bg-orange-900/10"
              borderColor="border-t-2 border-t-orange-500"
              badgeColor="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
              onExport={handleExport}
            />
            <AlertSection
              items={alerts.medium}
              title="Medium"
              icon="🟡"
              color="text-yellow-600 dark:text-yellow-400"
              bgColor="bg-yellow-50 dark:bg-yellow-900/10"
              borderColor="border-t-2 border-t-yellow-500"
              badgeColor="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              onExport={handleExport}
            />
            <AlertSection
              items={alerts.normal}
              title="Normal"
              icon="🟢"
              color="text-green-600 dark:text-green-400"
              bgColor="bg-green-50 dark:bg-green-900/10"
              borderColor="border-t-2 border-t-green-500"
              badgeColor="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              onExport={handleExport}
            />
          </div>
        )}

        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </div>
    </AppShell>
  );
}
