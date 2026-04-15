"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Building } from "@/types/building";

interface BuildingEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BuildingFormData) => Promise<void>;
  defaultValues: Building;
  isPending?: boolean;
}

export interface BuildingFormData {
  name: string;
  address: string;
  description?: string;
}

interface FormErrors {
  name?: string;
  address?: string;
}

interface FormProps {
  onSubmit: (data: BuildingFormData) => Promise<void>;
  defaultValues: Building;
  isPending?: boolean;
}

function BuildingForm({ onSubmit, defaultValues, isPending }: FormProps) {
  const t = useTranslations("building");
  const tCommon = useTranslations("common");

  const [name, setName] = useState(defaultValues.name);
  const [address, setAddress] = useState(defaultValues.address);
  const [description, setDescription] = useState(defaultValues.description ?? "");
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!name.trim()) next.name = t("validation.nameRequired");
    if (!address.trim()) next.address = t("validation.addressRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      name: name.trim(),
      address: address.trim(),
      description: description.trim() || undefined,
    });
  };

  const inputClass = (hasError?: string) =>
    `border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none ${hasError ? "border-destructive focus:ring-destructive/30" : ""}`;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4 px-6 py-5">
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium" htmlFor="buildingName">
            {t("fields.name")} <span className="text-destructive">*</span>
          </label>
          <input
            id="buildingName"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((p) => ({ ...p, name: undefined }));
            }}
            onBlur={() => {
              if (!name.trim()) setErrors((p) => ({ ...p, name: t("validation.nameRequired") }));
            }}
            className={inputClass(errors.name)}
          />
          {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium" htmlFor="buildingAddress">
            {t("fields.address")} <span className="text-destructive">*</span>
          </label>
          <input
            id="buildingAddress"
            type="text"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setErrors((p) => ({ ...p, address: undefined }));
            }}
            onBlur={() => {
              if (!address.trim())
                setErrors((p) => ({ ...p, address: t("validation.addressRequired") }));
            }}
            className={inputClass(errors.address)}
          />
          {errors.address && <p className="text-destructive text-xs">{errors.address}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium" htmlFor="buildingDescription">
            {t("fields.description")}
          </label>
          <textarea
            id="buildingDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          />
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
          {isPending ? tCommon("status.loading") : tCommon("actions.update")}
        </Button>
      </div>
    </form>
  );
}

export function BuildingEditDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isPending,
}: BuildingEditDialogProps) {
  const t = useTranslations("building");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Popup className="bg-card border-border fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border shadow-xl outline-none">
          <div className="border-border flex items-center justify-between border-b px-6 py-4">
            <Dialog.Title className="text-foreground text-base font-semibold">
              {t("editTitle")}
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
          <BuildingForm
            key={defaultValues.id}
            onSubmit={onSubmit}
            defaultValues={defaultValues}
            isPending={isPending}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
