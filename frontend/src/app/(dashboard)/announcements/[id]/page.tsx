"use client";

import { ArrowLeft, Pin, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { AnnouncementFormDialog } from "@/components/shared/AnnouncementFormDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { announcementService } from "@/services/announcementService";
import type { Announcement, CreateAnnouncementRequest } from "@/types/announcement";
import type { ApiError } from "@/types";

export default function AnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations("announcements");
  const tCommon = useTranslations("common");

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await announcementService.getOne(id);
      setAnnouncement(data);
      // Mark as read when viewing detail
      await announcementService.markRead(id);
    } catch {
      toast.error(tCommon("status.error"));
    } finally {
      setIsLoading(false);
    }
  }, [id, tCommon]);

  useEffect(() => {
    void load();
  }, [load]);

  const isVisible = (a: Announcement) =>
    a.status === "ACTIVE" && (!a.expiredAt || new Date(a.expiredAt) > new Date());

  const handleUpdate = async (data: CreateAnnouncementRequest) => {
    if (!announcement) return;
    startTransition(async () => {
      try {
        const updated = await announcementService.update(announcement.id, data);
        setAnnouncement(updated);
        toast.success(t("updateSuccess"));
        setEditOpen(false);
      } catch (err) {
        toast.error((err as ApiError).message ?? tCommon("status.error"));
      }
    });
  };

  const handleDelete = async () => {
    if (!announcement) return;
    startTransition(async () => {
      try {
        await announcementService.remove(announcement.id);
        toast.success(t("deleteSuccess"));
        router.push("/announcements");
      } catch (err) {
        toast.error((err as ApiError).message ?? tCommon("status.error"));
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-6 w-32 animate-pulse rounded" />
        <div className="bg-card border-border space-y-4 rounded-xl border p-6">
          <div className="bg-muted h-6 w-3/4 animate-pulse rounded" />
          <div className="bg-muted h-4 w-full animate-pulse rounded" />
          <div className="bg-muted h-4 w-full animate-pulse rounded" />
          <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!announcement) return null;

  const visible = isVisible(announcement);

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/announcements"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {tCommon("actions.back")}
      </Link>

      {/* Card */}
      <div className="bg-card border-border space-y-4 rounded-xl border p-6">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {announcement.isPinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Pin className="h-3 w-3" />
              {t("pinned")}
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              visible
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {visible ? t("status.ACTIVE") : t("status.EXPIRED")}
          </span>
          {announcement.expiredAt && (
            <span className="text-muted-foreground text-xs">
              {t("fields.expiredAt")}:{" "}
              {new Date(announcement.expiredAt).toLocaleDateString("th-TH")}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-foreground text-xl font-bold">{announcement.title}</h2>

        {/* Content */}
        <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
          {announcement.content}
        </p>

        {/* Meta */}
        <div className="border-border border-t pt-4">
          <p className="text-muted-foreground text-xs">
            {t("by")} {announcement.createdBy.firstName} {announcement.createdBy.lastName} ·{" "}
            {new Date(announcement.createdAt).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={() => setEditOpen(true)} variant="outline" className="cursor-pointer">
          {tCommon("actions.edit")}
        </Button>
        <button
          onClick={() => setDeleteOpen(true)}
          className="text-destructive hover:text-destructive/80 inline-flex cursor-pointer items-center gap-1.5 text-sm transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          {tCommon("actions.delete")}
        </button>
      </div>

      <AnnouncementFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleUpdate}
        isPending={isPending}
        editTarget={announcement}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}
