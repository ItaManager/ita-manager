"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Users, Shield, Trash2 } from "lucide-react";
import { listerRoles, listerPermissions, supprimerRole } from "@/lib/actions/roles";
import { ModalCreerRole } from "./modal-creer-role";
import { ModalModifierPermissions } from "./modal-modifier-permissions";
import { toast } from "sonner";

interface Role {
  id: string;
  code: string;
  libelle: string;
  description: string | null;
  permissions: Array<{
    code: string;
    libelle: string;
    domaine: string;
  }>;
  nbUtilisateurs: number;
}

interface Permission {
  code: string;
  libelle: string;
  domaine: string;
}

export function ListeRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalCreerOuvert, setModalCreerOuvert] = useState(false);
  const [modalModifierOuvert, setModalModifierOuvert] = useState(false);
  const [roleSelectionne, setRoleSelectionne] = useState<Role | null>(null);
  const [isPending, startTransition] = useTransition();

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const [rolesResult, permissionsResult] = await Promise.all([
        listerRoles(),
        listerPermissions(),
      ]);

      if (rolesResult.success && rolesResult.roles) {
        setRoles(rolesResult.roles);
      }

      if (permissionsResult.success && permissionsResult.permissions) {
        setPermissions(permissionsResult.permissions);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Impossible de charger les rôles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const handleModifier = (role: Role) => {
    setRoleSelectionne(role);
    setModalModifierOuvert(true);
  };

  const handleSupprimer = async (role: Role) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${role.libelle}" ?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await supprimerRole(role.id);
        if (result.success) {
          toast.success("Rôle supprimé avec succès");
          await chargerDonnees();
        } else {
          toast.error(result.error || "Erreur lors de la suppression");
        }
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      }
    });
  };

  const getRoleBadgeColor = (code: string) => {
    const rolesSysteme = ["ADMIN", "DG", "DRH", "DFC", "DT"];
    return rolesSysteme.includes(code) ? "bg-primary-soft text-primary border-primary/20" : "bg-muted";
  };

  const grouperParDomaine = (permissions: Permission[]) => {
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.domaine]) {
        acc[perm.domaine] = [];
      }
      acc[perm.domaine].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);

    return grouped;
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Chargement...</div>;
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {roles.length} rôle{roles.length > 1 ? "s" : ""} configuré{roles.length > 1 ? "s" : ""}
          </span>
        </div>
        <Button onClick={() => setModalCreerOuvert(true)} className="gap-2">
          <Plus className="size-4" />
          Créer un rôle
        </Button>
      </div>

      <div className="grid gap-4">
        {roles.map((role) => {
          const permissionsGroupees = grouperParDomaine(role.permissions);
          const estRoleSysteme = ["ADMIN", "DG", "DRH", "RH", "DFC", "DT", "CT", "CC", "CE", "AD"].includes(role.code);

          return (
            <Card key={role.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{role.libelle}</h3>
                      <Badge variant="outline" className={getRoleBadgeColor(role.code)}>
                        {role.code}
                      </Badge>
                      {estRoleSysteme && (
                        <Badge variant="outline" className="text-xs">
                          Système
                        </Badge>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="size-4" />
                      <span>
                        {role.nbUtilisateurs} utilisateur{role.nbUtilisateurs > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleModifier(role)}
                      className="gap-2"
                    >
                      <Edit className="size-4" />
                      Modifier permissions
                    </Button>
                    {!estRoleSysteme && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSupprimer(role)}
                        className="gap-2 text-destructive"
                        disabled={isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(permissionsGroupees).map(([domaine, perms]) => (
                    <div key={domaine}>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
                        {domaine}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {perms.map((perm) => (
                          <Badge
                            key={perm.code}
                            variant="outline"
                            className="text-xs font-normal"
                          >
                            {perm.libelle}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                  {role.permissions.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">
                      Aucune permission assignée
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {roles.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="size-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Aucun rôle configuré</p>
            </CardContent>
          </Card>
        )}
      </div>

      <ModalCreerRole
        ouvert={modalCreerOuvert}
        onFermer={() => setModalCreerOuvert(false)}
        onSuccess={chargerDonnees}
      />

      {roleSelectionne && (
        <ModalModifierPermissions
          ouvert={modalModifierOuvert}
          onFermer={() => {
            setModalModifierOuvert(false);
            setRoleSelectionne(null);
          }}
          role={roleSelectionne}
          permissionsDisponibles={permissions}
          onSuccess={chargerDonnees}
        />
      )}
    </>
  );
}
