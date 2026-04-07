"use client";

import { Menu, UserCircle } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { useUiStore } from "@/store/uiStore";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { Button } from "@/components/ui/button";

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
        <ThemeToggle />
        <LocaleSwitcher />
        <button
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors"
          aria-label="User menu"
        >
          <UserCircle className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}
