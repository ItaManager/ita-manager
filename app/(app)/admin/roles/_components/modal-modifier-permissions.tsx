"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, AlertCircle, Shield } from "lucide-react";
import { modifierPermissionsRole } from "@/lib/actions/roles";
import { toast } from "sonner";

interface Permission {
  code: string;
  libelle: string;
  domaine: string;
}

interface Role {
  id: string;
  code: string;
  libelle: string;
  description: string | null;
  permissions: Permission[];
}

interface ModalModifierPermissionsProps {
  ouvert: boolean;
  onFermer: () => void;
  role: Role;
  permissionsDisponibles: Permission[];
  onSuccess: () => void;
}

export function ModalModifierPermissions({
  ouvert,
  onFermer,
  role,
  permissionsDisponibles,
  onSuccess,
}: ModalModifierPermissionsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [permissionsSelectionnees, setPermissionsSelectionnees] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Initialiser avec les permissions actuelles du rôle
    setPermissionsSelectionnees(new Set(role.permissions.map((p) => p.code)));
  }, [role]);

  const handleTogglePermission = (code: string) => {
    const newSet = new Set(permissionsSelectionnees);
    if (newSet.has(code)) {
      newSet.delete(code);
    } else {
      newSet.add(code);
    }
    setPermissionsSelectionnees(newSet);
  };

  const handleToggleDomaine = (domaine: string, permissions: Permission[]) => {
    const permissionsCodes = permissions.map((p) => p.code);
    const toutesSelectionnees = permissionsCodes.every((code) => permissionsSelectionnees.has(code));

    const newSet = new Set(permissionsSelectionnees);
    if (toutesSelectionnees) {
      // Tout désélectionner
      permissionsCodes.forEach((code) => newSet.delete(code));
    } else {
      // Tout sélectionner
      permissionsCodes.forEach((code) => newSet.add(code));
    }
    setPermissionsSelectionnees(newSet);
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await modifierPermissionsRole({
          roleId: role.id,
          permissionsCodes: Array.from(permissionsSelectionnees),
        });

        if (result.success) {
          toast.success("Permissions modifiées avec succès");
          onFermer();
          onSuccess();
        } else {
          setError(result.error || "Erreur lors de la modification");
        }
      } catch (err) {
        setError("Une erreur est survenue");
      }
    });
  };

  const handleFermer = () => {
    if (!isPending) {
      setError(null);
      onFermer();
    }
  };

  // Grouper les permissions par domaine
  const permissionsParDomaine = permissionsDisponibles.reduce((acc, perm) => {
    if (!acc[perm.domaine]) {
      acc[perm.domaine] = [];
    }
    acc[perm.domaine].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const rolesProtégés = ["ADMIN", "DG", "DRH", "DFC"];
  const estProtege = rolesProtégés.includes(role.code);

  return (
    <Dialog open={ouvert} onOpenChange={handleFermer}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="relative -mt-6 -mx-6 px-6 pt-6 pb-4 rounded-t-xl" style={{ backgroundColor: '#ebeaf2' }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFermer}
            className="absolute -right-2 -top-2 h-8 w-8"
            disabled={isPending}
          >
            <X className="size-4" />
          </Button>
          <DialogTitle className="text-xl font-semibold" style={{ color: '#1d186c' }}>
            Modifier les permissions — {role.libelle}
          </DialogTitle>
          {role.description && (
            <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {estProtege && (
            <Alert>
              <Shield className="size-4" />
              <AlertDescription>
                Ce rôle système est protégé. Certaines modifications peuvent être limitées.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {Object.entries(permissionsParDomaine).map(([domaine, permissions]) => {
              const nbSelectionnees = permissions.filter((p) =>
                permissionsSelectionnees.has(p.code)
              ).length;
              const toutesSelectionnees = nbSelectionnees === permissions.length;
              const certainesSelectionnees = nbSelectionnees > 0 && nbSelectionnees < permissions.length;

              return (
                <div key={domaine} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`domaine-${domaine}`}
                        checked={toutesSelectionnees}
                        ref={(el) => {
                          if (el) {
                            (el as any).indeterminate = certainesSelectionnees;
                          }
                        }}
                        onCheckedChange={() => handleToggleDomaine(domaine, permissions)}
                        disabled={isPending}
                      />
                      <label
                        htmlFor={`domaine-${domaine}`}
                        className="text-sm font-semibold uppercase text-foreground cursor-pointer"
                      >
                        {domaine}
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {nbSelectionnees} / {permissions.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 ml-6">
                    {permissions.map((permission) => (
                      <div key={permission.code} className="flex items-start gap-2">
                        <Checkbox
                          id={permission.code}
                          checked={permissionsSelectionnees.has(permission.code)}
                          onCheckedChange={() => handleTogglePermission(permission.code)}
                          disabled={isPending}
                        />
                        <label
                          htmlFor={permission.code}
                          className="text-sm text-foreground leading-tight cursor-pointer flex-1"
                        >
                          {permission.libelle}
                          <span className="block text-xs text-muted-foreground font-mono">
                            {permission.code}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <div className="text-sm text-muted-foreground">
            <Shield className="size-4 inline mr-1" />
            {permissionsSelectionnees.size} permission{permissionsSelectionnees.size > 1 ? "s" : ""} sélectionnée{permissionsSelectionnees.size > 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleFermer}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
