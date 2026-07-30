import { verifierAccesPage } from "@/lib/auth/page-access";
import { ModuleEnDev } from "../_components/module-en-dev";

export default async function AppelsOffresPage() {
  await verifierAccesPage("/appels-offres");
  return (
    <ModuleEnDev
      moduleNumero="M9"
      moduleNom="Appels d'offres"
      titre="Appels d'offres"
    />
  );
}
