"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/ui/select-input";
import type { UnitWithFloor } from "@/services/unitService";
import type { ResidentListItem } from "@/types/resident";
import type { CreateVisitorRequest } from "@/types/visitor";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateVisitorRequest) => Promise<void>;
  isPending?: boolean;
  units: UnitWithFloor[];
  residents: ResidentListItem[];
}

interface FormErrors {
  name?: string;
  unitId?: string;
}

function CheckInForm({
  onSubmit,
  isPending,
  units,
  residents,
}: Omit<Props, "open" | "onOpenChange">) {
  const t = useTranslations("visitors");
  const tCommon = useTranslations("common");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [groupSize, setGroupSize] = useState(1);
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
    if (!name.trim()) next.name = t("validation.nameRequired");
    if (!unitId) next.unitId = t("validation.unitRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      name: name.trim(),
      phone: phone.trim() || undefined,
      purpose: purpose.trim() || undefined,
      vehiclePlate: vehiclePlate.trim() || undefined,
      groupSize: groupSize > 1 ? groupSize : undefined,
      unitId,
      residentId: residentId || undefined,
    });
  };

  const inputBase =
    "border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none";
  const inputClass = (err?: string) =>
    `${inputBase}${err ? " border-destructive focus:ring-destructive/30" : ""}`;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium">
            {t("fields.name")} <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((p) => ({ ...p, name: undefined }));
            }}
            placeholder={t("fields.name")}
            className={inputClass(errors.name)}
          />
          {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium">{t("fields.phone")}</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("fields.phone")}
            className={inputBase}
          />
        </div>

        {/* Purpose */}
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium">{t("fields.purpose")}</label>
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder={t("fields.purpose")}
            className={inputBase}
          />
        </div>

        {/* Vehicle Plate */}
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium">{t("fields.vehiclePlate")}</label>
          <input
            type="text"
            value={vehiclePlate}
            onChange={(e) => setVehiclePlate(e.target.value)}
            placeholder={t("fields.vehiclePlate")}
            className={inputBase}
          />
        </div>

        {/* Group Size */}
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium">{t("fields.groupSize")}</label>
          <input
            type="number"
            min={1}
            value={groupSize}
            onChange={(e) => setGroupSize(Math.max(1, parseInt(e.target.value) || 1))}
            className={inputBase}
          />
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
            <label className="text-foreground text-sm font-medium">{t("fields.resident")}</label>
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
      </div>

      <div className="border-border flex items-center justify-end gap-3 border-t px-6 py-4">
        <Dialog.Close
          disabled={isPending}
          className="border-border bg-background text-foreground hover:bg-muted inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {tCommon("actions.cancel")}
        </Dialog.Close>
        <Button type="submit" disabled={isPending} className="cursor-pointer">
          {isPending ? tCommon("status.loading") : t("checkIn")}
        </Button>
      </div>
    </form>
  );
}

export function VisitorCheckInDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  units,
  residents,
}: Props) {
  const t = useTranslations("visitors");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Popup className="bg-card border-border fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border shadow-xl outline-none">
          <div className="border-border flex items-center justify-between border-b px-6 py-4">
            <Dialog.Title className="text-foreground text-base font-semibold">
              {t("checkIn")}
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
            <CheckInForm
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
