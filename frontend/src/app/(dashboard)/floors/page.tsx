"use client";

import { Building2, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { AddFloorDialog } from "@/components/shared/AddFloorDialog";
import { BuildingEditDialog, type BuildingFormData } from "@/components/shared/BuildingEditDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { buildingService } from "@/services/buildingService";
import { floorService } from "@/services/floorService";
import type { ApiError } from "@/types";
import type { Building, Floor } from "@/types/building";

export default function FloorsPage() {
  const t = useTranslations("buildings");
  const tCommon = useTranslations("common");

  const [building, setBuilding] = useState<Building | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Floor | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isEditingBuilding, setIsEditingBuilding] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await buildingService.getAll({ limit: 1 });
      const b = res.data[0] ?? null;
      setBuilding(b);
      if (b) {
        const f = await floorService.getByBuilding(b.id);
        setFloors(f);
      }
    } catch {
      toast.error(tCommon("status.error"));
    } finally {
      setIsLoading(false);
    }
  }, [tCommon]);

  useEffect(() => {
    void load();
  }, [load]);

  const tBuilding = useTranslations("building");

  const handleEditBuilding = async (data: BuildingFormData) => {
    if (!building) return;
    setIsEditingBuilding(true);
    try {
      const updated = await buildingService.update(building.id, data);
      setBuilding(updated);
      toast.success(tBuilding("updateSuccess"));
      setEditOpen(false);
    } catch (err) {
      const e = err as ApiError;
      toast.error(e.message ?? tCommon("status.error"));
    } finally {
      setIsEditingBuilding(false);
    }
  };

  const handleAddFloor = async (floorNumber: number) => {
    if (!building) return;
    setIsAdding(true);
    try {
      const floor = await floorService.create(building.id, { floorNumber });
      setFloors((prev) => [...prev, floor].sort((a, b) => a.floorNumber - b.floorNumber));
      toast.success(t("floors.addSuccess", { number: floorNumber }));
      setAddOpen(false);
    } catch (err) {
      const e = err as ApiError;
      toast.error(e.message ?? tCommon("status.error"));
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteFloor = () => {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      try {
        await floorService.remove(deleteTarget.id);
        setFloors((prev) => prev.filter((f) => f.id !== deleteTarget.id));
        toast.success(t("floors.deleteSuccess", { number: deleteTarget.floorNumber }));
        setDeleteTarget(null);
      } catch (err) {
        const e = err as ApiError;
        toast.error(e.message ?? tCommon("status.error"));
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="bg-card border-border space-y-3 rounded-xl border p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted h-4 w-full animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-foreground text-2xl font-bold">{building?.name ?? "Mova Condo"}</h1>
          {building && (
            <Button size="sm" className="cursor-pointer gap-1.5" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
              {tCommon("actions.edit")}
            </Button>
          )}
        </div>
        {building?.address && (
          <p className="text-muted-foreground mt-1 text-sm">{building.address}</p>
        )}
      </div>

      {/* Floors */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground font-semibold">{t("floors.title")}</h2>
            <p className="text-muted-foreground text-xs">
              {t("floors.totalFloors", { count: floors.length })}
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)} className="cursor-pointer gap-2" size="sm">
            <Plus className="h-4 w-4" />
            {t("floors.addFloor")}
          </Button>
        </div>

        {floors.length === 0 ? (
          <div className="bg-card border-border flex flex-col items-center gap-3 rounded-xl border py-16 text-center">
            <Layers className="text-muted-foreground h-8 w-8" />
            <p className="text-foreground font-medium">{t("floors.noFloors")}</p>
          </div>
        ) : (
          <div className="bg-card border-border divide-border divide-y rounded-xl border">
            {floors.map((floor) => {
              const unitCount = floor._count?.units ?? 0;
              return (
                <div
                  key={floor.id}
                  className="hover:bg-muted/40 flex items-center justify-between px-6 py-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="text-muted-foreground h-4 w-4" />
                    <div>
                      <p className="text-foreground text-sm font-medium">
                        {t("floors.floorNumber")} {floor.floorNumber}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {unitCount} {t("floors.unitsCount")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={`/floors/${floor.id}`} />}
                      className="cursor-pointer"
                    >
                      {tCommon("actions.view")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 cursor-pointer disabled:opacity-40"
                      disabled={unitCount > 0}
                      title={unitCount > 0 ? t("floors.hasUnits") : undefined}
                      onClick={() => setDeleteTarget(floor)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {building && (
        <BuildingEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          onSubmit={handleEditBuilding}
          defaultValues={building}
          isPending={isEditingBuilding}
        />
      )}

      <AddFloorDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAddFloor}
        isPending={isAdding}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title={t("floors.deleteConfirmTitle")}
        description={t("floors.deleteConfirmDesc")}
        onConfirm={handleDeleteFloor}
        isPending={isDeleting}
      />
    </div>
  );
}
