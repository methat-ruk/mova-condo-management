"use client";

import { ChevronLeft, ChevronRight, Package, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ParcelFormDialog } from "@/components/shared/ParcelFormDialog";
import { Button } from "@/components/ui/button";
import { parcelService } from "@/services/parcelService";
import { residentService } from "@/services/residentService";
import { unitService } from "@/services/unitService";
import type { UnitWithFloor } from "@/services/unitService";
import type { ApiError } from "@/types";
import type { UserRole } from "@/types/auth";
import type { ResidentListItem } from "@/types/resident";
import type { CreateParcelRequest, Parcel } from "@/types/parcel";
import { useTranslations as useAuthTranslations } from "next-intl";

const LIMIT = 20;

const ROLE_KEYS: Record<UserRole, Parameters<ReturnType<typeof useAuthTranslations<"auth">>>[0]> = {
  ADMIN: "roles.ADMIN",
  JURISTIC: "roles.JURISTIC",
  MAINTENANCE: "roles.MAINTENANCE",
  GUARD: "roles.GUARD",
  RESIDENT: "roles.RESIDENT",
};

function formatWaitTime(receivedAt: string): string {
  const ms = Date.now() - new Date(receivedAt).getTime();
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function waitColor(receivedAt: string): string {
  const hours = (Date.now() - new Date(receivedAt).getTime()) / 3600000;
  if (hours < 4) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (hours < 24) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

export default function ParcelsPage() {
  const t = useTranslations("parcels");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");

  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [units, setUnits] = useState<UnitWithFloor[]>([]);
  const [residents, setResidents] = useState<ResidentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "PENDING" | "CLAIMED">("");
  const [logOpen, setLogOpen] = useState(false);
  const [claimTarget, setClaimTarget] = useState<Parcel | null>(null);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fadeLeft, setFadeLeft] = useState(false);
  const [fadeRight, setFadeRight] = useState(false);

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
  }, [parcels, search, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    parcelService
      .getAll({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit: LIMIT,
      })
      .then((res) => {
        if (!cancelled) {
          setParcels(res.data);
          setTotal(res.total);
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
  }, [page, search, statusFilter]);

  const totalPages = Math.ceil(total / LIMIT);

  const openLogDialog = () => {
    Promise.all([unitService.getAll(), residentService.getAll({ limit: 1000 })])
      .then(([uData, rRes]) => {
        setUnits(uData);
        setResidents(rRes.data);
        setLogOpen(true);
      })
      .catch(() => toast.error(tCommon("status.error")));
  };

  const handleLog = async (data: CreateParcelRequest) => {
    startTransition(async () => {
      try {
        await parcelService.create(data);
        toast.success(t("logSuccess"));
        setLogOpen(false);
        setPage(1);
        setSearch("");
        setStatusFilter("");
      } catch (err) {
        toast.error((err as ApiError).message ?? tCommon("status.error"));
      }
    });
  };

  const handleClaim = async () => {
    if (!claimTarget) return;
    startTransition(async () => {
      try {
        const updated = await parcelService.claim(claimTarget.id);
        setParcels((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        toast.success(t("claimSuccess"));
        setClaimTarget(null);
      } catch (err) {
        toast.error((err as ApiError).message ?? tCommon("status.error"));
      }
    });
  };

  const claimDesc = claimTarget?.resident
    ? t("claimConfirmDesc", {
        name: `${claimTarget.resident.user.firstName} ${claimTarget.resident.user.lastName}`,
      })
    : t("claimConfirmDescNoName");

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
          {total > 0 && (
            <p className="text-muted-foreground mt-0.5 text-sm">
              {t("waitingCount")}: <span className="text-foreground font-medium">{total}</span>
            </p>
          )}
        </div>
        <Button onClick={openLogDialog} className="cursor-pointer gap-2" size="sm">
          <Plus className="h-4 w-4" />
          {t("logParcel")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-9 w-full min-w-0 rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none sm:flex-1"
        />
        <div className="flex shrink-0 gap-1">
          {(["", "PENDING", "CLAIMED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                statusFilter === s
                  ? s === "PENDING"
                    ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-900"
                    : s === "CLAIMED"
                      ? "bg-green-600 text-white dark:bg-green-500"
                      : "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s === ""
                ? t("filterAll")
                : s === "PENDING"
                  ? t("filterPending")
                  : t("filterClaimed")}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {parcels.length === 0 ? (
        <div className="bg-card border-border flex flex-col items-center gap-3 rounded-xl border py-16 text-center">
          <Package className="text-muted-foreground h-8 w-8" />
          <p className="text-foreground font-medium">{t("noParcels")}</p>
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
                      {t("fields.trackingNumber")}
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                      {t("fields.unit")}
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                      {t("fields.status")}
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                      {t("fields.receivedAt")}
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                      {t("fields.claimedAt")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {parcels.map((p) => {
                    const isPendingRow = p.status === "PENDING";
                    return (
                      <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                        {/* Tracking / Carrier */}
                        <td className="px-4 py-3">
                          <p className="text-foreground font-medium">
                            {p.trackingNumber ?? <span className="text-muted-foreground">—</span>}
                          </p>
                          {p.carrier && (
                            <p className="text-muted-foreground text-xs">{p.carrier}</p>
                          )}
                          {p.note && (
                            <p className="text-muted-foreground text-xs italic">{p.note}</p>
                          )}
                        </td>

                        {/* Unit / Resident */}
                        <td className="px-4 py-3">
                          <p className="text-foreground">
                            {t("fields.floor")} {p.unit.floor.floorNumber} — {p.unit.unitNumber}
                          </p>
                          {p.resident && (
                            <p className="text-muted-foreground text-xs">
                              {p.resident.user.firstName} {p.resident.user.lastName}
                            </p>
                          )}
                        </td>

                        {/* Status + wait time */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              isPendingRow
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {t(`status.${p.status}`)}
                          </span>
                          {isPendingRow && (
                            <span
                              className={`ml-1.5 inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${waitColor(p.receivedAt)}`}
                            >
                              {formatWaitTime(p.receivedAt)}
                            </span>
                          )}
                        </td>

                        {/* Received At */}
                        <td className="px-4 py-3">
                          <p className="text-muted-foreground">
                            {new Date(p.receivedAt).toLocaleString("th-TH", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {p.receivedBy.firstName} ·{" "}
                            {tAuth(ROLE_KEYS[p.receivedBy.role as UserRole])}
                          </p>
                        </td>

                        {/* Claimed At / Action */}
                        <td className="px-4 py-3">
                          {isPendingRow ? (
                            <button
                              onClick={() => setClaimTarget(p)}
                              className="text-primary hover:text-primary/80 cursor-pointer text-xs font-medium underline underline-offset-2 transition-colors"
                            >
                              {t("claim")}
                            </button>
                          ) : (
                            <div>
                              <p className="text-muted-foreground">
                                {p.claimedAt &&
                                  new Date(p.claimedAt).toLocaleString("th-TH", {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })}
                              </p>
                              {p.claimedBy && (
                                <p className="text-muted-foreground text-xs">
                                  {p.claimedBy.firstName} ·{" "}
                                  {tAuth(ROLE_KEYS[p.claimedBy.role as UserRole])}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {t("pagination.showing", {
              from: (page - 1) * LIMIT + 1,
              to: Math.min(page * LIMIT, total),
              total,
            })}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="hover:bg-muted text-foreground disabled:text-muted-foreground cursor-pointer rounded-lg p-1.5 transition-colors disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-foreground min-w-16 text-center text-sm">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              className="hover:bg-muted text-foreground disabled:text-muted-foreground cursor-pointer rounded-lg p-1.5 transition-colors disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <ParcelFormDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        onSubmit={handleLog}
        isPending={isPending}
        units={units}
        residents={residents}
      />

      <ConfirmDialog
        open={!!claimTarget}
        onOpenChange={(v) => !v && setClaimTarget(null)}
        title={t("claimConfirm")}
        description={claimDesc}
        onConfirm={handleClaim}
        isPending={isPending}
      />
    </div>
  );
}
