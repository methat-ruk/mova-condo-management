"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CreateEmergencyContactRequest, EmergencyContact } from "@/types/resident";

interface EmergencyContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateEmergencyContactRequest) => Promise<void>;
  defaultValues?: EmergencyContact;
  isPending?: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  relationship?: string;
  phone?: string;
}

function EmergencyContactForm({
  onSubmit,
  defaultValues,
  isPending,
}: Omit<EmergencyContactFormDialogProps, "open" | "onOpenChange">) {
  const t = useTranslations("residents");
  const tCommon = useTranslations("common");

  const [firstName, setFirstName] = useState(defaultValues?.firstName ?? "");
  const [lastName, setLastName] = useState(defaultValues?.lastName ?? "");
  const [relationship, setRelationship] = useState(defaultValues?.relationship ?? "");
  const [phone, setPhone] = useState(defaultValues?.phone ?? "");
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!firstName.trim()) next.firstName = t("validation.firstNameRequired");
    if (!lastName.trim()) next.lastName = t("validation.lastNameRequired");
    if (!relationship.trim()) next.relationship = t("validation.relationshipRequired");
    if (!phone.trim()) next.phone = t("validation.phoneRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      relationship: relationship.trim(),
      phone: phone.trim(),
    });
  };

  const inputClass = (hasError?: string) =>
    `border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none ${hasError ? "border-destructive focus:ring-destructive/30" : ""}`;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4 px-6 py-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-foreground text-sm font-medium" htmlFor="ecFirstName">
              {t("fields.firstName")} <span className="text-destructive">*</span>
            </label>
            <input
              id="ecFirstName"
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setErrors((p) => ({ ...p, firstName: undefined }));
              }}
              className={inputClass(errors.firstName)}
            />
            {errors.firstName && <p className="text-destructive text-xs">{errors.firstName}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-foreground text-sm font-medium" htmlFor="ecLastName">
              {t("fields.lastName")} <span className="text-destructive">*</span>
            </label>
            <input
              id="ecLastName"
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setErrors((p) => ({ ...p, lastName: undefined }));
              }}
              className={inputClass(errors.lastName)}
            />
            {errors.lastName && <p className="text-destructive text-xs">{errors.lastName}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium" htmlFor="ecRelationship">
            {t("fields.relationship")} <span className="text-destructive">*</span>
          </label>
          <input
            id="ecRelationship"
            type="text"
            value={relationship}
            onChange={(e) => {
              setRelationship(e.target.value);
              setErrors((p) => ({ ...p, relationship: undefined }));
            }}
            className={inputClass(errors.relationship)}
          />
          {errors.relationship && <p className="text-destructive text-xs">{errors.relationship}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium" htmlFor="ecPhone">
            {t("fields.phone")} <span className="text-destructive">*</span>
          </label>
          <input
            id="ecPhone"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setErrors((p) => ({ ...p, phone: undefined }));
            }}
            className={inputClass(errors.phone)}
          />
          {errors.phone && <p className="text-destructive text-xs">{errors.phone}</p>}
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

export function EmergencyContactFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isPending,
}: EmergencyContactFormDialogProps) {
  const t = useTranslations("residents");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Popup className="bg-card border-border fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border shadow-xl outline-none">
          <div className="border-border flex items-center justify-between border-b px-6 py-4">
            <Dialog.Title className="text-foreground text-base font-semibold">
              {defaultValues ? t("editEmergencyContact") : t("addEmergencyContact")}
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
          <EmergencyContactForm
            key={defaultValues?.id ?? "new"}
            onSubmit={onSubmit}
            defaultValues={defaultValues}
            isPending={isPending}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
