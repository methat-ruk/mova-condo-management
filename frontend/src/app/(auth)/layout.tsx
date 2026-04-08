import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="via-background to-background dark:via-background dark:to-background relative flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-sky-100 px-4 dark:from-sky-950/30">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <ThemeToggle />
        <LocaleSwitcher />
      </div>
      {children}
    </main>
  );
}
