"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { parseBreadcrumbs, truncateBreadcrumbs } from "@/utils/breadcrumb";
import { useIsDesktop } from "@/hooks/useIsDesktop";

export function AppBreadcrumb() {
  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const tNav = useTranslations("nav");
  const tBreadcrumb = useTranslations("breadcrumb");

  const all = parseBreadcrumbs(pathname, tNav, tBreadcrumb);
  const { visible, truncated } = isDesktop
    ? { visible: all, truncated: false }
    : truncateBreadcrumbs(all);

  if (all.length === 0) return null;

  return (
    <div className="bg-background px-4 py-2">
      <Breadcrumb>
        <BreadcrumbList>
          {truncated && (
            <>
              <BreadcrumbItem>
                <BreadcrumbEllipsis />
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}

          {visible.map((seg) => (
            <span key={seg.href} className="flex items-center gap-1.5">
              <BreadcrumbItem>
                {seg.isLast ? (
                  <BreadcrumbPage className="text-foreground font-medium">
                    {seg.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={<Link href={seg.href} />}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {seg.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!seg.isLast && <BreadcrumbSeparator />}
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
