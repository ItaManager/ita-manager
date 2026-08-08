"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Loader2, Check, Copy } from "lucide-react";
import { creerCompteEmploye, obtenirRolesDisponibles } from "@/lib/actions/employes";
import { toast } from "sonner";

interface ModaleCreerCompteProps {
  ouvert: boolean;
  onClose: () => void;
  employeId: string;
  employeNom: string;
  employePrenom: string;
  emailInitial?: string;
}

interface Role {
  id: string;
  code: string;
  libelle: string;
  description: string | null;
}

export function ModaleCreerCompte({
  ouvert,
  onClose,
  employeId,
  employeNom,
  employePrenom,
  emailInitial,
}: ModaleCreerCompteProps) {
  const router = useRouter();
  const [email, setEmail] = useState(emailInitial || "");
  const [rolesSelectionnes, setRolesSelectionnes] = useState<string[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compteCree, setCompteCree] = useState(false);
  const [motDePasse, setMotDePasse] = useState<string | null>(null);

  // Charger les rôles disponibles
  useEffect(() => {
    if (ouvert) {
      obtenirRolesDisponibles().then((result) => {
        if (result.success) {
          setRoles(result.roles);
        }
      });
    }
  }, [ouvert]);

  const toggleRole = (roleId: string) => {
    setRolesSelectionnes((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const copierMotDePasse = () => {
    if (motDePasse) {
      navigator.clipboard.writeText(motDePasse);
      toast.success("Mot de passe copié !");
    }
  };

  const handleCreer = async () => {
    setErreur(null);

    // Validation
    if (!email || !email.includes("@")) {
      setErreur("Veuillez saisir une adresse email valide.");
      return;
    }

    if (rolesSelectionnes.length === 0) {
      setErreur("Veuillez sélectionner au moins un rôle.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await creerCompteEmploye(employeId, email, rolesSelectionnes);

      if (result.success) {
        setCompteCree(true);
        setMotDePasse(result.motDePasseTemporaire);
        toast.success(result.message);
      }
    } catch (error) {
      setErreur(
        error instanceof Error ? error.message : "Une erreur est survenue lors de la création du compte"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail(emailInitial || "");
      setRolesSelectionnes([]);
      setErreur(null);
      setCompteCree(false);
      setMotDePasse(null);
      onClose();
      router.refresh();
    }
  };

  return (
    <Dialog open={ouvert} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader
          className="border-b border-border px-6 py-4"
          style={{ backgroundColor: "#f0fdf4" }}
        >
          <DialogTitle className="text-xl font-semibold text-[#13850b]">
            Créer un compte d'accès
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {employeNom} {employePrenom}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6">
          {erreur && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertDescription>{erreur}</AlertDescription>
            </Alert>
          )}

          {compteCree && motDePasse ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <Check className="size-4 text-green-600" aria-hidden="true" />
                <AlertDescription className="text-green-800">
                  Le compte a été créé avec succès !
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Mot de passe temporaire
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={motDePasse}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={copierMotDePasse}
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                  >
                    <Copy className="size-4 mr-2" />
                    Copier
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⚠️ Communiquez ce mot de passe à l'employé de manière sécurisée.
                  Il devra le changer à sa première connexion.
                </p>
              </div>

              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  <strong>Adresse email :</strong> {email}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  L'employé peut maintenant se connecter avec ces identifiants.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Un compte d'accès permettra à cet employé de se connecter à ITA Manager
                  avec les permissions associées aux rôles sélectionnés.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Adresse email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@itasarl.ci"
                  className="h-10 rounded-md"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Cette adresse sera utilisée pour la connexion
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Rôles <span className="text-destructive">*</span>
                </Label>
                <div className="border border-border rounded-md p-4 space-y-3 max-h-64 overflow-y-auto">
                  {roles.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Chargement des rôles...
                    </p>
                  ) : (
                    roles.map((role) => (
                      <div key={role.id} className="flex items-start gap-3">
                        <Checkbox
                          id={`role-${role.id}`}
                          checked={rolesSelectionnes.includes(role.id)}
                          onCheckedChange={() => toggleRole(role.id)}
                          disabled={isSubmitting}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`role-${role.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {role.libelle}
                          </label>
                          {role.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {role.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {rolesSelectionnes.length} rôle(s) sélectionné(s)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-end gap-3">
          {compteCree ? (
            <Button
              onClick={handleClose}
              className="rounded-full px-6 bg-[#13850b] hover:bg-[#0f6809]"
            >
              Fermer
            </Button>
          ) : (
            <>
              <Button
                onClick={handleClose}
                variant="outline"
                disabled={isSubmitting}
                className="rounded-full px-6"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreer}
                disabled={isSubmitting || !email || rolesSelectionnes.length === 0}
                className="rounded-full px-6 bg-[#13850b] hover:bg-[#0f6809]"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                )}
                Créer le compte
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
