"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarDays,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { clsx } from "clsx";
import { useUiStore } from "@/store/uiStore";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import type { NavItem } from "@/types";

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    group: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    group: "Property",
    items: [
      { label: "Buildings & Units", href: "/buildings", icon: Building2 },
      { label: "Residents", href: "/residents", icon: Users },
    ],
  },
  {
    group: "Operations",
    items: [
      { label: "Maintenance", href: "/maintenance", icon: Wrench },
      { label: "Billing", href: "/billing", icon: Receipt },
      { label: "Visitors", href: "/visitors", icon: UserCheck },
      { label: "Parcels", href: "/parcels", icon: Package },
      { label: "Facility Booking", href: "/facilities", icon: CalendarDays },
    ],
  },
  {
    group: "Management",
    items: [
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
      { label: "Administration", href: "/admin", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const { isSidebarOpen, isSidebarCollapsed, closeSidebar } = useUiStore();

  const isVisible = isDesktop ? true : isSidebarOpen;
  const isCollapsed = isDesktop ? isSidebarCollapsed : false;

  return (
    <>
      {/* Mobile backdrop */}
      {!isDesktop && isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          "bg-sidebar flex h-screen flex-col transition-all duration-300",
          // Desktop: inline, Mobiles: fixed drawer
          isDesktop ? "relative" : "fixed inset-y-0 left-0 z-50",
          // Width
          isCollapsed ? "w-16" : "w-60",
          // Mobile show/hide
          !isDesktop && !isVisible && "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div
          className={clsx(
            "border-sidebar-border flex h-16 items-center gap-3 border-b px-4",
            isCollapsed && "justify-center px-0",
          )}
        >
          <div className="bg-sidebar-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm">
            <Building2 className="text-sidebar-primary-foreground h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sidebar-foreground truncate text-sm font-bold">CondoHub</span>
              <span className="text-sidebar-foreground/60 truncate text-[10px]">
                Management Platform
              </span>
            </div>
          )}
        </div>

        {/* Nav Groups */}
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-2 pt-3">
          {navGroups.map(({ group, items }) => (
            <div key={group}>
              {/* Group Label */}
              {!isCollapsed && (
                <p className="text-sidebar-foreground/40 mb-1 px-3 text-[10px] font-semibold tracking-widest uppercase">
                  {group}
                </p>
              )}

              {/* Items */}
              <div className="flex flex-col gap-0.5">
                {items.map(({ label, href, icon: Icon }) => {
                  const isActive = pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => !isDesktop && closeSidebar()}
                      className={clsx(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isCollapsed && "justify-center px-0",
                      )}
                      title={isCollapsed ? label : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span className="truncate">{label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
