"use client";

import { Menu } from "lucide-react";
import { AnnouncementBell } from "./AnnouncementBell";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/button";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useUiStore } from "@/store/uiStore";

export function Topbar() {
  const isDesktop = useIsDesktop();
  const { toggleSidebarOpen, toggleSidebarCollapsed } = useUiStore();

  const handleHamburger = () => {
    if (isDesktop) toggleSidebarCollapsed();
    else toggleSidebarOpen();
  };

  return (
    <header className="border-border bg-background flex h-16 items-center justify-between border-b px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleHamburger}
        aria-label="Toggle sidebar"
        className="cursor-pointer"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-1">
        <AnnouncementBell />
        <ThemeToggle />
        <LocaleSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
