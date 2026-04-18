"use client";

import { ArrowLeft, LogOut, Pencil, Phone, Plus, Trash2, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmergencyContactFormDialog } from "@/components/shared/EmergencyContactFormDialog";
import { FamilyMemberFormDialog } from "@/components/shared/FamilyMemberFormDialog";
import { MoveOutDialog } from "@/components/shared/MoveOutDialog";
import { Button } from "@/components/ui/button";
import { residentService } from "@/services/residentService";
import type { ApiError } from "@/types";
import type {
  CreateEmergencyContactRequest,
  CreateFamilyMemberRequest,
  EmergencyContact,
  FamilyMember,
  Resident,
} from "@/types/resident";

function calcDuration(
  from: string,
  to?: string,
): { yearsApprox: number; months: number; days: number } {
  const start = new Date(from);
  const end = to ? new Date(to) : new Date();
  const ms = end.getTime() - start.getTime();
  const totalDays = Math.max(0, Math.floor(ms / 86400000));
  const months = Math.floor(totalDays / 30);
  return {
    yearsApprox: Math.round((totalDays / 365) * 10) / 10,
    months,
    days: totalDays % 30,
  };
}

export default function ResidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations("residents");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");

  const [resident, setResident] = useState<Resident | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Delete resident
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  // Move-out
  const [moveOutOpen, setMoveOutOpen] = useState(false);
  const [isMovingOut, startMoveOutTransition] = useTransition();

  // Family members
  const [fmOpen, setFmOpen] = useState(false);
  const [editFm, setEditFm] = useState<FamilyMember | undefined>();
  const [isFmPending, startFmTransition] = useTransition();
  const [deleteFm, setDeleteFm] = useState<FamilyMember | null>(null);
  const [isDeletingFm, startDeleteFmTransition] = useTransition();

  // Emergency contacts
  const [ecOpen, setEcOpen] = useState(false);
  const [editEc, setEditEc] = useState<EmergencyContact | undefined>();
  const [isEcPending, startEcTransition] = useTransition();
  const [deleteEc, setDeleteEc] = useState<EmergencyContact | null>(null);
  const [isDeletingEc, startDeleteEcTransition] = useTransition();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await residentService.getOne(id);
      setResident(data);
    } catch {
      toast.error(tCommon("status.error"));
    } finally {
      setIsLoading(false);
    }
  }, [id, tCommon]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = () => {
    startDeleteTransition(async () => {
      try {
        await residentService.remove(id);
        toast.success(t("deleteResidentSuccess"));
        router.push("/residents");
      } catch (err) {
        toast.error((err as ApiError).message ?? tCommon("status.error"));
      }
    });
  };

  const handleMoveOut = async (moveOutDate?: string) => {
    startMoveOutTransition(async () => {
      try {
        const updated = await residentService.moveOut(id, { moveOutDate });
        setResident(updated);
        toast.success(t("moveOutSuccess"));
        setMoveOutOpen(false);
      } catch (err) {
        const e = err as ApiError;
        toast.error(e.message ?? tCommon("status.error"));
      }
    });
  };

  // Family Member handlers
  const handleFmSubmit = async (data: CreateFamilyMemberRequest) => {
    startFmTransition(async () => {
      try {
        if (editFm) {
          const updated = await residentService.updateFamilyMember(id, editFm.id, data);
          setResident((prev) =>
            prev
              ? {
                  ...prev,
                  familyMembers: prev.familyMembers.map((m) => (m.id === updated.id ? updated : m)),
                }
              : prev,
          );
        } else {
          const created = await residentService.addFamilyMember(id, data);
          setResident((prev) =>
            prev ? { ...prev, familyMembers: [...prev.familyMembers, created] } : prev,
          );
        }
        toast.success(editFm ? tCommon("actions.update") : t("createSuccess"));
        setFmOpen(false);
        setEditFm(undefined);
      } catch (err) {
        const e = err as ApiError;
        toast.error(e.message ?? tCommon("status.error"));
      }
    });
  };

  const handleDeleteFm = () => {
    if (!deleteFm) return;
    startDeleteFmTransition(async () => {
      try {
        await residentService.removeFamilyMember(id, deleteFm.id);
        setResident((prev) =>
          prev
            ? { ...prev, familyMembers: prev.familyMembers.filter((m) => m.id !== deleteFm.id) }
            : prev,
        );
        toast.success(t("deleteSuccess"));
        setDeleteFm(null);
      } catch (err) {
        const e = err as ApiError;
        toast.error(e.message ?? tCommon("status.error"));
      }
    });
  };

  // Emergency Contact handlers
  const handleEcSubmit = async (data: CreateEmergencyContactRequest) => {
    startEcTransition(async () => {
      try {
        if (editEc) {
          const updated = await residentService.updateEmergencyContact(id, editEc.id, data);
          setResident((prev) =>
            prev
              ? {
                  ...prev,
                  emergencyContacts: prev.emergencyContacts.map((c) =>
                    c.id === updated.id ? updated : c,
                  ),
                }
              : prev,
          );
        } else {
          const created = await residentService.addEmergencyContact(id, data);
          setResident((prev) =>
            prev ? { ...prev, emergencyContacts: [...prev.emergencyContacts, created] } : prev,
          );
        }
        toast.success(editEc ? tCommon("actions.update") : t("createSuccess"));
        setEcOpen(false);
        setEditEc(undefined);
      } catch (err) {
        const e = err as ApiError;
        toast.error(e.message ?? tCommon("status.error"));
      }
    });
  };

  const handleDeleteEc = () => {
    if (!deleteEc) return;
    startDeleteEcTransition(async () => {
      try {
        await residentService.removeEmergencyContact(id, deleteEc.id);
        setResident((prev) =>
          prev
            ? {
                ...prev,
                emergencyContacts: prev.emergencyContacts.filter((c) => c.id !== deleteEc.id),
              }
            : prev,
        );
        toast.success(t("deleteSuccess"));
        setDeleteEc(null);
      } catch (err) {
        const e = err as ApiError;
        toast.error(e.message ?? tCommon("status.error"));
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="bg-card border-border space-y-4 rounded-xl border p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted h-4 w-full animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <UserRound className="text-muted-foreground h-10 w-10" />
        <p className="text-foreground font-medium">{tCommon("status.noData")}</p>
        <Button
          variant="outline"
          render={<Link href="/residents" />}
          className="cursor-pointer gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {tCommon("actions.back")}
        </Button>
      </div>
    );
  }

  const isActive = resident.status === "ACTIVE";

  return (
    <div className="space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/residents" />}
          className="cursor-pointer gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {tCommon("actions.back")}
        </Button>
        <div className="flex items-center gap-2">
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMoveOutOpen(true)}
              className="border-destructive text-destructive hover:bg-destructive/10 cursor-pointer gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t("moveOut")}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="border-destructive text-destructive hover:bg-destructive/10 cursor-pointer gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("deleteResident")}
          </Button>
        </div>
      </div>

      {/* Resident info */}
      <div className="bg-card border-border space-y-4 rounded-xl border p-6">
        <div className="flex items-start gap-4">
          <div className="bg-muted flex h-14 w-14 shrink-0 items-center justify-center rounded-full">
            <UserRound className="text-muted-foreground h-7 w-7" />
          </div>
          <div className="flex-1">
            <h1 className="text-foreground text-xl font-bold">
              {resident.user.firstName} {resident.user.lastName}
            </h1>
            <p className="text-muted-foreground text-sm">{resident.user.email}</p>
          </div>
          <span
            className={`mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isActive
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {t(`status.${resident.status}`)}
          </span>
        </div>

        <div className="border-border grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs">{t("fields.unit")}</p>
            <p className="text-foreground text-sm font-medium">
              {t("fields.floor")} {resident.unit.floor.floorNumber} — {resident.unit.unitNumber}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t("fields.residentType")}</p>
            <p className="text-foreground text-sm font-medium">
              {t(`residentType.${resident.residentType}`)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t("fields.moveInDate")}</p>
            <p className="text-foreground text-sm font-medium">
              {new Date(resident.moveInDate).toLocaleDateString()}
            </p>
          </div>
          {resident.moveOutDate && (
            <div>
              <p className="text-muted-foreground text-xs">{t("fields.moveOutDate")}</p>
              <p className="text-foreground text-sm font-medium">
                {new Date(resident.moveOutDate).toLocaleDateString()}
              </p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground text-xs">{t("duration")}</p>
            <p className="text-foreground text-sm font-medium">
              {(() => {
                const { yearsApprox, months, days } = calcDuration(
                  resident.moveInDate,
                  resident.moveOutDate,
                );
                const yearHint =
                  yearsApprox >= 1 ? t("durationYearsApprox", { years: yearsApprox }) + " " : "";
                const dur =
                  months > 0 ? t("durationMonths", { months, days }) : t("durationDays", { days });
                return yearHint + dur;
              })()}
            </p>
          </div>
          {resident.createdBy && (
            <div>
              <p className="text-muted-foreground text-xs">{t("addedBy")}</p>
              <p className="text-foreground text-sm font-medium">
                {resident.createdBy.firstName} {resident.createdBy.lastName}
              </p>
              <p className="text-muted-foreground text-xs">
                {tAuth(
                  `roles.${resident.createdBy.role as "ADMIN" | "JURISTIC" | "MAINTENANCE" | "GUARD" | "RESIDENT"}`,
                )}
              </p>
            </div>
          )}
          {resident.note && (
            <div className="col-span-2 sm:col-span-3">
              <p className="text-muted-foreground text-xs">{t("fields.note")}</p>
              <p className="text-foreground text-sm">{resident.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Family Members */}
      <div className="bg-card border-border rounded-xl border">
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="text-muted-foreground h-4 w-4" />
            <h2 className="text-foreground font-semibold">{t("familyMembers")}</h2>
            <span className="text-muted-foreground text-xs">({resident.familyMembers.length})</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer gap-1.5"
            onClick={() => {
              setEditFm(undefined);
              setFmOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            {t("addFamilyMember")}
          </Button>
        </div>

        {resident.familyMembers.length === 0 ? (
          <p className="text-muted-foreground px-6 py-8 text-center text-sm">
            {t("noFamilyMembers")}
          </p>
        ) : (
          <div className="divide-border divide-y">
            {resident.familyMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-foreground text-sm font-medium">
                    {m.firstName} {m.lastName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {m.relationship}
                    {m.phone ? ` · ${m.phone}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer"
                    onClick={() => {
                      setEditFm(m);
                      setFmOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 cursor-pointer"
                    onClick={() => setDeleteFm(m)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emergency Contacts */}
      <div className="bg-card border-border rounded-xl border">
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Phone className="text-muted-foreground h-4 w-4" />
            <h2 className="text-foreground font-semibold">{t("emergencyContacts")}</h2>
            <span className="text-muted-foreground text-xs">
              ({resident.emergencyContacts.length})
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer gap-1.5"
            onClick={() => {
              setEditEc(undefined);
              setEcOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            {t("addEmergencyContact")}
          </Button>
        </div>

        {resident.emergencyContacts.length === 0 ? (
          <p className="text-muted-foreground px-6 py-8 text-center text-sm">
            {t("noEmergencyContacts")}
          </p>
        ) : (
          <div className="divide-border divide-y">
            {resident.emergencyContacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-foreground text-sm font-medium">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {c.relationship} · {c.phone}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer"
                    onClick={() => {
                      setEditEc(c);
                      setEcOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 cursor-pointer"
                    onClick={() => setDeleteEc(c)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deleteResidentConfirmTitle")}
        description={t("deleteResidentConfirmDesc")}
        onConfirm={handleDelete}
        isPending={isDeleting}
      />

      <MoveOutDialog
        open={moveOutOpen}
        onOpenChange={setMoveOutOpen}
        onConfirm={handleMoveOut}
        isPending={isMovingOut}
      />

      <FamilyMemberFormDialog
        open={fmOpen}
        onOpenChange={(o) => {
          if (!o) setEditFm(undefined);
          setFmOpen(o);
        }}
        onSubmit={handleFmSubmit}
        defaultValues={editFm}
        isPending={isFmPending}
      />

      <ConfirmDialog
        open={!!deleteFm}
        onOpenChange={(o) => {
          if (!o) setDeleteFm(null);
        }}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        onConfirm={handleDeleteFm}
        isPending={isDeletingFm}
      />

      <EmergencyContactFormDialog
        open={ecOpen}
        onOpenChange={(o) => {
          if (!o) setEditEc(undefined);
          setEcOpen(o);
        }}
        onSubmit={handleEcSubmit}
        defaultValues={editEc}
        isPending={isEcPending}
      />

      <ConfirmDialog
        open={!!deleteEc}
        onOpenChange={(o) => {
          if (!o) setDeleteEc(null);
        }}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        onConfirm={handleDeleteEc}
        isPending={isDeletingEc}
      />
    </div>
  );
}
