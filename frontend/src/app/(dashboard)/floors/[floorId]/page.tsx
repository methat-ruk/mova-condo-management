"use client";

import { ArrowLeft, BedDouble, Bath, Plus, Trash2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UnitFormDialog, type UnitFormData } from "@/components/shared/UnitFormDialog";
import { Button } from "@/components/ui/button";
import { floorService } from "@/services/floorService";
import { unitService } from "@/services/unitService";
import type { ApiError } from "@/types";
import type { Floor, OccupancyStatus, Unit } from "@/types/building";
import { getSizeKey, sqmToDimensions } from "@/utils/unit";

const STATUS_FILTER_OPTIONS = ["ALL", "AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"] as const;
type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number];

export default function FloorUnitsPage() {
  const { floorId } = useParams<{ floorId: string }>();
  const t = useTranslations("buildings");
  const tCommon = useTranslations("common");

  const [floor, setFloor] = useState<Floor | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);
  const [editTarget, setEditTarget] = useState<Unit | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [f, u] = await Promise.all([
        floorService.getOne(floorId),
        unitService.getByFloor(floorId),
      ]);
      setFloor(f);
      setUnits(u);
    } catch {
      toast.error(tCommon("status.error"));
    } finally {
      setIsLoading(false);
    }
  }, [floorId, tCommon]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const matchStatus = statusFilter === "ALL" || u.occupancyStatus === statusFilter;
      const matchSearch =
        search.trim() === "" || u.unitNumber.toLowerCase().includes(search.trim().toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [units, statusFilter, search]);

  const handleOpenAdd = () => {
    setEditTarget(undefined);
    setFormOpen(true);
  };
  const handleOpenEdit = (unit: Unit) => {
    setEditTarget(unit);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: UnitFormData) => {
    setIsSubmitting(true);
    try {
      if (editTarget) {
        const updated = await unitService.update(editTarget.id, data);
        setUnits((prev) => prev.map((u) => (u.id === editTarget.id ? updated : u)));
        toast.success(t("units.updateSuccess", { number: data.unitNumber }));
      } else {
        const created = await unitService.create(floorId, data);
        setUnits((prev) => [...prev, created]);
        toast.success(t("units.createSuccess", { number: data.unitNumber }));
      }
      setFormOpen(false);
    } catch (err) {
      const e = err as ApiError;
      toast.error(e.message ?? tCommon("status.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      try {
        await unitService.remove(deleteTarget.id);
        setUnits((prev) => prev.filter((u) => u.id !== deleteTarget.id));
        toast.success(t("units.deleteSuccess", { number: deleteTarget.unitNumber }));
        setDeleteTarget(null);
      } catch (err) {
        const e = err as ApiError;
        toast.error(e.message ?? tCommon("status.error"));
      }
    });
  };

  const STATUS_LABELS: Record<OccupancyStatus, string> = {
    AVAILABLE: t("units.status.AVAILABLE"),
    OCCUPIED: t("units.status.OCCUPIED"),
    RESERVED: t("units.status.RESERVED"),
    MAINTENANCE: t("units.status.MAINTENANCE"),
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border-border space-y-3 rounded-xl border p-5">
              <div className="bg-muted h-4 w-1/3 animate-pulse rounded" />
              <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/floors" />}
          className="mt-0.5 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h1 className="text-foreground text-2xl font-bold">
              {t("floors.floorNumber")} {floor?.floorNumber}
            </h1>
            <Button className="cursor-pointer gap-2" size="sm" onClick={handleOpenAdd}>
              <Plus className="h-4 w-4" />
              {t("units.addUnit")}
            </Button>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {filteredUnits.length !== units.length
              ? `${filteredUnits.length} / ${units.length}`
              : units.length}{" "}
            {t("units.title")}
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      {units.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <input
            type="text"
            placeholder={t("units.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-9 w-full min-w-0 rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none sm:flex-1"
          />
          <div className="flex w-full flex-col gap-x-1 gap-y-2 sm:w-auto sm:shrink-0 sm:flex-row sm:flex-wrap">
            {/* Row 1: ALL + AVAILABLE + OCCUPIED */}
            <div className="flex gap-1 sm:contents">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                  statusFilter === "ALL"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {t("units.filterAll")}
              </button>
              <button
                onClick={() => setStatusFilter("AVAILABLE")}
                className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                  statusFilter === "AVAILABLE"
                    ? "bg-green-600 text-white dark:bg-green-500"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {STATUS_LABELS.AVAILABLE}
              </button>
              <button
                onClick={() => setStatusFilter("OCCUPIED")}
                className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                  statusFilter === "OCCUPIED"
                    ? "bg-blue-600 text-white dark:bg-blue-500"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {STATUS_LABELS.OCCUPIED}
              </button>
            </div>
            {/* Row 2: RESERVED + MAINTENANCE */}
            <div className="flex gap-1 sm:contents">
              <button
                onClick={() => setStatusFilter("RESERVED")}
                className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                  statusFilter === "RESERVED"
                    ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-900"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {STATUS_LABELS.RESERVED}
              </button>
              <button
                onClick={() => setStatusFilter("MAINTENANCE")}
                className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                  statusFilter === "MAINTENANCE"
                    ? "bg-red-600 text-white dark:bg-red-500"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {STATUS_LABELS.MAINTENANCE}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Units grid */}
      {filteredUnits.length === 0 ? (
        <div className="bg-card border-border flex flex-col items-center gap-3 rounded-xl border py-12 text-center">
          <p className="text-muted-foreground text-sm">
            {units.length === 0 ? t("units.noUnits") : tCommon("status.noData")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUnits.map((unit) => {
            const dim = sqmToDimensions(unit.area);
            const sizeKey = getSizeKey(unit.area);
            return (
              <div
                key={unit.id}
                className="bg-card border-border hover:border-primary/40 rounded-xl border p-5 transition-colors"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-foreground font-semibold">{unit.unitNumber}</p>
                      {sizeKey && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            sizeKey === "S"
                              ? "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300"
                              : sizeKey === "M"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                                : sizeKey === "L"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                                  : "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
                          }`}
                        >
                          {sizeKey}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {unit.area} {t("units.sqm")}
                      {" · "}
                      {t("units.dimensions", { w: dim.w, h: dim.h })}
                    </p>
                  </div>
                  <StatusBadge
                    status={unit.occupancyStatus}
                    label={STATUS_LABELS[unit.occupancyStatus]}
                  />
                </div>
                <div className="text-muted-foreground mb-4 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <BedDouble className="h-3.5 w-3.5" />
                    {t("units.bedroomCount", { count: unit.bedrooms })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="h-3.5 w-3.5" />
                    {t("units.bathroomCount", { count: unit.bathrooms })}
                  </span>
                  <span className="text-foreground ml-auto text-sm font-medium">
                    {t("units.monthlyRentDisplay", {
                      amount: Number(unit.monthlyRent).toLocaleString(),
                    })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 cursor-pointer gap-1"
                    onClick={() => handleOpenEdit(unit)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {tCommon("actions.edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 cursor-pointer"
                    onClick={() => setDeleteTarget(unit)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <UnitFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        defaultValues={editTarget}
        isPending={isSubmitting}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title={t("units.deleteConfirmTitle")}
        description={t("units.deleteConfirmDesc")}
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
    </div>
  );
}
