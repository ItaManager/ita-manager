import { listerUtilisateurs, listerRolesDisponibles } from "@/lib/actions/utilisateurs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX } from "lucide-react";
import { BoutonModifierRoles } from "./bouton-modifier-roles";
import { BoutonActivation } from "./bouton-activation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ListeUtilisateursProps {
  recherche?: string;
  actifSeulement?: boolean;
}

export async function ListeUtilisateurs({
  recherche,
  actifSeulement = true,
}: ListeUtilisateursProps) {
  const [utilisateurs, rolesDisponibles] = await Promise.all([
    listerUtilisateurs({ recherche, actifSeulement }),
    listerRolesDisponibles(),
  ]);

  return (
    <Card>
      <CardHeader className="border-b">
        <p className="text-sm text-muted-foreground">
          {utilisateurs.length} utilisateur{utilisateurs.length > 1 ? "s" : ""}
        </p>
      </CardHeader>

      {utilisateurs.length === 0 ? (
        <CardContent className="py-12 text-center">
          <Users
            className="mx-auto size-12 text-muted-foreground/40"
            aria-hidden="true"
          />
          <p className="mt-4 text-sm text-muted-foreground">
            Aucun utilisateur trouvé.
          </p>
        </CardContent>
      ) : (
        <CardContent className="p-0">
          <div className="divide-y">
            {utilisateurs.map((utilisateur) => (
              <div
                key={utilisateur.id}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
              >
                {/* Statut visuel */}
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                    utilisateur.actif
                      ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300"
                  }`}
                >
                  {utilisateur.actif ? (
                    <UserCheck className="size-5" aria-hidden="true" />
                  ) : (
                    <UserX className="size-5" aria-hidden="true" />
                  )}
                </div>

                {/* Informations */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">
                      {utilisateur.email}
                    </p>
                    {!utilisateur.actif && (
                      <Badge variant="outline" className="text-xs">
                        Inactif
                      </Badge>
                    )}
                  </div>

                  {/* R-02 : Afficher les rôles attribués, pas 9 bascules */}
                  <div className="flex flex-wrap items-center gap-2">
                    {utilisateur.roles.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        Aucun rôle attribué
                      </span>
                    ) : (
                      <>
                        <span className="text-xs text-muted-foreground">
                          Rôles :
                        </span>
                        {utilisateur.roles.map((pr) => (
                          <Badge key={pr.roleId} variant="secondary">
                            {pr.role.libelle}
                          </Badge>
                        ))}
                      </>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Créé le{" "}
                    {format(new Date(utilisateur.creeLe), "d MMM yyyy", {
                      locale: fr,
                    })}
                    {utilisateur.derniereConn && (
                      <> · Dernière connexion{" "}
                        {format(
                          new Date(utilisateur.derniereConn),
                          "d MMM yyyy 'à' HH:mm",
                          { locale: fr }
                        )}
                      </>
                    )}
                  </p>
                </div>

                {/* Actions : R-02 — bouton "Modifier" au lieu de bascules */}
                <div className="flex items-center gap-2">
                  <BoutonModifierRoles
                    utilisateur={utilisateur}
                    rolesDisponibles={rolesDisponibles}
                  />
                  <BoutonActivation utilisateur={utilisateur} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
