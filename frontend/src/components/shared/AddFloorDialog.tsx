"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AddFloorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (floorNumber: number) => Promise<void>;
  isPending?: boolean;
}

export function AddFloorDialog({ open, onOpenChange, onSubmit, isPending }: AddFloorDialogProps) {
  const t = useTranslations("buildings");
  const tCommon = useTranslations("common");

  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleOpenChange = (o: boolean) => {
    if (o) {
      setValue("");
      setError("");
    }
    onOpenChange(o);
  };

  const validate = (v: string): string => {
    const n = Number(v);
    if (!v || isNaN(n) || !Number.isInteger(n)) return t("floors.validation.mustBeInteger");
    if (n < 1) return t("floors.validation.mustBePositive");
    return "";
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const err = validate(value);
    if (err) {
      setError(err);
      return;
    }
    await onSubmit(Number(value));
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Popup className="bg-card border-border fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border shadow-xl outline-none">
          <div className="border-border flex items-center justify-between border-b px-6 py-4">
            <Dialog.Title className="text-foreground text-base font-semibold">
              {t("floors.addFloor")}
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
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5 px-6 py-5">
              <label className="text-foreground text-sm font-medium" htmlFor="floorNumber">
                {t("floors.floorNumber")} <span className="text-destructive">*</span>
              </label>
              <input
                id="floorNumber"
                type="number"
                min={1}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError("");
                }}
                onBlur={() => {
                  const err = validate(value);
                  if (err) setError(err);
                }}
                className={`border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none ${error ? "border-destructive focus:ring-destructive/30" : ""}`}
              />
              {error && <p className="text-destructive text-xs">{error}</p>}
            </div>
            <div className="border-border flex items-center justify-end gap-3 border-t px-6 py-4">
              <Dialog.Close
                disabled={isPending}
                className="border-border bg-background text-foreground hover:bg-muted inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {tCommon("actions.cancel")}
              </Dialog.Close>
              <Button type="submit" disabled={isPending} className="cursor-pointer">
                {isPending ? tCommon("status.loading") : tCommon("actions.create")}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
