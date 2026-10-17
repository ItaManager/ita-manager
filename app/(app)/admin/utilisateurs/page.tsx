import { verifierAccesPage } from "@/lib/auth/page-access";
import { listerUtilisateurs, listerRolesDisponibles } from "@/lib/actions/utilisateurs";
import { listerRoles, listerPermissions } from "@/lib/actions/roles";
import { OngletsAdministration } from "./_components/onglets-administration";

export const metadata = {
  title: "Administration — ITA Manager",
};

export default async function PageUtilisateurs() {
  await verifierAccesPage("/admin/utilisateurs");

  // Charger toutes les données en parallèle
  const [utilisateurs, rolesDisponibles, rolesResult, permissionsResult] = await Promise.all([
    listerUtilisateurs({ actifSeulement: false }),
    listerRolesDisponibles(),
    listerRoles(),
    listerPermissions(),
  ]);

  const roles = rolesResult.success && rolesResult.roles ? rolesResult.roles : [];
  const permissions = permissionsResult.success && permissionsResult.permissions ? permissionsResult.permissions : [];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Administration
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestion des utilisateurs, rôles et permissions
        </p>
      </div>

      <OngletsAdministration
        utilisateursInitiaux={utilisateurs}
        rolesDisponibles={rolesDisponibles}
        rolesInitiaux={roles}
        permissionsInitiales={permissions}
      />
    </div>
  );
}
