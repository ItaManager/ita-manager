import { verifierAccesPage } from "@/lib/auth/page-access";
import { ModuleEnDev } from "../_components/module-en-dev";

export default async function PlanningPage() {
  await verifierAccesPage("/planning");
  return (
    <ModuleEnDev
      moduleNumero="M5"
      moduleNom="Projets"
      titre="Planning chantier"
    />
  );
}
