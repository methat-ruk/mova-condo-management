"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, KeyRound, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import type { ApiError } from "@/types";

function buildSchema(t: ReturnType<typeof useTranslations<"auth.validation">>) {
  return z.object({
    email: z.string().min(1, t("emailRequired")).email({ message: t("emailInvalid") }),
    password: z.string().min(1, t("passwordRequired")).min(8, t("passwordMinLength")),
  });
}

type FormValues = { email: string; password: string };

const INPUT_CLASS =
  "border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:outline-none aria-invalid:border-red-500";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const tV = useTranslations("auth.validation");
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isPending, startTransition] = useTransition();

  const schema = buildSchema(tV);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        const result = await authService.login(values);
        setAuth(result.user, result.accessToken);
        toast.success(t("success"));
        router.push("/dashboard");
      } catch (err) {
        const apiError = err as ApiError;
        if (apiError.statusCode === 401) {
          toast.error(t("error"));
        } else {
          toast.error(t("networkError"));
        }
      }
    });
  };

  return (
    <div className="bg-card border-border w-full max-w-sm rounded-2xl border p-8 shadow-lg dark:border-white/10 dark:shadow-2xl">
      {/* Logo + App name */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-2xl">
          <Building2 className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h1 className="text-foreground text-lg font-bold tracking-tight">
            {t("appName")}
          </h1>
          <p className="text-muted-foreground text-xs">{t("appTagline")}</p>
        </div>
        <div className="border-border w-full border-t" />
        <p className="text-foreground text-sm font-medium">{t("title")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-foreground text-sm font-medium">
            {t("email")}
          </label>
          <div className="relative">
            <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              {...register("email")}
              className={INPUT_CLASS}
              aria-invalid={!!errors.email}
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-foreground text-sm font-medium">
            {t("password")}
          </label>
          <div className="relative">
            <KeyRound className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              id="password"
              type="password"
              placeholder={t("passwordPlaceholder")}
              {...register("password")}
              className={INPUT_CLASS}
              aria-invalid={!!errors.password}
              autoComplete="current-password"
            />
          </div>
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              className="text-primary hover:text-primary/80 hover:underline cursor-pointer text-xs transition-colors"
              onClick={() => toast.info("Coming soon")}
            >
              {t("forgotPassword")}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="mt-2 h-10 w-full cursor-pointer text-sm dark:text-white dark:hover:text-white"
        >
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
