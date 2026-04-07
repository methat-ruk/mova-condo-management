import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header group — shadow appears below breadcrumb, not below topbar */}
        <div className="z-10 shrink-0 shadow-sm dark:border-b dark:border-white/10 dark:shadow-none">
          <Topbar />
          <AppBreadcrumb />
        </div>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
