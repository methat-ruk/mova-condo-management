"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  isPending?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isPending,
}: ConfirmDialogProps) {
  const t = useTranslations("common.actions");

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <AlertDialog.Popup className="bg-card border-border fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-6 shadow-xl outline-none">
          <AlertDialog.Title className="text-foreground mb-2 text-base font-semibold">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-muted-foreground mb-6 text-sm">
            {description}
          </AlertDialog.Description>
          <div className="flex justify-end gap-2">
            <AlertDialog.Close
              disabled={isPending}
              className="border-border bg-background text-foreground hover:bg-muted inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {t("cancel")}
            </AlertDialog.Close>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isPending}
              className="cursor-pointer"
            >
              {t("confirm")}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
