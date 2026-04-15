"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface MoveOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (moveOutDate?: string) => Promise<void>;
  isPending?: boolean;
}

export function MoveOutDialog({ open, onOpenChange, onConfirm, isPending }: MoveOutDialogProps) {
  const t = useTranslations("residents");
  const tCommon = useTranslations("common");

  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().slice(0, 10));

  const handleConfirm = async () => {
    await onConfirm(moveOutDate || undefined);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Popup className="bg-card border-border fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border shadow-xl outline-none">
          <div className="border-border flex items-center justify-between border-b px-6 py-4">
            <Dialog.Title className="text-foreground text-base font-semibold">
              {t("moveOutTitle")}
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

          <div className="space-y-4 px-6 py-5">
            <p className="text-muted-foreground text-sm">{t("moveOutDesc")}</p>
            <div className="space-y-1.5">
              <label className="text-foreground text-sm font-medium" htmlFor="moveOutDate">
                {t("moveOutDateLabel")}
              </label>
              <input
                id="moveOutDate"
                type="date"
                value={moveOutDate}
                onChange={(e) => setMoveOutDate(e.target.value)}
                onKeyDown={(e) => e.preventDefault()}
                className="border-input bg-background text-foreground focus:ring-ring w-full cursor-pointer rounded-lg border px-3 py-2 text-sm scheme-light focus:ring-2 focus:outline-none dark:scheme-dark"
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
            <Button
              onClick={handleConfirm}
              disabled={isPending}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer text-white"
            >
              {isPending ? tCommon("status.loading") : tCommon("actions.confirm")}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
