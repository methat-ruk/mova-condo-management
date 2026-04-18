"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/ui/select-input";
import type { UnitWithFloor } from "@/services/unitService";
import type { ResidentListItem } from "@/types/resident";
import type { CreateTicketRequest, MaintenanceCategory } from "@/types/maintenance";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTicketRequest) => Promise<void>;
  isPending?: boolean;
  units: UnitWithFloor[];
  residents: ResidentListItem[];
}

interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
  unitId?: string;
}

const CATEGORIES: MaintenanceCategory[] = [
  "ELECTRICAL",
  "PLUMBING",
  "HVAC",
  "STRUCTURAL",
  "APPLIANCE",
  "OTHER",
];

function MaintenanceForm({
  onSubmit,
  isPending,
  units,
  residents,
}: Omit<Props, "open" | "onOpenChange">) {
  const t = useTranslations("maintenance");
  const tCommon = useTranslations("common");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MaintenanceCategory | "">("");
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [residentId, setResidentId] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const floors = useMemo(() => {
    const seen = new Set<string>();
    return units
      .filter((u) => {
        if (seen.has(u.floor.id)) return false;
        seen.add(u.floor.id);
        return true;
      })
      .map((u) => u.floor)
      .sort((a, b) => a.floorNumber - b.floorNumber);
  }, [units]);

  const filteredUnits = useMemo(
    () =>
      selectedFloorId
        ? units
            .filter((u) => u.floor.id === selectedFloorId)
            .sort((a, b) => a.unitNumber.localeCompare(b.unitNumber))
        : [],
    [units, selectedFloorId],
  );

  const filteredResidents = useMemo(
    () => residents.filter((r) => r.unitId === unitId && r.status === "ACTIVE"),
    [residents, unitId],
  );

  const handleFloorChange = (fId: string) => {
    setSelectedFloorId(fId);
    setUnitId("");
    setResidentId("");
    setErrors((p) => ({ ...p, unitId: undefined }));
  };

  const handleUnitChange = (uId: string) => {
    setUnitId(uId);
    setResidentId("");
    setErrors((p) => ({ ...p, unitId: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!title.trim()) next.title = t("validation.titleRequired");
    if (!description.trim()) next.description = t("validation.descriptionRequired");
    if (!category) next.category = t("validation.categoryRequired");
    if (!unitId) next.unitId = t("validation.unitRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      category: category as MaintenanceCategory,
      unitId,
      residentId: residentId || undefined,
    });
  };

  const inputBase =
    "border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium">
            {t("fields.title")} <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErrors((p) => ({ ...p, title: undefined }));
            }}
            placeholder={t("fields.title")}
            className={`${inputBase} ${errors.title ? "border-destructive" : ""}`}
          />
          {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium">
            {t("fields.category")} <span className="text-destructive">*</span>
          </label>
          <SelectInput
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as MaintenanceCategory);
              setErrors((p) => ({ ...p, category: undefined }));
            }}
            className={errors.category ? "border-destructive" : ""}
          >
            <option value="">— {t("fields.category")} —</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`category.${c}`)}
              </option>
            ))}
          </SelectInput>
          {errors.category && <p className="text-destructive text-xs">{errors.category}</p>}
        </div>

        {/* Floor → Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-foreground text-sm font-medium">
              {t("fields.floor")} <span className="text-destructive">*</span>
            </label>
            <SelectInput
              value={selectedFloorId}
              onChange={(e) => handleFloorChange(e.target.value)}
            >
              <option value="">— {t("fields.floor")} —</option>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {t("fields.floor")} {f.floorNumber}
                </option>
              ))}
            </SelectInput>
          </div>
          <div className="space-y-1.5">
            <label className="text-foreground text-sm font-medium">
              {t("fields.unit")} <span className="text-destructive">*</span>
            </label>
            <SelectInput
              value={unitId}
              onChange={(e) => handleUnitChange(e.target.value)}
              disabled={!selectedFloorId}
              className={errors.unitId ? "border-destructive" : ""}
            >
              <option value="">— {t("fields.unit")} —</option>
              {filteredUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unitNumber}
                </option>
              ))}
            </SelectInput>
            {errors.unitId && <p className="text-destructive text-xs">{errors.unitId}</p>}
          </div>
        </div>

        {/* Resident (optional) */}
        {unitId && (
          <div className="space-y-1.5">
            <label className="text-foreground text-sm font-medium">
              {t("fields.resident")}{" "}
              <span className="text-muted-foreground font-normal">({t("fields.optional")})</span>
            </label>
            <SelectInput value={residentId} onChange={(e) => setResidentId(e.target.value)}>
              <option value="">— {t("fields.optional")} —</option>
              {filteredResidents.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.user.firstName} {r.user.lastName}
                </option>
              ))}
            </SelectInput>
          </div>
        )}

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium">
            {t("fields.description")} <span className="text-destructive">*</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setErrors((p) => ({ ...p, description: undefined }));
            }}
            placeholder={t("fields.description")}
            className={`${inputBase} resize-none ${errors.description ? "border-destructive" : ""}`}
          />
          {errors.description && <p className="text-destructive text-xs">{errors.description}</p>}
        </div>
      </div>

      <div className="border-border flex items-center justify-end gap-3 border-t px-6 py-4">
        <Dialog.Close
          disabled={isPending}
          className="border-border bg-background text-foreground hover:bg-muted inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {tCommon("actions.cancel")}
        </Dialog.Close>
        <Button type="submit" disabled={isPending} className="cursor-pointer">
          {isPending ? tCommon("status.loading") : t("newTicket")}
        </Button>
      </div>
    </form>
  );
}

export function MaintenanceFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  units,
  residents,
}: Props) {
  const t = useTranslations("maintenance");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Popup className="bg-card border-border fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border shadow-xl outline-none">
          <div className="border-border flex items-center justify-between border-b px-6 py-4">
            <Dialog.Title className="text-foreground text-base font-semibold">
              {t("newTicket")}
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground cursor-pointer rounded-lg p-1 transition-colors focus:outline-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </Dialog.Close>
          </div>
          {open && (
            <MaintenanceForm
              onSubmit={onSubmit}
              isPending={isPending}
              units={units}
              residents={residents}
            />
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
