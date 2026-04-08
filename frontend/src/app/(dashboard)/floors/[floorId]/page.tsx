"use client";

import { ArrowLeft, BedDouble, Bath, Plus, Trash2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UnitFormDialog, type UnitFormData } from "@/components/shared/UnitFormDialog";
import { Button } from "@/components/ui/button";
import { floorService } from "@/services/floorService";
import { unitService } from "@/services/unitService";
import type { ApiError } from "@/types";
import type { Floor, OccupancyStatus, Unit } from "@/types/building";
import { sqmToDimensions } from "@/utils/unit";

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

  useEffect(() => { void load(); }, [load]);

  const handleOpenAdd = () => { setEditTarget(undefined); setFormOpen(true); };
  const handleOpenEdit = (unit: Unit) => { setEditTarget(unit); setFormOpen(true); };

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
            <div key={i} className="bg-card border-border rounded-xl border p-5 space-y-3">
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
        <Button variant="ghost" size="icon" render={<Link href="/floors" />} className="mt-0.5 cursor-pointer">
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
            {units.length} {t("units.title")}
          </p>
        </div>
      </div>

      {/* Units grid */}
      {units.length === 0 ? (
        <div className="bg-card border-border flex flex-col items-center gap-3 rounded-xl border py-12 text-center">
          <p className="text-muted-foreground text-sm">{t("units.noUnits")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {units.map((unit) => {
            const dim = sqmToDimensions(unit.area);
            return (
              <div
                key={unit.id}
                className="bg-card border-border hover:border-primary/40 rounded-xl border p-5 transition-colors"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="text-foreground font-semibold">{unit.unitNumber}</p>
                    <p className="text-muted-foreground text-xs">
                      {unit.area} {t("units.sqm")}
                      {" · "}
                      {t("units.dimensions", { w: dim.w, h: dim.h })}
                    </p>
                  </div>
                  <StatusBadge status={unit.occupancyStatus} label={STATUS_LABELS[unit.occupancyStatus]} />
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
                  <span className="ml-auto font-medium text-sm text-foreground">
                    {t("units.monthlyRentDisplay", { amount: Number(unit.monthlyRent).toLocaleString() })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 cursor-pointer gap-1" onClick={() => handleOpenEdit(unit)}>
                    <Pencil className="h-3.5 w-3.5" />
                    {tCommon("actions.edit")}
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 cursor-pointer" onClick={() => setDeleteTarget(unit)}>
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
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title={t("units.deleteConfirmTitle")}
        description={t("units.deleteConfirmDesc")}
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
    </div>
  );
}
