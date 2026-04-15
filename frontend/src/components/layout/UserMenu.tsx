"use client";

import { Menu } from "@base-ui/react/menu";
import { Separator } from "@base-ui/react/separator";
import { ChevronDown, LogOut, UserCircle, UserPen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types/auth";

const ROLE_BADGE: Record<UserRole, string> = {
  ADMIN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  JURISTIC: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  STAFF: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  GUARD: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  RESIDENT: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const ITEM_CLASS =
  "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors outline-none disabled:opacity-50";

export function UserMenu() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const t = useTranslations("auth.logout");
  const tProfile = useTranslations("auth.profile");
  const tRole = useTranslations("auth.roles");
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await authService.logout();
      } catch {
        // stateless JWT — clear client state regardless
      } finally {
        clearAuth();
        toast.success(t("success"));
        router.push("/login");
      }
    });
  };

  if (!user) return null;

  const roleBadgeClass = ROLE_BADGE[user.role] ?? "";

  return (
    <Menu.Root open={open} onOpenChange={setOpen}>
      <Menu.Trigger
        className="hover:bg-accent flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors outline-none"
        aria-label="User menu"
      >
        <UserCircle className="text-muted-foreground h-5 w-5 shrink-0" />
        <div className="hidden text-left sm:block">
          <p className="text-foreground max-w-30 truncate text-xs leading-tight font-medium">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-muted-foreground max-w-30 truncate text-[10px] leading-tight">
            {user.email}
          </p>
        </div>
        <span
          className={`hidden rounded px-1.5 py-0.5 text-[10px] font-semibold sm:inline-block ${roleBadgeClass}`}
        >
          {tRole(user.role)}
        </span>
        <ChevronDown
          className={`text-muted-foreground hidden h-3 w-3 shrink-0 transition-transform duration-200 sm:block ${open ? "rotate-180" : ""}`}
        />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={6} className="z-200">
          <Menu.Popup className="bg-popover border-border text-popover-foreground w-48 rounded-xl border p-1.5 shadow-md outline-none">
            {/* User info header */}
            <div className="px-2.5 py-2">
              <p className="text-foreground truncate text-xs font-semibold">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-muted-foreground truncate text-[10px]">{user.email}</p>
              <span
                className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${roleBadgeClass}`}
              >
                {tRole(user.role)}
              </span>
            </div>

            <Separator className="bg-border my-1 h-px" />

            {/* Account group */}
            <Menu.Item
              className={`${ITEM_CLASS} text-foreground hover:bg-accent`}
              onClick={() => toast.info("Coming soon")}
            >
              <UserPen className="h-3.5 w-3.5" />
              {tProfile("editProfile")}
            </Menu.Item>

            <Separator className="bg-border my-1 h-px" />

            {/* Danger group */}
            <Menu.Item
              className={`${ITEM_CLASS} text-destructive hover:bg-destructive/10`}
              disabled={isPending}
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5" />
              {t("label")}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
