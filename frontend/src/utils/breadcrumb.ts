export interface BreadcrumbSegment {
  label: string;
  href: string;
  isLast: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  buildings: "Buildings & Units",
  residents: "Residents",
  maintenance: "Maintenance",
  billing: "Billing",
  visitors: "Visitors",
  parcels: "Parcels",
  facilities: "Facility Booking",
  analytics: "Analytics",
  admin: "Administration",
  // sub-routes
  floors: "Floors",
  units: "Units",
  invoices: "Invoices",
  payments: "Payments",
  tickets: "Tickets",
  bookings: "Bookings",
};

function isDynamicSegment(segment: string): boolean {
  // UUID or numeric ID
  return /^\d+$/.test(segment) || /^[0-9a-f-]{36}$/.test(segment);
}

function toLabel(segment: string): string {
  if (isDynamicSegment(segment)) return "Detail";
  return (
    ROUTE_LABELS[segment] ?? segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function parseBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  const segments = pathname.split("/").filter(Boolean);

  return segments.map((seg, i) => ({
    label: toLabel(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));
}

/** For mobile: keep only the last 2 segments, prepend ellipsis if truncated */
export function truncateBreadcrumbs(segments: BreadcrumbSegment[]): {
  visible: BreadcrumbSegment[];
  truncated: boolean;
} {
  if (segments.length <= 2) return { visible: segments, truncated: false };
  return { visible: segments.slice(-2), truncated: true };
}
