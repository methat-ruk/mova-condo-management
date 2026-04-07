"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { cookieName, type Locale } from "@/i18n/config";

const NEXT_LOCALE: Record<Locale, Locale> = { th: "en", en: "th" };
const LABEL: Record<Locale, string> = { th: "TH", en: "EN" };

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();

  const next = NEXT_LOCALE[locale];

  const handleSwitch = () => {
    startTransition(() => {
      document.cookie = `${cookieName}=${next};path=/;max-age=31536000`;
      window.location.reload();
    });
  };

  return (
    <div className="flex items-center">
      <span className="text-border select-none">|</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSwitch}
        disabled={isPending}
        aria-label={`Switch to ${LABEL[next]}`}
        className="cursor-pointer px-2"
      >
        <span className="text-xs font-medium">{LABEL[locale]}</span>
      </Button>
      <span className="text-border select-none">|</span>
    </div>
  );
}
