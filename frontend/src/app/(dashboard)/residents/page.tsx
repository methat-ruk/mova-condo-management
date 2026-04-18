"use client";

import { ChevronLeft, ChevronRight, Plus, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { ResidentFormDialog } from "@/components/shared/ResidentFormDialog";
import { Button } from "@/components/ui/button";
import { residentService } from "@/services/residentService";
import { unitService } from "@/services/unitService";
import type { UnitWithFloor } from "@/services/unitService";
import { userService } from "@/services/userService";
import type { UserOption } from "@/services/userService";
import type { ApiError } from "@/types";
import type {
  CreateResidentRequest,
  ResidentListItem,
  ResidentStatus,
  ResidentType,
} from "@/types/resident";

const LIMIT = 20;

export default function ResidentsPage() {
  const t = useTranslations("residents");
  const tCommon = useTranslations("common");

  const [residents, setResidents] = useState<ResidentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ResidentStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<ResidentType | "">("");

  const [addOpen, setAddOpen] = useState(false);
  const [isAdding, startAddTransition] = useTransition();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [units, setUnits] = useState<UnitWithFloor[]>([]);

  useEffect(() => {
    let cancelled = false;
    residentService
      .getAll({
        page,
        limit: LIMIT,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        residentType: typeFilter || undefined,
      })
      .then((res) => {
        if (!cancelled) {
          setResidents(res.data);
          setTotal(res.total);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error(tCommon("status.error"));
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [page, search, statusFilter, typeFilter, tCommon]);

  const openAddDialog = () => {
    setAddOpen(true);
    void Promise.all([userService.getAll(), unitService.getAll()]).then(([u, un]) => {
      setUsers(u);
      setUnits(un);
    });
  };

  const handleAdd = async (data: CreateResidentRequest) => {
    startAddTransition(async () => {
      try {
        const resident = await residentService.create(data);
        setResidents((prev) => [resident as unknown as ResidentListItem, ...prev]);
        setTotal((n) => n + 1);
        toast.success(t("createSuccess"));
        setAddOpen(false);
      } catch (err) {
        const e = err as ApiError;
        toast.error(e.message ?? tCommon("status.error"));
      }
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const from = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const to = Math.min(page * LIMIT, total);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="bg-card border-border divide-border divide-y rounded-xl border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="bg-muted h-10 w-10 animate-pulse rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="bg-muted h-4 w-40 animate-pulse rounded" />
                <div className="bg-muted h-3 w-24 animate-pulse rounded" />
              </div>
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
          <p className="text-muted-foreground mt-1 text-xs">{t("summary.total", { total })}</p>
        </div>
        <Button onClick={openAddDialog} className="cursor-pointer gap-2" size="sm">
          <Plus className="h-4 w-4" />
          {t("addResident")}
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
        <div className="flex w-full flex-col gap-x-1 gap-y-2 sm:w-auto sm:shrink-0 sm:flex-row sm:items-center">
          {/* Status filters */}
          <div className="flex gap-1">
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
            <button
              onClick={() => {
                setStatusFilter("ACTIVE");
                setPage(1);
              }}
              className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                statusFilter === "ACTIVE"
                  ? "bg-green-600 text-white dark:bg-green-500"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t("filterActive")}
            </button>
            <button
              onClick={() => {
                setStatusFilter("INACTIVE");
                setPage(1);
              }}
              className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                statusFilter === "INACTIVE"
                  ? "bg-slate-500 text-white dark:bg-slate-400 dark:text-slate-900"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t("filterInactive")}
            </button>
          </div>
          <div className="bg-border hidden h-4 w-px sm:block" />
          {/* Type filters */}
          <div className="flex gap-1">
            <button
              onClick={() => {
                setTypeFilter("");
                setPage(1);
              }}
              className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                typeFilter === ""
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t("filterAllType")}
            </button>
            <button
              onClick={() => {
                setTypeFilter("OWNER");
                setPage(1);
              }}
              className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                typeFilter === "OWNER"
                  ? "bg-blue-600 text-white dark:bg-blue-500"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t("residentType.OWNER")}
            </button>
            <button
              onClick={() => {
                setTypeFilter("TENANT");
                setPage(1);
              }}
              className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                typeFilter === "TENANT"
                  ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-900"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t("residentType.TENANT")}
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {residents.length === 0 ? (
        <div className="bg-card border-border flex flex-col items-center gap-3 rounded-xl border py-16 text-center">
          <Users className="text-muted-foreground h-8 w-8" />
          <p className="text-foreground font-medium">{t("noResidents")}</p>
        </div>
      ) : (
        <div className="bg-card border-border divide-border divide-y rounded-xl border">
          {residents.map((r) => (
            <div
              key={r.id}
              className="hover:bg-muted/40 flex items-center justify-between px-6 py-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <UserRound className="text-muted-foreground h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">
                    {r.user.firstName} {r.user.lastName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t("fields.floor")} {r.unit.floor.floorNumber} — {r.unit.unitNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    r.residentType === "OWNER"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  {t(`residentType.${r.residentType}`)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    r.status === "ACTIVE"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {t(`status.${r.status}`)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/residents/${r.id}`} />}
                  className="cursor-pointer"
                >
                  {tCommon("actions.view")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            {t("pagination.showing", { from, to, total })}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="bg-muted text-muted-foreground hover:bg-muted/80 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors disabled:cursor-default disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-foreground min-w-16 text-center text-xs font-medium">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="bg-muted text-muted-foreground hover:bg-muted/80 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors disabled:cursor-default disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <ResidentFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAdd}
        isPending={isAdding}
        users={users}
        units={units}
      />
    </div>
  );
}
