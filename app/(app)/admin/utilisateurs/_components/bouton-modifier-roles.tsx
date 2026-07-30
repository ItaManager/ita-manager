"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { modifierRolesUtilisateur } from "@/lib/actions/utilisateurs";
import type { Profil, Role, ProfilRole } from "@prisma/client";

interface BoutonModifierRolesProps {
  utilisateur: Profil & {
    roles: (ProfilRole & { role: Role })[];
  };
  rolesDisponibles: Role[];
}

export function BoutonModifierRoles({
  utilisateur,
  rolesDisponibles,
}: BoutonModifierRolesProps) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [rolesSelectionnes, setRolesSelectionnes] = useState<string[]>(
    utilisateur.roles.map((pr) => pr.roleId)
  );
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErreur(null);

    try {
      await modifierRolesUtilisateur(utilisateur.id, rolesSelectionnes);

      setOuvert(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setErreur(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    }
  };

  const toggleRole = (roleId: string) => {
    setRolesSelectionnes((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOuvert(true)}>
        Modifier les rôles
      </Button>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="sm:!max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier les rôles</DialogTitle>
            <DialogDescription>{utilisateur.email}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {erreur && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" aria-hidden="true" />
                <AlertDescription>{erreur}</AlertDescription>
              </Alert>
            )}

            {/* R-02 : Optimisé pour la lecture — checkboxes acceptables car 9 rôles seulement */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sélectionnez les rôles à attribuer à cet utilisateur.
              </p>

              <div className="space-y-3">
                {rolesDisponibles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-start space-x-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={rolesSelectionnes.includes(role.id)}
                      onCheckedChange={() => toggleRole(role.id)}
                      disabled={isPending}
                    />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={`role-${role.id}`}
                        className="font-medium cursor-pointer leading-none"
                      >
                        {role.libelle}
                      </Label>
                      {role.description && (
                        <p className="text-xs text-muted-foreground">
                          {role.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOuvert(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && (
                <Loader2
                  className="mr-2 size-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
