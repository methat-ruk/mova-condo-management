"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Download, ReceiptText, Tickets, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/ui/select-input";
import { maintenanceService } from "@/services/maintenanceService";
import type { ApiError } from "@/types";
import type {
  MaintenanceCategory,
  MaintenanceExpenseSummary,
  MaintenanceExpenseSummaryCategory,
} from "@/types/maintenance";

type PeriodType = "daily" | "monthly" | "yearly";

const YEAR_OPTIONS = [2024, 2025, 2026];
const CATEGORY_COLORS: Record<MaintenanceCategory, string> = {
  ELECTRICAL: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  PLUMBING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  HVAC: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  STRUCTURAL: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  APPLIANCE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  OTHER: "bg-muted text-muted-foreground",
};

const CARD_STYLES = [
  {
    icon: Wallet,
    wrapperClassName:
      "border-emerald-200 bg-linear-to-br from-emerald-50 to-white dark:border-emerald-900/60 dark:from-emerald-950/40 dark:to-background",
    iconClassName: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  {
    icon: ReceiptText,
    wrapperClassName:
      "border-amber-200 bg-linear-to-br from-amber-50 to-white dark:border-amber-900/60 dark:from-amber-950/40 dark:to-background",
    iconClassName: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    icon: Tickets,
    wrapperClassName:
      "border-sky-200 bg-linear-to-br from-sky-50 to-white dark:border-sky-900/60 dark:from-sky-950/40 dark:to-background",
    iconClassName: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  },
] as const;

export default function MaintenanceExpensesPage() {
  const t = useTranslations("maintenance");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const today = new Date();
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [day, setDay] = useState(today.getDate());
  const [summary, setSummary] = useState<MaintenanceExpenseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        value: index + 1,
        label: new Intl.DateTimeFormat(locale, { month: "long" }).format(
          new Date(Date.UTC(2026, index, 1)),
        ),
      })),
    [locale],
  );

  const dayOptions = useMemo(
    () =>
      Array.from({ length: new Date(year, month, 0).getDate() }, (_, index) => ({
        value: index + 1,
        label: String(index + 1),
      })),
    [month, year],
  );

  useEffect(() => {
    if (day > dayOptions.length) {
      setDay(dayOptions.length);
    }
  }, [day, dayOptions.length]);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    void maintenanceService
      .getExpenseSummaryByPeriod({
        periodType,
        year,
        ...(periodType !== "yearly" ? { month } : {}),
        ...(periodType === "daily" ? { day } : {}),
      })
      .then((response) => {
        if (!cancelled) {
          setSummary(response);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error(t("summary.loadError"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [day, month, periodType, t, year]);

  const chartData = useMemo(() => {
    if (!summary) {
      return [];
    }

    if (periodType === "yearly") {
      return summary.monthlyBreakdown.map((entry) => ({
        label: monthOptions[entry.month - 1]?.label.slice(0, 3) ?? String(entry.month),
        value: entry.totalAmount,
        meta: t("summary.chartMeta", {
          expenses: entry.expenseCount,
          tickets: entry.ticketCount,
        }),
      }));
    }

    if (periodType === "monthly") {
      return summary.dailyBreakdown.map((entry) => ({
        label: String(entry.day),
        value: entry.totalAmount,
        meta: t("summary.chartMeta", {
          expenses: entry.expenseCount,
          tickets: entry.ticketCount,
        }),
      }));
    }

    return summary.byCategory
      .filter((item) => item.expenseCount > 0)
      .map((item) => ({
        label: t(`category.${item.category}`),
        value: item.totalAmount,
        meta: t("summary.categoryMeta", {
          expenses: item.expenseCount,
          tickets: item.ticketCount,
        }),
      }));
  }, [monthOptions, periodType, summary, t]);

  const handleExportCsv = async () => {
    setIsExporting(true);

    try {
      const response = await maintenanceService.exportExpenseCsv({
        periodType,
        year,
        ...(periodType !== "yearly" ? { month } : {}),
        ...(periodType === "daily" ? { day } : {}),
      });

      const blob = new Blob([response.content], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = response.fileName;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success(t("summary.exportSuccess"));
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message ?? tCommon("status.error"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit cursor-pointer gap-2 px-0"
            render={<Link href="/maintenance" />}
          >
            <ArrowLeft className="h-4 w-4" />
            {tCommon("actions.back")}
          </Button>
          <div>
            <h1 className="text-foreground text-2xl font-bold">{t("summary.dashboardTitle")}</h1>
            <p className="text-muted-foreground text-sm">{t("summary.dashboardSubtitle")}</p>
          </div>
        </div>

        <Button
          onClick={handleExportCsv}
          variant="default"
          size="sm"
          className="cursor-pointer gap-2"
          disabled={isLoading || isExporting}
        >
          <Download className="h-4 w-4" />
          {t("summary.exportCsv")}
        </Button>
      </div>

      <div className="bg-card border-border grid gap-3 rounded-2xl border p-4 md:grid-cols-4">
        <div className="md:col-span-1">
          <label className="text-foreground mb-1.5 block text-sm font-medium">
            {t("summary.filters.period")}
          </label>
          <SelectInput
            value={periodType}
            onChange={(event) => setPeriodType(event.target.value as PeriodType)}
          >
            <option value="daily">{t("summary.periods.daily")}</option>
            <option value="monthly">{t("summary.periods.monthly")}</option>
            <option value="yearly">{t("summary.periods.yearly")}</option>
          </SelectInput>
        </div>

        <div>
          <label className="text-foreground mb-1.5 block text-sm font-medium">
            {t("summary.filters.year")}
          </label>
          <SelectInput value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {YEAR_OPTIONS.map((optionYear) => (
              <option key={optionYear} value={optionYear}>
                {optionYear}
              </option>
            ))}
          </SelectInput>
        </div>

        {periodType !== "yearly" && (
          <div>
            <label className="text-foreground mb-1.5 block text-sm font-medium">
              {t("summary.filters.month")}
            </label>
            <SelectInput value={month} onChange={(event) => setMonth(Number(event.target.value))}>
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </div>
        )}

        {periodType === "daily" && (
          <div>
            <label className="text-foreground mb-1.5 block text-sm font-medium">
              {t("summary.filters.day")}
            </label>
            <SelectInput value={day} onChange={(event) => setDay(Number(event.target.value))}>
              {dayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-muted h-32 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : summary ? (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <MetricCard
              icon={CARD_STYLES[0].icon}
              iconClassName={CARD_STYLES[0].iconClassName}
              wrapperClassName={CARD_STYLES[0].wrapperClassName}
              label={t("summary.cards.totalAmount")}
              value={formatCurrency(summary.totalAmount)}
              description={getPeriodLabel(summary, locale, t)}
            />
            <MetricCard
              icon={CARD_STYLES[1].icon}
              iconClassName={CARD_STYLES[1].iconClassName}
              wrapperClassName={CARD_STYLES[1].wrapperClassName}
              label={t("summary.cards.expenseCount")}
              value={summary.expenseCount.toLocaleString(locale)}
              description={t("summary.cards.expenseCountDescription")}
            />
            <MetricCard
              icon={CARD_STYLES[2].icon}
              iconClassName={CARD_STYLES[2].iconClassName}
              wrapperClassName={CARD_STYLES[2].wrapperClassName}
              label={t("summary.cards.ticketCount")}
              value={summary.ticketCount.toLocaleString(locale)}
              description={t("summary.cards.ticketCountDescription")}
            />
          </div>

          {summary.expenseCount === 0 ? (
            <div className="border-border rounded-2xl border border-dashed px-4 py-12 text-center">
              <p className="text-foreground font-medium">{t("summary.emptyTitle")}</p>
              <p className="text-muted-foreground mt-1 text-sm">{t("summary.emptyDescription")}</p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="bg-card border-border rounded-2xl border p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-foreground text-base font-semibold">
                      {t("summary.chartTitle")}
                    </h2>
                    <p className="text-muted-foreground text-sm">{t("summary.chartSubtitle")}</p>
                  </div>
                  <div className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium">
                    {t(`summary.periods.${periodType}`)}
                  </div>
                </div>

                <div className="mt-5">
                  <SimpleBarChart data={chartData} emptyText={tCommon("status.noData")} />
                </div>
              </div>

              <div className="space-y-4">
                <BreakdownCard
                  title={t("summary.byCategory")}
                  items={summary.byCategory}
                  emptyText={tCommon("status.noData")}
                  renderItem={(item) => (
                    <CategoryRow
                      item={item}
                      label={t(`category.${item.category}`)}
                      meta={t("summary.categoryMeta", {
                        expenses: item.expenseCount,
                        tickets: item.ticketCount,
                      })}
                    />
                  )}
                />

                {periodType === "yearly" ? (
                  <BreakdownCard
                    title={t("summary.monthlyBreakdown")}
                    items={summary.monthlyBreakdown}
                    emptyText={tCommon("status.noData")}
                    renderItem={(item) => (
                      <TextRow
                        label={monthOptions[item.month - 1]?.label ?? String(item.month)}
                        meta={t("summary.chartMeta", {
                          expenses: item.expenseCount,
                          tickets: item.ticketCount,
                        })}
                        value={formatCurrency(item.totalAmount)}
                      />
                    )}
                  />
                ) : periodType === "monthly" ? (
                  <BreakdownCard
                    title={t("summary.dailyBreakdown")}
                    items={summary.dailyBreakdown}
                    emptyText={tCommon("status.noData")}
                    renderItem={(item) => (
                      <TextRow
                        label={t("summary.dayLabel", { day: item.day })}
                        meta={t("summary.chartMeta", {
                          expenses: item.expenseCount,
                          tickets: item.ticketCount,
                        })}
                        value={formatCurrency(item.totalAmount)}
                      />
                    )}
                  />
                ) : (
                  <BreakdownCard
                    title={t("summary.topTickets")}
                    items={summary.topTickets}
                    emptyText={tCommon("status.noData")}
                    renderItem={(item) => (
                      <TextRow
                        label={item.title}
                        meta={`${t("fields.floor")} ${item.floorNumber} - ${item.unitNumber}`}
                        value={formatCurrency(item.totalAmount)}
                      />
                    )}
                  />
                )}
              </div>
            </div>
          )}

          <div className="bg-card border-border rounded-2xl border p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-foreground text-base font-semibold">
                  {t("summary.tableTitle")}
                </h2>
                <p className="text-muted-foreground text-sm">{t("summary.tableSubtitle")}</p>
              </div>
              <div className="bg-muted text-muted-foreground inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
                <CalendarDays className="h-3.5 w-3.5" />
                {getPeriodLabel(summary, locale, t)}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-200 text-sm">
                <thead>
                  <tr className="border-border border-b">
                    <th className="text-muted-foreground px-3 py-3 text-left font-medium">
                      {t("expenses.fields.title")}
                    </th>
                    <th className="text-muted-foreground px-3 py-3 text-left font-medium">
                      {t("fields.category")}
                    </th>
                    <th className="text-muted-foreground px-3 py-3 text-left font-medium">
                      {t("summary.columns.ticket")}
                    </th>
                    <th className="text-muted-foreground px-3 py-3 text-left font-medium">
                      {t("fields.unit")}
                    </th>
                    <th className="text-muted-foreground px-3 py-3 text-left font-medium">
                      {t("expenses.fields.spentAt")}
                    </th>
                    <th className="text-muted-foreground px-3 py-3 text-left font-medium">
                      {t("summary.columns.createdBy")}
                    </th>
                    <th className="text-muted-foreground px-3 py-3 text-left font-medium">
                      {t("expenses.fields.note")}
                    </th>
                    <th className="text-muted-foreground px-3 py-3 text-right font-medium">
                      {t("expenses.fields.amount")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {summary.expenseRows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-3 font-medium">{row.title}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${CATEGORY_COLORS[row.category]}`}
                        >
                          {t(`category.${row.category}`)}
                        </span>
                      </td>
                      <td className="px-3 py-3">{row.ticketTitle}</td>
                      <td className="px-3 py-3">
                        {t("fields.floor")} {row.floorNumber} - {row.unitNumber}
                      </td>
                      <td className="px-3 py-3">{formatDate(row.spentAt, locale)}</td>
                      <td className="px-3 py-3">{row.createdBy}</td>
                      <td className="text-muted-foreground px-3 py-3">{row.note ?? "-"}</td>
                      <td className="px-3 py-3 text-right font-semibold">
                        {formatCurrency(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  wrapperClassName,
  iconClassName,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  description: string;
  wrapperClassName: string;
  iconClassName: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${wrapperClassName}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-foreground mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="text-muted-foreground mt-2 text-xs">{description}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${iconClassName}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function BreakdownCard<T>({
  title,
  items,
  renderItem,
  emptyText,
}: {
  title: string;
  items: T[];
  renderItem: (item: T) => ReactNode;
  emptyText: string;
}) {
  return (
    <div className="bg-card border-border rounded-2xl border p-4">
      <h2 className="text-foreground text-sm font-semibold">{title}</h2>
      <div className="mt-3 space-y-2">
        {items.length > 0 ? (
          items.map((item, index) => <div key={index}>{renderItem(item)}</div>)
        ) : (
          <div className="border-border text-muted-foreground rounded-xl border border-dashed px-3 py-6 text-center text-sm">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryRow({
  item,
  label,
  meta,
}: {
  item: MaintenanceExpenseSummaryCategory;
  label: string;
  meta: string;
}) {
  if (item.expenseCount === 0) {
    return null;
  }

  return (
    <div className="bg-muted/40 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[item.category]}`}
          >
            {label}
          </span>
        </div>
        <p className="text-muted-foreground mt-1 truncate text-xs">{meta}</p>
      </div>
      <p className="text-foreground shrink-0 text-sm font-semibold">
        {formatCurrency(item.totalAmount)}
      </p>
    </div>
  );
}

function TextRow({ label, meta, value }: { label: string; meta: string; value: string }) {
  return (
    <div className="bg-muted/40 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-foreground truncate text-sm font-medium">{label}</p>
        <p className="text-muted-foreground truncate text-xs">{meta}</p>
      </div>
      <p className="text-foreground shrink-0 text-sm font-semibold">{value}</p>
    </div>
  );
}

function SimpleBarChart({
  data,
  emptyText,
}: {
  data: {
    label: string;
    value: number;
    meta: string;
  }[];
  emptyText: string;
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 0);

  if (maxValue === 0) {
    return (
      <div className="border-border text-muted-foreground rounded-2xl border border-dashed px-4 py-12 text-center text-sm">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-foreground truncate text-sm font-medium">{item.label}</p>
              <p className="text-muted-foreground truncate text-xs">{item.meta}</p>
            </div>
            <p className="text-foreground shrink-0 text-sm font-semibold">
              {formatCurrency(item.value)}
            </p>
          </div>
          <div className="bg-muted h-2.5 rounded-full">
            <div
              className="h-full rounded-full bg-linear-to-r from-sky-500 via-cyan-500 to-emerald-500"
              style={{ width: `${Math.max((item.value / maxValue) * 100, 6)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function getPeriodLabel(
  summary: MaintenanceExpenseSummary,
  locale: string,
  t: ReturnType<typeof useTranslations<"maintenance">>,
) {
  if (summary.period.periodType === "daily" && summary.period.month && summary.period.day) {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "long",
    }).format(new Date(summary.period.startDate));
  }

  if (summary.period.periodType === "monthly" && summary.period.month) {
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    }).format(new Date(summary.period.startDate));
  }

  return t("summary.yearLabel", { year: summary.period.year });
}

function formatCurrency(value: number): string {
  return `฿${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(value));
}
