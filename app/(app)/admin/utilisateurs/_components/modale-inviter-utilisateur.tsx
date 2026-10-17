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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { inviterUtilisateur } from "@/lib/actions/utilisateurs";
import { Checkbox } from "@/components/ui/checkbox";

interface EmployeSansCompte {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  poste?: {
    libelle: string;
    service: {
      libelle: string;
    };
  } | null;
}

interface ModaleInviterUtilisateurProps {
  ouvert: boolean;
  onFermer: () => void;
  employesSansCompte: EmployeSansCompte[];
  rolesDisponibles: Array<{ id: string; libelle: string; description: string | null }>;
}

export function ModaleInviterUtilisateur({
  ouvert,
  onFermer,
  employesSansCompte,
  rolesDisponibles,
}: ModaleInviterUtilisateurProps) {
  const router = useRouter();
  const [etape, setEtape] = useState<1 | 2>(1);
  const [rechercheEmploye, setRechercheEmploye] = useState("");
  const [employeSelectionne, setEmployeSelectionne] = useState<EmployeSansCompte | null>(null);
  const [email, setEmail] = useState("");
  const [rolesSelectionnes, setRolesSelectionnes] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Réinitialiser au moment de fermer
      setEtape(1);
      setRechercheEmploye("");
      setEmployeSelectionne(null);
      setEmail("");
      setRolesSelectionnes([]);
      setErreur(null);
      onFermer();
    }
  };

  const handleSelectionnerEmploye = (employe: EmployeSansCompte) => {
    setEmployeSelectionne(employe);
    // Pré-remplir l'email avec prénom.nom@ita.ci
    const emailSuggere = `${employe.prenom.toLowerCase()}.${employe.nom.toLowerCase()}@ita.ci`;
    setEmail(emailSuggere);
    setEtape(2);
  };

  const handleRetour = () => {
    setEtape(1);
    setEmployeSelectionne(null);
    setEmail("");
    setRolesSelectionnes([]);
    setErreur(null);
  };

  const handleSubmit = async () => {
    setErreur(null);

    if (!employeSelectionne) {
      setErreur("Veuillez sélectionner un employé");
      return;
    }

    if (!email || !email.includes("@")) {
      setErreur("Veuillez saisir une adresse email valide");
      return;
    }

    if (rolesSelectionnes.length === 0) {
      setErreur("Veuillez sélectionner au moins un rôle");
      return;
    }

    startTransition(async () => {
      try {
        await inviterUtilisateur({
          employeId: employeSelectionne.id,
          email,
          rolesIds: rolesSelectionnes,
        });

        handleOpenChange(false);
        router.refresh();
      } catch (error) {
        setErreur(
          error instanceof Error ? error.message : "Une erreur est survenue"
        );
      }
    });
  };

  const toggleRole = (roleId: string) => {
    setRolesSelectionnes((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  // Filtrer les employés selon la recherche
  const employesFiltres = employesSansCompte.filter((employe) => {
    if (!rechercheEmploye) return true;
    const termeRecherche = rechercheEmploye.toLowerCase();
    return (
      employe.matricule.toLowerCase().includes(termeRecherche) ||
      employe.nom.toLowerCase().includes(termeRecherche) ||
      employe.prenom.toLowerCase().includes(termeRecherche)
    );
  });

  return (
    <Dialog open={ouvert} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:!max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {etape === 1 ? "Sélectionner un employé" : "Créer le compte utilisateur"}
          </DialogTitle>
          <DialogDescription>
            {etape === 1
              ? "Choisissez l'employé à qui vous souhaitez donner accès à la plateforme"
              : `${employeSelectionne?.prenom} ${employeSelectionne?.nom} · ${employeSelectionne?.matricule}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {erreur && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertDescription>{erreur}</AlertDescription>
            </Alert>
          )}

          {/* Étape 1 : Sélection de l'employé */}
          {etape === 1 && (
            <div className="space-y-4">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher par matricule ou nom..."
                  value={rechercheEmploye}
                  onChange={(e) => setRechercheEmploye(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Liste des employés */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto border rounded-lg p-2">
                {employesFiltres.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {rechercheEmploye
                      ? "Aucun employé ne correspond à votre recherche"
                      : "Tous les employés ont déjà un compte utilisateur"}
                  </p>
                ) : (
                  employesFiltres.map((employe) => (
                    <button
                      key={employe.id}
                      onClick={() => handleSelectionnerEmploye(employe)}
                      className="w-full text-left p-3 rounded-lg border transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">
                            {employe.prenom} {employe.nom}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {employe.matricule}
                            {employe.poste && (
                              <>
                                {" · "}
                                {employe.poste.libelle} · {employe.poste.service.libelle}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Étape 2 : Email et rôles */}
          {etape === 2 && (
            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email professionnelle</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="prenom.nom@ita.ci"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Cette adresse sera utilisée pour la connexion à la plateforme
                </p>
              </div>

              {/* Rôles */}
              <div className="space-y-3">
                <Label>Rôles et permissions</Label>
                <p className="text-sm text-muted-foreground">
                  Sélectionnez les rôles à attribuer à cet utilisateur.
                </p>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
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
          )}
        </div>

        <DialogFooter>
          {etape === 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Annuler
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleRetour}
                disabled={isPending}
              >
                Retour
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending && (
                  <Loader2
                    className="mr-2 size-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                Créer le compte
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
