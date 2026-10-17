import { listerUtilisateurs, listerRolesDisponibles } from "@/lib/actions/utilisateurs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, MoreHorizontal } from "lucide-react";
import { BoutonModifierRoles } from "./bouton-modifier-roles";
import { BoutonActivation } from "./bouton-activation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <div className="bg-white rounded-xl border border-[#0000001a] p-6">
      {/* En-tête avec recherche et actions */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher par nom ou email..."
              defaultValue={recherche}
              className="pl-9"
            />
          </div>
        </div>
        <Button className="gap-2">
          <UserPlus className="size-4" />
          Inviter un utilisateur
        </Button>
      </div>

      {/* Tableau */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Utilisateur
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Rôles
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Dernière activité
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Statut
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    {recherche
                      ? "Aucun utilisateur ne correspond à votre recherche."
                      : "Aucun utilisateur trouvé."}
                  </td>
                </tr>
              ) : (
                utilisateurs.map((utilisateur) => (
                  <tr
                    key={utilisateur.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    {/* Utilisateur */}
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {utilisateur.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Créé le{" "}
                          {format(new Date(utilisateur.creeLe), "dd/MM/yyyy", {
                            locale: fr,
                          })}
                        </div>
                      </div>
                    </td>

                    {/* Rôles */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {utilisateur.roles.length === 0 ? (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        ) : (
                          utilisateur.roles.map((pr) => (
                            <Badge
                              key={pr.roleId}
                              variant="secondary"
                              className="text-xs"
                            >
                              {pr.role.libelle}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>

                    {/* Dernière activité */}
                    <td className="py-3 px-4 text-sm text-muted-foreground tabular-nums">
                      {utilisateur.derniereConn
                        ? format(
                            new Date(utilisateur.derniereConn),
                            "dd/MM/yyyy",
                            { locale: fr }
                          )
                        : "—"}
                    </td>

                    {/* Statut */}
                    <td className="py-3 px-4">
                      {utilisateur.actif ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inactif
                        </Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0"
                          >
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <BoutonModifierRoles
                            utilisateur={utilisateur}
                            rolesDisponibles={rolesDisponibles}
                          />
                          <BoutonActivation
                            utilisateurId={utilisateur.id}
                            email={utilisateur.email}
                            actif={utilisateur.actif}
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compteur */}
      <div className="mt-4 text-sm text-muted-foreground">
        {utilisateurs.length} utilisateur{utilisateurs.length > 1 ? "s" : ""}
      </div>
    </div>
  );
}
