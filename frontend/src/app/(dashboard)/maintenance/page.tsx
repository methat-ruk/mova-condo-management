"use client";

import { ChevronLeft, ChevronRight, Wrench, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { MaintenanceFormDialog } from "@/components/shared/MaintenanceFormDialog";
import { MaintenanceUpdateDialog } from "@/components/shared/MaintenanceUpdateDialog";
import { Button } from "@/components/ui/button";
import { maintenanceService } from "@/services/maintenanceService";
import { residentService } from "@/services/residentService";
import { unitService } from "@/services/unitService";
import { userService } from "@/services/userService";
import type { UnitWithFloor } from "@/services/unitService";
import type { UserOption } from "@/services/userService";
import type { ApiError } from "@/types";
import type { UserRole } from "@/types/auth";
import type { ResidentListItem } from "@/types/resident";
import type {
  CreateTicketRequest,
  MaintenanceCategory,
  MaintenanceStatus,
  MaintenanceTicket,
  UpdateTicketRequest,
} from "@/types/maintenance";
import { useTranslations as useAuthTranslations } from "next-intl";

const LIMIT = 20;

const ROLE_KEYS: Record<UserRole, Parameters<ReturnType<typeof useAuthTranslations<"auth">>>[0]> = {
  ADMIN: "roles.ADMIN",
  JURISTIC: "roles.JURISTIC",
  MAINTENANCE: "roles.MAINTENANCE",
  GUARD: "roles.GUARD",
  RESIDENT: "roles.RESIDENT",
};

const STATUS_COLORS: Record<MaintenanceStatus, string> = {
  OPEN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  RESOLVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-muted text-muted-foreground",
};

const CATEGORY_COLORS: Record<MaintenanceCategory, string> = {
  ELECTRICAL: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  PLUMBING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  HVAC: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  STRUCTURAL: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  APPLIANCE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  OTHER: "bg-muted text-muted-foreground",
};

export default function MaintenancePage() {
  const t = useTranslations("maintenance");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");

  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [units, setUnits] = useState<UnitWithFloor[]>([]);
  const [residents, setResidents] = useState<ResidentListItem[]>([]);
  const [staffUsers, setStaffUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | "">("");
  const [formOpen, setFormOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<MaintenanceTicket | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceTicket | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
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
  }, [tickets, search, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    maintenanceService
      .getAll({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit: LIMIT,
      })
      .then((res) => {
        if (!cancelled) {
          setTickets(res.data);
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

  const openFormDialog = () => {
    Promise.all([unitService.getAll(), residentService.getAll({ limit: 1000 })])
      .then(([uData, rRes]) => {
        setUnits(uData);
        setResidents(rRes.data);
        setFormOpen(true);
      })
      .catch(() => toast.error(tCommon("status.error")));
  };

  const openUpdateDialog = (ticket: MaintenanceTicket) => {
    const usersPromise =
      staffUsers.length === 0
        ? userService.getAll().then((users) => {
            const filtered = users.filter(
              (u) => u.role === "MAINTENANCE" || u.role === "ADMIN" || u.role === "JURISTIC",
            );
            setStaffUsers(filtered);
          })
        : Promise.resolve();

    Promise.all([usersPromise, maintenanceService.getOne(ticket.id)])
      .then(([, detail]) => setUpdateTarget(detail))
      .catch(() => toast.error(tCommon("status.error")));
  };

  const handleCreate = async (data: CreateTicketRequest) => {
    startTransition(async () => {
      try {
        await maintenanceService.create(data);
        toast.success(t("createSuccess"));
        setFormOpen(false);
        setPage(1);
        setSearch("");
        setStatusFilter("");
      } catch (err) {
        toast.error((err as ApiError).message ?? tCommon("status.error"));
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      try {
        await maintenanceService.remove(deleteTarget.id);
        setTickets((prev) => prev.filter((t) => t.id !== deleteTarget.id));
        setTotal((n) => n - 1);
        toast.success(t("deleteSuccess"));
        setDeleteTarget(null);
      } catch (err) {
        toast.error((err as ApiError).message ?? tCommon("status.error"));
      }
    });
  };

  const handleUpdate = async (data: UpdateTicketRequest) => {
    if (!updateTarget) return;
    startTransition(async () => {
      try {
        const updated = await maintenanceService.update(updateTarget.id, data);
        setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        toast.success(t("updateSuccess"));
        setUpdateTarget(null);
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
              <div className="bg-muted h-4 w-1/3 animate-pulse rounded" />
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
              {t("pagination.showing", {
                from: (page - 1) * LIMIT + 1,
                to: Math.min(page * LIMIT, total),
                total,
              })}
            </p>
          )}
        </div>
        <Button onClick={openFormDialog} className="cursor-pointer gap-2" size="sm">
          <Plus className="h-4 w-4" />
          {t("newTicket")}
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
        <div className="flex w-full flex-col gap-x-1 gap-y-2 sm:w-auto sm:shrink-0 sm:flex-row sm:flex-wrap">
          {/* Row 1: All + OPEN + IN_PROGRESS */}
          <div className="flex gap-1 sm:contents">
            <button
              onClick={() => {
                setStatusFilter("");
                setPage(1);
              }}
              className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                statusFilter === ""
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t("filterAll")}
            </button>
            {(["OPEN", "IN_PROGRESS"] as MaintenanceStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                  statusFilter === s
                    ? s === "OPEN"
                      ? "bg-red-600 text-white dark:bg-red-500"
                      : "bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-900"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {t(`status.${s}`)}
              </button>
            ))}
          </div>
          {/* Row 2: RESOLVED + CANCELLED */}
          <div className="flex gap-1 sm:contents">
            {(["RESOLVED", "CANCELLED"] as MaintenanceStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                  statusFilter === s
                    ? s === "RESOLVED"
                      ? "bg-green-600 text-white dark:bg-green-500"
                      : "bg-slate-500 text-white dark:bg-slate-400 dark:text-slate-900"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {t(`status.${s}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      {tickets.length === 0 ? (
        <div className="bg-card border-border flex flex-col items-center gap-3 rounded-xl border py-16 text-center">
          <Wrench className="text-muted-foreground h-8 w-8" />
          <p className="text-foreground font-medium">{t("noTickets")}</p>
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
              <table className="w-full min-w-180 text-sm">
                <thead>
                  <tr className="border-border bg-muted/40 border-b">
                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                      {t("fields.title")}
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                      {t("fields.unit")}
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                      {t("fields.category")}
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                      {t("fields.status")}
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                      {t("fields.assignedTo")}
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                      {t("fields.createdAt")}
                    </th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => openUpdateDialog(ticket)}
                      className="hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      {/* Title / Note */}
                      <td className="px-4 py-3">
                        <p className="text-foreground font-medium underline underline-offset-2">
                          {ticket.title}
                        </p>
                        {ticket.note && (
                          <p className="text-muted-foreground truncate text-xs italic">
                            {ticket.note}
                          </p>
                        )}
                      </td>

                      {/* Unit / Resident */}
                      <td className="px-4 py-3">
                        <p className="text-foreground">
                          {t("fields.floor")} {ticket.unit.floor.floorNumber} —{" "}
                          {ticket.unit.unitNumber}
                        </p>
                        {ticket.resident && (
                          <p className="text-muted-foreground text-xs">
                            {ticket.resident.user.firstName} {ticket.resident.user.lastName}
                          </p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[ticket.category]}`}
                        >
                          {t(`category.${ticket.category}`)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}
                        >
                          {t(`status.${ticket.status}`)}
                        </span>
                      </td>

                      {/* Assigned To */}
                      <td className="px-4 py-3">
                        {ticket.assignedTo ? (
                          <div>
                            <p className="text-foreground text-xs">
                              {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {tAuth(ROLE_KEYS[ticket.assignedTo.role as UserRole])}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="px-4 py-3">
                        <p className="text-muted-foreground">
                          {new Date(ticket.createdAt).toLocaleString("th-TH", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {ticket.reportedBy.firstName} ·{" "}
                          {tAuth(ROLE_KEYS[ticket.reportedBy.role as UserRole])}
                        </p>
                      </td>

                      {/* Delete */}
                      <td className="px-2 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(ticket);
                          }}
                          className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded p-1 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
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

      <MaintenanceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        isPending={isPending}
        units={units}
        residents={residents}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        onConfirm={handleDelete}
        isPending={isDeleting}
      />

      <MaintenanceUpdateDialog
        open={!!updateTarget}
        onOpenChange={(v) => !v && setUpdateTarget(null)}
        ticket={updateTarget}
        onSubmit={handleUpdate}
        isPending={isPending}
        staffUsers={staffUsers}
      />
    </div>
  );
}
