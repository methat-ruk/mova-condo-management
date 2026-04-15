"use client";

import { Plus, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
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

export default function ResidentsPage() {
  const t = useTranslations("residents");
  const tCommon = useTranslations("common");

  const [residents, setResidents] = useState<ResidentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ResidentStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<ResidentType | "">("");

  const [addOpen, setAddOpen] = useState(false);
  const [isAdding, startAddTransition] = useTransition();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [units, setUnits] = useState<UnitWithFloor[]>([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await residentService.getAll({ limit: 1000 });
      setResidents(res.data);
    } catch {
      toast.error(tCommon("status.error"));
    } finally {
      setIsLoading(false);
    }
  }, [tCommon]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadDialogData = useCallback(async () => {
    const [u, un] = await Promise.all([userService.getAll(), unitService.getAll()]);
    setUsers(u);
    setUnits(un);
  }, []);

  useEffect(() => {
    if (addOpen) void loadDialogData();
  }, [addOpen, loadDialogData]);

  const handleAdd = async (data: CreateResidentRequest) => {
    startAddTransition(async () => {
      try {
        const resident = await residentService.create(data);
        setResidents((prev) => [resident as unknown as ResidentListItem, ...prev]);
        toast.success(t("createSuccess"));
        setAddOpen(false);
      } catch (err) {
        const e = err as ApiError;
        toast.error(e.message ?? tCommon("status.error"));
      }
    });
  };

  // Summary counts
  const ownerCount = useMemo(
    () => residents.filter((r) => r.residentType === "OWNER").length,
    [residents],
  );
  const tenantCount = useMemo(
    () => residents.filter((r) => r.residentType === "TENANT").length,
    [residents],
  );

  // Client-side filtering
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return residents.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (typeFilter && r.residentType !== typeFilter) return false;
      if (q) {
        const name = `${r.user.firstName} ${r.user.lastName}`.toLowerCase();
        const email = r.user.email.toLowerCase();
        const unit = r.unit.unitNumber.toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !unit.includes(q)) return false;
      }
      return true;
    });
  }, [residents, search, statusFilter, typeFilter]);

  const isFiltered = search.trim() || statusFilter || typeFilter;

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
          <p className="text-muted-foreground mt-1 text-xs">
            {t("summary.total", { total: residents.length })} ·{" "}
            <span className="text-blue-600 dark:text-blue-400">
              {t("summary.owners", { count: ownerCount })}
            </span>
            {" · "}
            <span className="text-amber-600 dark:text-amber-400">
              {t("summary.tenants", { count: tenantCount })}
            </span>
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="cursor-pointer gap-2" size="sm">
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
          onChange={(e) => setSearch(e.target.value)}
          className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-9 w-full min-w-0 rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none sm:flex-1"
        />
        <div className="flex flex-col gap-1 sm:shrink-0 sm:flex-row sm:items-center sm:gap-1">
          {/* Status filters */}
          <div className="flex gap-1">
          {(["", "ACTIVE", "INACTIVE"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s === "" ? t("filterAll") : s === "ACTIVE" ? t("filterActive") : t("filterInactive")}
            </button>
          ))}
          </div>
          <div className="bg-border hidden h-4 w-px sm:block" />
          {/* Type filters */}
          <div className="flex gap-1">
          {(["", "OWNER", "TENANT"] as const).map((tp) => (
            <button
              key={tp}
              onClick={() => setTypeFilter(tp)}
              className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                typeFilter === tp
                  ? tp === "OWNER"
                    ? "bg-blue-600 text-white dark:bg-blue-500"
                    : tp === "TENANT"
                      ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-900"
                      : "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tp === "" ? t("filterAllType") : t(`residentType.${tp}`)}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Count when filtered */}
      {isFiltered && (
        <p className="text-muted-foreground -mt-3 text-xs">
          {t("filterResult", { count: filtered.length, total: residents.length })}
        </p>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-card border-border flex flex-col items-center gap-3 rounded-xl border py-16 text-center">
          <Users className="text-muted-foreground h-8 w-8" />
          <p className="text-foreground font-medium">{t("noResidents")}</p>
        </div>
      ) : (
        <div className="bg-card border-border divide-border divide-y rounded-xl border">
          {filtered.map((r) => (
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
                {/* Type badge */}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    r.residentType === "OWNER"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  {t(`residentType.${r.residentType}`)}
                </span>
                {/* Status badge */}
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
