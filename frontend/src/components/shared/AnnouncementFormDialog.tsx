"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/ui/select-input";
import type { Announcement, CreateAnnouncementRequest } from "@/types/announcement";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateAnnouncementRequest) => Promise<void>;
  isPending?: boolean;
  editTarget?: Announcement | null;
}

interface FormErrors {
  title?: string;
  content?: string;
}

function AnnouncementForm({
  onSubmit,
  isPending,
  editTarget,
}: Omit<Props, "open" | "onOpenChange">) {
  const t = useTranslations("announcements");
  const tCommon = useTranslations("common");

  const [title, setTitle] = useState(editTarget?.title ?? "");
  const [content, setContent] = useState(editTarget?.content ?? "");
  const [isPinned, setIsPinned] = useState(editTarget?.isPinned ?? false);
  const [status, setStatus] = useState<"ACTIVE" | "EXPIRED">(editTarget?.status ?? "ACTIVE");
  const [expiredAt, setExpiredAt] = useState(
    editTarget?.expiredAt ? editTarget.expiredAt.slice(0, 10) : "",
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!title.trim()) next.title = t("validation.titleRequired");
    if (!content.trim()) next.content = t("validation.contentRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      title: title.trim(),
      content: content.trim(),
      isPinned,
      status,
      expiredAt: expiredAt || undefined,
    });
  };

  const inputBase =
    "border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none";
  const inputClass = (err?: string) =>
    `${inputBase}${err ? " border-destructive focus:ring-destructive/30" : ""}`;

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
            className={inputClass(errors.title)}
          />
          {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium">
            {t("fields.content")} <span className="text-destructive">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setErrors((p) => ({ ...p, content: undefined }));
            }}
            rows={5}
            placeholder={t("fields.content")}
            className={`${inputClass(errors.content)} resize-none`}
          />
          {errors.content && <p className="text-destructive text-xs">{errors.content}</p>}
        </div>

        {/* Status + ExpiredAt */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-foreground text-sm font-medium">{t("fields.status")}</label>
            <SelectInput
              value={status}
              onChange={(e) => setStatus(e.target.value as "ACTIVE" | "EXPIRED")}
            >
              <option value="ACTIVE">{t("status.ACTIVE")}</option>
              <option value="EXPIRED">{t("status.EXPIRED")}</option>
            </SelectInput>
          </div>
          <div className="space-y-1.5">
            <label className="text-foreground text-sm font-medium">{t("fields.expiredAt")}</label>
            <input
              type="date"
              value={expiredAt}
              onChange={(e) => setExpiredAt(e.target.value)}
              onKeyDown={(e) => e.preventDefault()}
              className={`${inputBase} cursor-pointer scheme-light dark:scheme-dark`}
            />
          </div>
        </div>

        {/* Pin */}
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="accent-primary h-4 w-4 cursor-pointer rounded"
          />
          <span className="text-foreground text-sm">{t("fields.isPinned")}</span>
        </label>
      </div>

      <div className="border-border flex items-center justify-end gap-3 border-t px-6 py-4">
        <Dialog.Close
          disabled={isPending}
          className="border-border bg-background text-foreground hover:bg-muted inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {tCommon("actions.cancel")}
        </Dialog.Close>
        <Button type="submit" disabled={isPending} className="cursor-pointer">
          {isPending ? tCommon("status.loading") : tCommon("actions.save")}
        </Button>
      </div>
    </form>
  );
}

export function AnnouncementFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  editTarget,
}: Props) {
  const t = useTranslations("announcements");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Popup className="bg-card border-border fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border shadow-xl outline-none">
          <div className="border-border flex items-center justify-between border-b px-6 py-4">
            <Dialog.Title className="text-foreground text-base font-semibold">
              {editTarget ? t("editAnnouncement") : t("addAnnouncement")}
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
            <AnnouncementForm onSubmit={onSubmit} isPending={isPending} editTarget={editTarget} />
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
