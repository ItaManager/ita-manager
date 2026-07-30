import { ModuleEnDev } from "../_components/module-en-dev";
import { verifierAccesPage } from "@/lib/auth/page-access";

export default async function AnnoncesPage() {
  await verifierAccesPage("/annonces");
  return (
    <ModuleEnDev
      moduleNumero="M10"
      moduleNom="Pilotage"
      titre="Annonces"
    />
  );
}
