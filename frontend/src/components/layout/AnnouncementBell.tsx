"use client";

import { Bell, Megaphone, Pin } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { announcementService } from "@/services/announcementService";
import type { Announcement } from "@/types/announcement";

export function AnnouncementBell() {
  const t = useTranslations("announcements");

  const [unread, setUnread] = useState(0);
  const [recent, setRecent] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Poll unread count
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      announcementService
        .getUnreadCount()
        .then((res) => {
          if (!cancelled) setUnread(res.unread);
        })
        .catch(() => {});
    };
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const fetchRecent = () => {
    announcementService
      .getAll({ status: "VISIBLE", limit: 5 })
      .then((res) => setRecent(res.data))
      .catch(() => {});
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchRecent();
  };

  const handleClickItem = async (id: string) => {
    try {
      await announcementService.markRead(id);
      setUnread((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        aria-label="Announcements"
        className="text-muted-foreground hover:text-foreground hover:bg-muted relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="bg-destructive absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="border-border bg-card absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border shadow-xl">
          {/* Header */}
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <p className="text-foreground text-sm font-semibold">{t("title")}</p>
            {unread > 0 && (
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                {t("unreadCount", { count: unread })}
              </span>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {recent.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Megaphone className="text-muted-foreground h-6 w-6" />
                <p className="text-muted-foreground text-sm">{t("noUnread")}</p>
              </div>
            ) : (
              recent.map((a) => (
                <Link
                  key={a.id}
                  href={`/announcements/${a.id}`}
                  onClick={() => void handleClickItem(a.id)}
                  className="hover:bg-muted/50 border-border/50 block border-b px-4 py-3 transition-colors last:border-0"
                >
                  <div className="flex items-start gap-2">
                    {a.isPinned && <Pin className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground truncate text-sm font-medium">{a.title}</p>
                      <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                        {a.content}
                      </p>
                      <p className="text-muted-foreground mt-1 text-[10px]">
                        {new Date(a.createdAt).toLocaleDateString("th-TH")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-border border-t px-4 py-2.5">
            <Link
              href="/announcements"
              onClick={() => setOpen(false)}
              className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
            >
              {t("viewAll")} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
