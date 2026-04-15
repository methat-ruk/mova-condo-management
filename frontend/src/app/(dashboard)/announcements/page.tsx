"use client";

import { Megaphone, Pin, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { AnnouncementFormDialog } from "@/components/shared/AnnouncementFormDialog";
import { Button } from "@/components/ui/button";
import { announcementService } from "@/services/announcementService";
import type {
  Announcement,
  AnnouncementStatus,
  CreateAnnouncementRequest,
} from "@/types/announcement";
import type { ApiError } from "@/types";

export default function AnnouncementsPage() {
  const t = useTranslations("announcements");
  const tCommon = useTranslations("common");

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | "">("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await announcementService.getAll({ limit: 1000 });
      setAnnouncements(res.data);
    } catch {
      toast.error(tCommon("status.error"));
    } finally {
      setIsLoading(false);
    }
  }, [tCommon]);

  useEffect(() => {
    void load();
  }, [load]);

  const isVisible = (a: Announcement) =>
    a.status === "ACTIVE" && (!a.expiredAt || new Date(a.expiredAt) > new Date());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return announcements.filter((a) => {
      if (statusFilter === "ACTIVE" && !isVisible(a)) return false;
      if (statusFilter === "EXPIRED" && isVisible(a)) return false;
      if (q && !a.title.toLowerCase().includes(q) && !a.content.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [announcements, search, statusFilter]);

  const handleSubmit = async (data: CreateAnnouncementRequest) => {
    startTransition(async () => {
      try {
        if (editTarget) {
          const updated = await announcementService.update(editTarget.id, data);
          setAnnouncements((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          toast.success(t("updateSuccess"));
        } else {
          const created = await announcementService.create(data);
          setAnnouncements((prev) => [created, ...prev]);
          toast.success(t("createSuccess"));
        }
        setFormOpen(false);
        setEditTarget(null);
      } catch (err) {
        toast.error((err as ApiError).message ?? tCommon("status.error"));
      }
    });
  };

  const openEdit = (a: Announcement) => {
    setEditTarget(a);
    setFormOpen(true);
  };
  const openAdd = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="bg-card border-border divide-border divide-y rounded-xl border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2 px-6 py-4">
              <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
              <div className="bg-muted h-3 w-full animate-pulse rounded" />
              <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-2xl font-bold">{t("title")}</h1>
        <Button onClick={openAdd} className="cursor-pointer gap-2" size="sm">
          <Plus className="h-4 w-4" />
          {t("addAnnouncement")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-9 w-full min-w-0 rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none sm:flex-1"
        />
        <div className="flex shrink-0 gap-1">
          {(["", "ACTIVE", "EXPIRED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s === "" ? t("filterAll") : s === "ACTIVE" ? t("filterActive") : t("filterExpired")}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-card border-border flex flex-col items-center gap-3 rounded-xl border py-16 text-center">
          <Megaphone className="text-muted-foreground h-8 w-8" />
          <p className="text-foreground font-medium">{t("noAnnouncements")}</p>
        </div>
      ) : (
        <div className="bg-card border-border divide-border divide-y rounded-xl border">
          {filtered.map((a) => {
            const visible = isVisible(a);
            return (
              <div key={a.id} className="hover:bg-muted/40 px-6 py-4 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {/* Badges */}
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      {a.isPinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <Pin className="h-3 w-3" />
                          {t("pinned")}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          visible
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {visible ? t("status.ACTIVE") : t("status.EXPIRED")}
                      </span>
                      {a.expiredAt && (
                        <span className="text-muted-foreground text-xs">
                          {new Date(a.expiredAt).toLocaleDateString("th-TH")}
                        </span>
                      )}
                    </div>
                    {/* Title */}
                    <p className="text-foreground truncate font-medium">{a.title}</p>
                    {/* Content preview */}
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">{a.content}</p>
                    {/* Meta */}
                    <p className="text-muted-foreground mt-1.5 text-xs">
                      {t("by")} {a.createdBy.firstName} {a.createdBy.lastName} ·{" "}
                      {new Date(a.createdAt).toLocaleDateString("th-TH")}
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => openEdit(a)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer text-xs transition-colors"
                    >
                      {tCommon("actions.edit")}
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={`/announcements/${a.id}`} />}
                      className="cursor-pointer"
                    >
                      {tCommon("actions.view")}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnnouncementFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditTarget(null);
        }}
        onSubmit={handleSubmit}
        isPending={isPending}
        editTarget={editTarget}
      />
    </div>
  );
}
