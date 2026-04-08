import { cn } from "@/lib/utils";
import type { OccupancyStatus } from "@/types/building";

const STATUS_STYLES: Record<OccupancyStatus, string> = {
  AVAILABLE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  OCCUPIED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  RESERVED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  MAINTENANCE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface StatusBadgeProps {
  status: OccupancyStatus;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_STYLES[status])}>
      {label}
    </span>
  );
}
