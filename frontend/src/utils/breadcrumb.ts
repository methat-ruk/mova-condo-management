export interface BreadcrumbSegment {
  label: string;
  href: string;
  isLast: boolean;
}

type TranslateFn = (key: string) => string;

const ROUTE_KEYS: Record<string, string> = {
  dashboard: "dashboard",
  buildings: "buildings",
  residents: "residents",
  maintenance: "maintenance",
  billing: "billing",
  visitors: "visitors",
  parcels: "parcels",
  facilities: "facilities",
  analytics: "analytics",
  admin: "admin",
};

const BREADCRUMB_KEYS: Record<string, string> = {
  floors: "floors",
  units: "units",
  invoices: "invoices",
  payments: "payments",
  tickets: "tickets",
  bookings: "bookings",
};

function isDynamicSegment(segment: string): boolean {
  return /^\d+$/.test(segment) || /^[0-9a-f-]{36}$/.test(segment);
}

function toLabel(segment: string, tNav: TranslateFn, tBreadcrumb: TranslateFn): string {
  if (isDynamicSegment(segment)) return tBreadcrumb("detail");
  if (ROUTE_KEYS[segment]) return tNav(ROUTE_KEYS[segment]);
  if (BREADCRUMB_KEYS[segment]) return tBreadcrumb(BREADCRUMB_KEYS[segment]);
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseBreadcrumbs(
  pathname: string,
  tNav: TranslateFn,
  tBreadcrumb: TranslateFn,
): BreadcrumbSegment[] {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg, i) => ({
    label: toLabel(seg, tNav, tBreadcrumb),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));
}

export function truncateBreadcrumbs(segments: BreadcrumbSegment[]): {
  visible: BreadcrumbSegment[];
  truncated: boolean;
} {
  if (segments.length <= 2) return { visible: segments, truncated: false };
  return { visible: segments.slice(-2), truncated: true };
}
