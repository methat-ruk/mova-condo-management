"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useIsMounted } from "@/hooks/useIsMounted";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const mounted = useIsMounted();
  const t = useTranslations("theme");

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="cursor-pointer gap-2"
    >
      {mounted ? (
        theme === "light" ? (
          <>
            <Moon className="h-4 w-4" />
            <span className="text-xs">{t("dark")}</span>
          </>
        ) : (
          <>
            <Sun className="h-4 w-4" />
            <span className="text-xs">{t("light")}</span>
          </>
        )
      ) : (
        <div className="h-4 w-4" />
      )}
    </Button>
  );
}
