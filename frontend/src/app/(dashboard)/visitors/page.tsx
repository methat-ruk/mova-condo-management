"use client";

import { Info, LogIn, UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { VisitorCheckInDialog } from "@/components/shared/VisitorCheckInDialog";
import { Button } from "@/components/ui/button";
import { residentService } from "@/services/residentService";
import { unitService } from "@/services/unitService";
import { visitorService } from "@/services/visitorService";
import type { UnitWithFloor } from "@/services/unitService";
import type { ResidentListItem } from "@/types/resident";
import type { ApiError } from "@/types";
import type { UserRole } from "@/types/auth";
import type { CreateVisitorRequest, Visitor } from "@/types/visitor";

function AutoExpiredBadge({ label, tooltip }: { label: string; tooltip: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex cursor-pointer items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
      >
        {label}
        <Info className="h-3 w-3" />
      </button>
      <span
        className={`border-border bg-popover text-popover-foreground pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 rounded-md border px-2 py-1 text-xs whitespace-nowrap shadow-md transition-opacity ${
          open ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {tooltip}
      </span>
    </span>
  );
}

const ROLE_KEYS: Record<UserRole, Parameters<ReturnType<typeof useTranslations<"auth">>>[0]> = {
  ADMIN: "roles.ADMIN",
  JURISTIC: "roles.JURISTIC",
  MAINTENANCE: "roles.MAINTENANCE",
  GUARD: "roles.GUARD",
  RESIDENT: "roles.RESIDENT",
};

function formatDuration(from: string | Date, to?: string | Date | null): string {
  const ms = new Date(to ?? Date.now()).getTime() - new Date(from).getTime();
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function durationColor(from: string | Date, to?: string | Date | null): string {
  const ms = new Date(to ?? Date.now()).getTime() - new Date(from).getTime();
  const hours = ms / 3600000;
  if (to) return "text-muted-foreground";
  if (hours < 1) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (hours < 3) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

export default function VisitorsPage() {
  const t = useTranslations("visitors");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");

  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [units, setUnits] = useState<UnitWithFloor[]>([]);
  const [residents, setResidents] = useState<ResidentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "IN" | "OUT">("");
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutTarget, setCheckOutTarget] = useState<Visitor | null>(null);
  const [isPending, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fadeLeft, setFadeLeft] = useState(false);
  const [fadeRight, setFadeRight] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      setFadeLeft(el.scrollLeft > 0);
      setFadeRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    };
    check();
    el.addEventListener("scroll", check);
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [visitors, search, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      visitorService.getAll({ limit: 200 }),
      unitService.getAll(),
      residentService.getAll({ limit: 1000 }),
    ])
      .then(([vRes, uData, rRes]) => {
        if (!cancelled) {
          setVisitors(vRes.data);
          setUnits(uData);
          setResidents(rRes.data);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error(tCommon("status.error"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visitors.filter((v) => {
      if (statusFilter === "IN" && v.checkOutAt !== null) return false;
      if (statusFilter === "OUT" && v.checkOutAt === null) return false;
      if (q) {
        const inName = v.name.toLowerCase().includes(q);
        const inPhone = v.phone?.toLowerCase().includes(q) ?? false;
        const inUnit = v.unit.unitNumber.toLowerCase().includes(q);
        if (!inName && !inPhone && !inUnit) return false;
      }
      return true;
    });
  }, [visitors, search, statusFilter]);

  const currentlyInCount = useMemo(
    () => visitors.filter((v) => v.checkOutAt === null).length,
    [visitors],
  );

  const handleCheckIn = async (data: CreateVisitorRequest) => {
    startTransition(async () => {
      try {
        const created = await visitorService.checkIn(data);
        setVisitors((prev) => [created, ...prev]);
        toast.success(t("checkInSuccess"));
        setCheckInOpen(false);
      } catch (err) {
        toast.error((err as ApiError).message ?? tCommon("status.error"));
      }
    });
  };

  const handleCheckOut = async () => {
    if (!checkOutTarget) return;
    startTransition(async () => {
      try {
        const updated = await visitorService.checkOut(checkOutTarget.id);
        setVisitors((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
        toast.success(t("checkOutSuccess"));
        setCheckOutTarget(null);
      } catch (err) {
        toast.error((err as ApiError).message ?? tCommon("status.error"));
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="bg-card border-border divide-border divide-y rounded-xl border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="bg-muted h-4 w-1/4 animate-pulse rounded" />
              <div className="bg-muted h-4 w-1/6 animate-pulse rounded" />
              <div className="bg-muted h-4 w-1/6 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">{t("title")}</h1>
          {currentlyInCount > 0 && (
            <p className="text-muted-foreground mt-0.5 text-sm">
              {t("currentlyIn")}:{" "}
              <span className="text-foreground font-medium">{currentlyInCount}</span>
            </p>
          )}
        </div>
        <Button onClick={() => setCheckInOpen(true)} className="cursor-pointer gap-2" size="sm">
          <LogIn className="h-4 w-4" />
          {t("checkIn")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-9 w-full min-w-0 rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none sm:flex-1"
        />
        <div className="flex shrink-0 gap-1">
          {(["", "IN", "OUT"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s === "" ? t("filterAll") : s === "IN" ? t("filterIn") : t("filterOut")}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-card border-border flex flex-col items-center gap-3 rounded-xl border py-16 text-center">
          <UserCheck className="text-muted-foreground h-8 w-8" />
          <p className="text-foreground font-medium">{t("noVisitors")}</p>
        </div>
      ) : (
        <div className="bg-card border-border overflow-hidden rounded-xl border">
          <div className="relative">
            {fadeLeft && (
              <div className="from-card pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-linear-to-r to-transparent" />
            )}
            {fadeRight && (
              <div className="from-card pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-linear-to-l to-transparent" />
            )}
            <div ref={scrollRef} className="overflow-x-auto">
              <table className="w-full min-w-160 text-sm">
                <thead>
                  <tr className="border-border bg-muted/40 border-b">
                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                      {t("fields.name")}
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                      {t("fields.unit")}
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                      {t("fields.purpose")}
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                      {t("fields.checkInAt")}
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                      {t("fields.duration")}
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                      {t("fields.checkOutAt")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {filtered.map((v) => {
                    const isIn = v.checkOutAt === null;
                    return (
                      <tr key={v.id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <p className="text-foreground font-medium">{v.name}</p>
                            {v.groupSize > 1 && (
                              <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs font-medium tabular-nums">
                                ×{v.groupSize}
                              </span>
                            )}
                          </div>
                          {v.phone && <p className="text-muted-foreground text-xs">{v.phone}</p>}
                          {v.vehiclePlate && (
                            <p className="text-muted-foreground text-xs">{v.vehiclePlate}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-foreground">
                            {t("fields.floor")} {v.unit.floor.floorNumber} — {v.unit.unitNumber}
                          </p>
                          {v.resident && (
                            <p className="text-muted-foreground text-xs">
                              {v.resident.user.firstName} {v.resident.user.lastName}
                            </p>
                          )}
                        </td>
                        <td className="text-muted-foreground px-4 py-3">{v.purpose ?? "—"}</td>
                        <td className="px-4 py-3">
                          <p className="text-muted-foreground">
                            {new Date(v.checkInAt).toLocaleString("th-TH", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {v.recordedBy.firstName} ·{" "}
                            {tAuth(ROLE_KEYS[v.recordedBy.role as UserRole])}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${durationColor(v.checkInAt, v.checkOutAt)}`}
                          >
                            {formatDuration(v.checkInAt, v.checkOutAt ?? new Date(now))}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isIn ? (
                            <button
                              onClick={() => setCheckOutTarget(v)}
                              className="text-primary hover:text-primary/80 cursor-pointer text-xs font-medium underline underline-offset-2 transition-colors"
                            >
                              {t("checkOut")}
                            </button>
                          ) : (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-muted-foreground">
                                  {new Date(v.checkOutAt!).toLocaleString("th-TH", {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })}
                                </p>
                                {v.isAutoExpired && (
                                  <AutoExpiredBadge
                                    label={t("autoExpired")}
                                    tooltip={t("autoExpiredTooltip")}
                                  />
                                )}
                              </div>
                              {v.checkedOutBy && (
                                <p className="text-muted-foreground text-xs">
                                  {v.checkedOutBy.firstName} ·{" "}
                                  {tAuth(ROLE_KEYS[v.checkedOutBy.role as UserRole])}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <VisitorCheckInDialog
        open={checkInOpen}
        onOpenChange={setCheckInOpen}
        onSubmit={handleCheckIn}
        isPending={isPending}
        units={units}
        residents={residents}
      />

      <ConfirmDialog
        open={!!checkOutTarget}
        onOpenChange={(v) => !v && setCheckOutTarget(null)}
        title={t("checkOutConfirm")}
        description={t("checkOutConfirmDesc", { name: checkOutTarget?.name ?? "" })}
        onConfirm={handleCheckOut}
        isPending={isPending}
      />
    </div>
  );
}
