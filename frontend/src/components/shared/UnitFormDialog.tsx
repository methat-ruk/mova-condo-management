"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { OccupancyStatus, Unit } from "@/types/building";
import { SelectInput } from "@/components/ui/select-input";
import { sqmToDimensions, UNIT_SIZES, type UnitSize } from "@/utils/unit";

interface UnitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UnitFormData) => Promise<void>;
  defaultValues?: Unit;
  isPending?: boolean;
}

export interface UnitFormData {
  unitNumber: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  occupancyStatus: OccupancyStatus;
  monthlyRent: number;
}

const STATUS_OPTIONS: OccupancyStatus[] = ["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"];

function getSizeFromUnit(unit?: Unit): UnitSize["key"] {
  if (!unit) return "S";
  const found = UNIT_SIZES.find((s) => s.area === unit.area);
  return found ? found.key : "S";
}

interface FormErrors {
  unitNumber?: string;
  monthlyRent?: string;
}

interface UnitFormProps {
  onSubmit: (data: UnitFormData) => Promise<void>;
  defaultValues?: Unit;
  isPending?: boolean;
  isEdit: boolean;
}

function UnitForm({ onSubmit, defaultValues, isPending, isEdit }: UnitFormProps) {
  const t = useTranslations("buildings");
  const tCommon = useTranslations("common");

  const [unitNumber, setUnitNumber] = useState(defaultValues?.unitNumber ?? "");
  const [sizeKey, setSizeKey] = useState<UnitSize["key"]>(getSizeFromUnit(defaultValues));
  const [occupancyStatus, setOccupancyStatus] = useState<OccupancyStatus>(
    defaultValues?.occupancyStatus ?? "AVAILABLE",
  );
  const [monthlyRent, setMonthlyRent] = useState(
    defaultValues?.monthlyRent ? String(defaultValues.monthlyRent) : "",
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const selectedSize = UNIT_SIZES.find((s) => s.key === sizeKey)!;

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!unitNumber.trim()) next.unitNumber = t("units.validation.unitNumberRequired");
    const r = Number(monthlyRent);
    if (!monthlyRent || isNaN(r) || r < 0)
      next.monthlyRent = t("units.validation.monthlyRentInvalid");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      unitNumber: unitNumber.trim(),
      area: selectedSize.area,
      bedrooms: selectedSize.bedrooms,
      bathrooms: selectedSize.bathrooms,
      occupancyStatus,
      monthlyRent: Number(monthlyRent),
    });
  };

  const inputClass = (hasError?: string) =>
    `border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none ${hasError ? "border-destructive focus:ring-destructive/30" : ""}`;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4 px-6 py-5">
        {/* Unit Number */}
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium" htmlFor="unitNumber">
            {t("units.fields.unitNumber")} <span className="text-destructive">*</span>
          </label>
          <input
            id="unitNumber"
            type="text"
            value={unitNumber}
            onChange={(e) => {
              setUnitNumber(e.target.value);
              setErrors((p) => ({ ...p, unitNumber: undefined }));
            }}
            onBlur={() => {
              if (!unitNumber.trim())
                setErrors((p) => ({ ...p, unitNumber: t("units.validation.unitNumberRequired") }));
            }}
            placeholder="A101"
            className={inputClass(errors.unitNumber)}
          />
          {errors.unitNumber && <p className="text-destructive text-xs">{errors.unitNumber}</p>}
        </div>

        {/* Size */}
        <div className="space-y-2">
          <label className="text-foreground text-sm font-medium">{t("units.size")}</label>
          <div className="grid grid-cols-4 gap-2">
            {UNIT_SIZES.map((size) => {
              const dim = sqmToDimensions(size.area);
              const isSelected = sizeKey === size.key;
              return (
                <button
                  key={size.key}
                  type="button"
                  onClick={() => setSizeKey(size.key)}
                  className={`cursor-pointer rounded-lg border px-2 py-2.5 text-center transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <p className="text-base font-bold">{size.key}</p>
                  <p className="mt-0.5 text-[10px]">{size.area} ตร.ม.</p>
                  <p className="text-[10px]">
                    {dim.w}x{dim.h} ม.
                  </p>
                </button>
              );
            })}
          </div>
          {/* Selected size detail */}
          <p className="text-muted-foreground text-xs">
            {selectedSize.bedrooms} {t("units.fields.bedrooms").toLowerCase()} ·{" "}
            {selectedSize.bathrooms} {t("units.fields.bathrooms").toLowerCase()}
          </p>
        </div>

        {/* Monthly Rent */}
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium" htmlFor="monthlyRent">
            {t("units.fields.monthlyRent")} <span className="text-destructive">*</span>
          </label>
          <input
            id="monthlyRent"
            type="number"
            min={0}
            value={monthlyRent}
            onChange={(e) => {
              setMonthlyRent(e.target.value);
              setErrors((p) => ({ ...p, monthlyRent: undefined }));
            }}
            onBlur={() => {
              const r = Number(monthlyRent);
              if (!monthlyRent || isNaN(r) || r < 0)
                setErrors((p) => ({
                  ...p,
                  monthlyRent: t("units.validation.monthlyRentInvalid"),
                }));
            }}
            placeholder="8000"
            className={inputClass(errors.monthlyRent)}
          />
          {errors.monthlyRent && <p className="text-destructive text-xs">{errors.monthlyRent}</p>}
        </div>

        {/* Occupancy Status */}
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium" htmlFor="occupancyStatus">
            {t("units.fields.status")}
          </label>
          <SelectInput
            id="occupancyStatus"
            value={occupancyStatus}
            onChange={(e) => setOccupancyStatus(e.target.value as OccupancyStatus)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {t(`units.status.${s}`)}
              </option>
            ))}
          </SelectInput>
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
          {isPending
            ? tCommon("status.loading")
            : isEdit
              ? tCommon("actions.update")
              : tCommon("actions.create")}
        </Button>
      </div>
    </form>
  );
}

export function UnitFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isPending,
}: UnitFormDialogProps) {
  const t = useTranslations("buildings");
  const isEdit = !!defaultValues;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Popup className="bg-card border-border fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border shadow-xl outline-none">
          <div className="border-border flex items-center justify-between border-b px-6 py-4">
            <Dialog.Title className="text-foreground text-base font-semibold">
              {isEdit ? t("units.editUnit") : t("units.addUnit")}
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 cursor-pointer rounded-lg p-1 transition-colors focus:outline-none focus-visible:ring-2">
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
          <UnitForm
            key={defaultValues?.id ?? "new"}
            onSubmit={onSubmit}
            defaultValues={defaultValues}
            isPending={isPending}
            isEdit={isEdit}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
