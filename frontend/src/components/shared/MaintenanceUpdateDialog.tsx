"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/ui/select-input";
import type { UserOption } from "@/services/userService";
import type {
  CreateExpenseRequest,
  MaintenanceExpense,
  MaintenanceStatus,
  MaintenanceTicket,
  TicketLog,
  UpdateTicketRequest,
} from "@/types/maintenance";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: MaintenanceTicket | null;
  onSubmit: (data: UpdateTicketRequest) => Promise<void>;
  onAddExpense: (data: CreateExpenseRequest) => Promise<void>;
  onDeleteExpense: (expenseId: string) => Promise<void>;
  isPending?: boolean;
  staffUsers: UserOption[];
}

const STATUSES: MaintenanceStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED"];

interface ExpenseErrors {
  title?: string;
  amount?: string;
  spentAt?: string;
}

function TicketHistory({ logs }: { logs: TicketLog[] }) {
  const t = useTranslations("maintenance");
  const tAuth = useTranslations("auth");

  if (logs.length === 0) {
    return <p className="text-muted-foreground py-2 text-center text-xs">{t("history.noLogs")}</p>;
  }

  const getActionLabel = (log: TicketLog): string => {
    switch (log.action) {
      case "CREATED":
        return t("history.actions.CREATED");
      case "STATUS_CHANGED":
        return t("history.actions.STATUS_CHANGED", {
          new: log.newValue ? t(`status.${log.newValue as MaintenanceStatus}`) : "—",
        });
      case "ASSIGNED":
        return t("history.actions.ASSIGNED", { new: log.newValue ?? "—" });
      case "REASSIGNED":
        return t("history.actions.REASSIGNED", { new: log.newValue ?? "—" });
      case "UNASSIGNED":
        return t("history.actions.UNASSIGNED");
      case "NOTE_UPDATED":
        return t("history.actions.NOTE_UPDATED");
      case "EXPENSE_ADDED":
        return t("history.actions.EXPENSE_ADDED");
      case "EXPENSE_REMOVED":
        return t("history.actions.EXPENSE_REMOVED");
      default:
        return log.action;
    }
  };

  const reversed = [...logs].reverse();

  return (
    <ol className="space-y-3">
      {reversed.map((log, i) => (
        <li key={log.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="bg-primary mt-1 h-2 w-2 shrink-0 rounded-full" />
            {i < reversed.length - 1 && <div className="bg-border mt-1 w-px flex-1" />}
          </div>
          <div className="min-w-0 pb-3">
            <div className="flex items-center gap-1.5">
              <p className="text-foreground text-xs font-medium">{getActionLabel(log)}</p>
              {i === 0 && (
                <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] leading-none font-semibold text-white dark:bg-amber-400 dark:text-amber-900">
                  {t("history.latest")}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {log.user.firstName} {log.user.lastName} ·{" "}
              {tAuth(
                `roles.${log.user.role as "ADMIN" | "JURISTIC" | "MAINTENANCE" | "GUARD" | "RESIDENT"}`,
              )}{" "}
              ·{" "}
              {new Date(log.createdAt).toLocaleString("th-TH", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function UpdateForm({
  ticket,
  onSubmit,
  onAddExpense,
  onDeleteExpense,
  isPending,
  staffUsers,
}: Omit<Props, "open" | "onOpenChange">) {
  const t = useTranslations("maintenance");
  const tCommon = useTranslations("common");

  const [status, setStatus] = useState<MaintenanceStatus>(ticket?.status ?? "OPEN");
  const [assignedToId, setAssignedToId] = useState<string>(ticket?.assignedToId ?? "");
  const [note, setNote] = useState(ticket?.note ?? "");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseSpentAt, setExpenseSpentAt] = useState(new Date().toISOString().slice(0, 10));
  const [expenseNote, setExpenseNote] = useState("");
  const [expenseErrors, setExpenseErrors] = useState<ExpenseErrors>({});

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    await onSubmit({
      status,
      assignedToId: assignedToId || null,
      note: note.trim() || undefined,
    });
  };

  const handleAddExpense = async () => {
    const nextErrors: ExpenseErrors = {};
    const amount = Number(expenseAmount);

    if (!expenseTitle.trim()) {
      nextErrors.title = t("validation.expenseTitleRequired");
    }

    if (!expenseAmount || Number.isNaN(amount) || amount <= 0) {
      nextErrors.amount = t("validation.expenseAmountInvalid");
    }

    if (!expenseSpentAt) {
      nextErrors.spentAt = t("validation.expenseDateRequired");
    }

    setExpenseErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onAddExpense({
      title: expenseTitle.trim(),
      amount,
      spentAt: new Date(expenseSpentAt).toISOString(),
      note: expenseNote.trim() || undefined,
    });

    setExpenseTitle("");
    setExpenseAmount("");
    setExpenseSpentAt(new Date().toISOString().slice(0, 10));
    setExpenseNote("");
    setExpenseErrors({});
  };

  const inputBase =
    "border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none";

  const expenses = ticket?.expenses ?? [];

  return (
    <div className="flex max-h-[70vh] flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <form id="update-ticket-form" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 px-6 py-5">
            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-foreground text-sm font-medium">
                {t("fields.status")} <span className="text-destructive">*</span>
              </label>
              <SelectInput
                value={status}
                onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`status.${s}`)}
                  </option>
                ))}
              </SelectInput>
            </div>

            {/* Assigned To */}
            <div className="space-y-1.5">
              <label className="text-foreground text-sm font-medium">
                {t("fields.assignedTo")}{" "}
                <span className="text-muted-foreground font-normal">({t("fields.optional")})</span>
              </label>
              <SelectInput value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
                <option value="">— {t("fields.unassigned")} —</option>
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </SelectInput>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="text-foreground text-sm font-medium">
                {t("fields.note")}{" "}
                <span className="text-muted-foreground font-normal">({t("fields.optional")})</span>
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("fields.notePlaceholder")}
                className={`${inputBase} resize-none`}
              />
            </div>

            <div className="border-border space-y-4 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-foreground text-sm font-semibold">{t("expenses.title")}</p>
                  <p className="text-muted-foreground text-xs">{t("expenses.subtitle")}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">{t("expenses.total")}</p>
                  <p className="text-foreground text-sm font-semibold">
                    ฿{ticket?.expenseTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-foreground text-sm font-medium">
                      {t("expenses.fields.title")} <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={expenseTitle}
                      onChange={(e) => {
                        setExpenseTitle(e.target.value);
                        setExpenseErrors((prev) => ({ ...prev, title: undefined }));
                      }}
                      placeholder={t("expenses.fields.titlePlaceholder")}
                      className={`${inputBase} ${expenseErrors.title ? "border-destructive" : ""}`}
                    />
                    {expenseErrors.title && (
                      <p className="text-destructive text-xs">{expenseErrors.title}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-foreground text-sm font-medium">
                      {t("expenses.fields.amount")} <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={expenseAmount}
                      onChange={(e) => {
                        setExpenseAmount(e.target.value);
                        setExpenseErrors((prev) => ({ ...prev, amount: undefined }));
                      }}
                      placeholder="0.00"
                      className={`${inputBase} ${expenseErrors.amount ? "border-destructive" : ""}`}
                    />
                    {expenseErrors.amount && (
                      <p className="text-destructive text-xs">{expenseErrors.amount}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-foreground text-sm font-medium">
                      {t("expenses.fields.spentAt")} <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="date"
                      value={expenseSpentAt}
                      onChange={(e) => {
                        setExpenseSpentAt(e.target.value);
                        setExpenseErrors((prev) => ({ ...prev, spentAt: undefined }));
                      }}
                      onKeyDown={(e) => e.preventDefault()}
                      onPaste={(e) => e.preventDefault()}
                      className={`${inputBase} cursor-pointer scheme-light dark:scheme-dark ${expenseErrors.spentAt ? "border-destructive" : ""}`}
                    />
                    {expenseErrors.spentAt && (
                      <p className="text-destructive text-xs">{expenseErrors.spentAt}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-foreground text-sm font-medium">
                      {t("expenses.fields.note")}{" "}
                      <span className="text-muted-foreground font-normal">
                        ({t("fields.optional")})
                      </span>
                    </label>
                    <input
                      type="text"
                      value={expenseNote}
                      onChange={(e) => setExpenseNote(e.target.value)}
                      placeholder={t("expenses.fields.notePlaceholder")}
                      className={inputBase}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled={isPending}
                    className="cursor-pointer"
                    onClick={() => void handleAddExpense()}
                  >
                    {t("expenses.addAction")}
                  </Button>
                </div>
              </div>

              {expenses.length === 0 ? (
                <p className="text-muted-foreground text-center text-xs">{t("expenses.empty")}</p>
              ) : (
                <div className="space-y-2">
                  {expenses.map((expense) => (
                    <ExpenseItem
                      key={expense.id}
                      expense={expense}
                      isPending={isPending}
                      onDelete={onDeleteExpense}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* History */}
        {ticket?.logs && ticket.logs.length > 0 && (
          <div className="border-border border-t px-6 py-4">
            <p className="text-foreground mb-3 text-sm font-semibold">{t("history.title")}</p>
            <TicketHistory logs={ticket.logs} />
          </div>
        )}
      </div>

      <div className="border-border flex shrink-0 items-center justify-end gap-3 border-t px-6 py-4">
        <Dialog.Close
          disabled={isPending}
          className="border-border bg-background text-foreground hover:bg-muted inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {tCommon("actions.cancel")}
        </Dialog.Close>
        <Button
          form="update-ticket-form"
          type="submit"
          disabled={isPending}
          className="cursor-pointer"
        >
          {isPending ? tCommon("status.loading") : tCommon("actions.save")}
        </Button>
      </div>
    </div>
  );
}

export function MaintenanceUpdateDialog({
  open,
  onOpenChange,
  ticket,
  onSubmit,
  onAddExpense,
  onDeleteExpense,
  isPending,
  staffUsers,
}: Props) {
  const t = useTranslations("maintenance");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Popup className="bg-card border-border fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border shadow-xl outline-none">
          <div className="border-border flex items-center justify-between border-b px-6 py-4">
            <div className="min-w-0">
              <Dialog.Title className="text-foreground truncate text-base font-semibold">
                {t("updateTicket")}
              </Dialog.Title>
              {ticket && (
                <p className="text-muted-foreground mt-0.5 truncate text-xs">{ticket.title}</p>
              )}
            </div>
            <Dialog.Close className="text-muted-foreground hover:text-foreground ml-4 shrink-0 cursor-pointer rounded-lg p-1 transition-colors focus:outline-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </Dialog.Close>
          </div>
          {open && ticket && (
            <UpdateForm
              key={ticket.id}
              ticket={ticket}
              onSubmit={onSubmit}
              onAddExpense={onAddExpense}
              onDeleteExpense={onDeleteExpense}
              isPending={isPending}
              staffUsers={staffUsers}
            />
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ExpenseItem({
  expense,
  isPending,
  onDelete,
}: {
  expense: MaintenanceExpense;
  isPending?: boolean;
  onDelete: (expenseId: string) => Promise<void>;
}) {
  const t = useTranslations("maintenance");
  const tAuth = useTranslations("auth");

  return (
    <div className="border-border flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-foreground truncate text-sm font-medium">{expense.title}</p>
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
            ฿{Number(expense.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
        {expense.note && <p className="text-muted-foreground mt-1 text-xs">{expense.note}</p>}
        <p className="text-muted-foreground mt-1 text-xs">
          {new Date(expense.spentAt).toLocaleDateString("th-TH")} · {expense.createdBy.firstName}{" "}
          {expense.createdBy.lastName} ·{" "}
          {tAuth(
            `roles.${expense.createdBy.role as "ADMIN" | "JURISTIC" | "MAINTENANCE" | "GUARD" | "RESIDENT"}`,
          )}
        </p>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => void onDelete(expense.id)}
        className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={t("expenses.deleteAction")}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
