"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/ui/select-input";
import type { UnitWithFloor } from "@/services/unitService";
import type { UserOption } from "@/services/userService";
import type { CreateResidentRequest, ResidentType } from "@/types/resident";

interface ResidentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateResidentRequest) => Promise<void>;
  isPending?: boolean;
  users: UserOption[];
  units: UnitWithFloor[];
}

interface FormErrors {
  userId?: string;
  unitId?: string;
  residentType?: string;
  moveInDate?: string;
}

interface FormState {
  userId: string;
  unitId: string;
  residentType: ResidentType | "";
  moveInDate: string;
  note: string;
}

function ResidentForm({
  onSubmit,
  isPending,
  users,
  units,
}: Omit<ResidentFormDialogProps, "open" | "onOpenChange">) {
  const t = useTranslations("residents");
  const tCommon = useTranslations("common");

  const [form, setForm] = useState<FormState>({
    userId: "",
    unitId: "",
    residentType: "",
    moveInDate: new Date().toISOString().slice(0, 10),
    note: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [userSearch, setUserSearch] = useState("");
  const [selectedFloorId, setSelectedFloorId] = useState("");

  const set = (key: keyof FormState, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [users, userSearch]);

  // Unique floors from units list
  const floors = useMemo(() => {
    const seen = new Set<string>();
    return units
      .filter((u) => {
        if (seen.has(u.floor.id)) return false;
        seen.add(u.floor.id);
        return true;
      })
      .map((u) => u.floor)
      .sort((a, b) => a.floorNumber - b.floorNumber);
  }, [units]);

  // Filter units by selected floor
  const filteredUnits = useMemo(() => {
    if (!selectedFloorId) return [];
    return units.filter((u) => u.floor.id === selectedFloorId);
  }, [units, selectedFloorId]);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.userId) next.userId = t("validation.userRequired");
    if (!form.unitId) next.unitId = t("validation.unitRequired");
    if (!form.residentType) next.residentType = t("validation.residentTypeRequired");
    if (!form.moveInDate) next.moveInDate = t("validation.moveInDateRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!validate() || !form.residentType) return;
    await onSubmit({
      userId: form.userId,
      unitId: form.unitId,
      residentType: form.residentType as ResidentType,
      moveInDate: form.moveInDate,
      note: form.note.trim() || undefined,
    });
  };

  const baseInput = `border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none`;
  const inputClass = (hasError?: string) =>
    `${baseInput} scheme-light dark:scheme-dark ${hasError ? "border-destructive focus:ring-destructive/30" : ""}`;

  const selectedUser = users.find((u) => u.id === form.userId);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4 px-6 py-5">
        {/* User — search autocomplete */}
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium">
            {t("fields.user")} <span className="text-destructive">*</span>
          </label>

          {selectedUser ? (
            <div className="border-border bg-muted/50 flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <p className="text-foreground text-sm font-medium">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <p className="text-muted-foreground text-xs">{selectedUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  set("userId", "");
                  setUserSearch("");
                }}
                className="text-muted-foreground hover:text-foreground cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className={inputClass(errors.userId)}
              />
              {userSearch.trim() && filteredUsers.length > 0 && (
                <div className="border-border bg-background absolute z-10 mt-1 w-full overflow-hidden rounded-lg border shadow-md">
                  {filteredUsers.slice(0, 8).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        set("userId", u.id);
                        setUserSearch("");
                      }}
                      className="hover:bg-muted w-full cursor-pointer px-3 py-2 text-left transition-colors"
                    >
                      <p className="text-foreground text-sm">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-muted-foreground text-xs">{u.email}</p>
                    </button>
                  ))}
                </div>
              )}
              {userSearch.trim() && filteredUsers.length === 0 && (
                <p className="text-muted-foreground mt-1 text-xs">{tCommon("status.noData")}</p>
              )}
            </div>
          )}
          {errors.userId && <p className="text-destructive text-xs">{errors.userId}</p>}
        </div>

        {/* Unit — select floor → select unit */}
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium">
            {t("fields.unit")} <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {/* Floor */}
            <SelectInput
              value={selectedFloorId}
              onChange={(e) => {
                setSelectedFloorId(e.target.value);
                set("unitId", "");
              }}
              hasError={!!errors.unitId && !selectedFloorId}
            >
              <option value="">— {t("fields.floor")} —</option>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {t("fields.floor")} {f.floorNumber}
                </option>
              ))}
            </SelectInput>

            {/* Unit */}
            <SelectInput
              value={form.unitId}
              onChange={(e) => set("unitId", e.target.value)}
              disabled={!selectedFloorId}
              hasError={!!errors.unitId}
            >
              <option value="">— {t("fields.unit")} —</option>
              {filteredUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unitNumber}
                </option>
              ))}
            </SelectInput>
          </div>
          {errors.unitId && <p className="text-destructive text-xs">{errors.unitId}</p>}
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium" htmlFor="resType">
            {t("fields.residentType")} <span className="text-destructive">*</span>
          </label>
          <SelectInput
            id="resType"
            value={form.residentType}
            onChange={(e) => set("residentType", e.target.value)}
            hasError={!!errors.residentType}
          >
            <option value="">— {t("fields.residentType")} —</option>
            <option value="OWNER">{t("residentType.OWNER")}</option>
            <option value="TENANT">{t("residentType.TENANT")}</option>
          </SelectInput>
          {errors.residentType && <p className="text-destructive text-xs">{errors.residentType}</p>}
        </div>

        {/* Move-in date */}
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium" htmlFor="resMoveIn">
            {t("fields.moveInDate")} <span className="text-destructive">*</span>
          </label>
          <input
            id="resMoveIn"
            type="date"
            value={form.moveInDate}
            onChange={(e) => set("moveInDate", e.target.value)}
            onKeyDown={(e) => e.preventDefault()}
            className={inputClass(errors.moveInDate)}
          />
          {errors.moveInDate && <p className="text-destructive text-xs">{errors.moveInDate}</p>}
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium" htmlFor="resNote">
            {t("fields.note")}
          </label>
          <textarea
            id="resNote"
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            rows={2}
            className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
      </div>

      <div className="border-border flex items-center justify-end gap-3 border-t px-6 py-4">
        <Dialog.Close
          disabled={isPending}
          className="border-border bg-background text-foreground hover:bg-muted inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {tCommon("actions.cancel")}
        </Dialog.Close>
        <Button type="submit" disabled={isPending} className="cursor-pointer">
          {isPending ? tCommon("status.loading") : tCommon("actions.save")}
        </Button>
      </div>
    </form>
  );
}

export function ResidentFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  users,
  units,
}: ResidentFormDialogProps) {
  const t = useTranslations("residents");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Popup className="bg-card border-border fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border shadow-xl outline-none">
          <div className="border-border flex items-center justify-between border-b px-6 py-4">
            <Dialog.Title className="text-foreground text-base font-semibold">
              {t("addResident")}
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 cursor-pointer rounded-lg p-1 transition-colors focus:outline-none focus-visible:ring-2">
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
          {open && (
            <ResidentForm onSubmit={onSubmit} isPending={isPending} users={users} units={units} />
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
