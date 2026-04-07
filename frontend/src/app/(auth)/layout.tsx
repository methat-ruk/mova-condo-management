export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-muted/40 flex min-h-screen items-center justify-center px-4">
      {children}
    </main>
  );
}
