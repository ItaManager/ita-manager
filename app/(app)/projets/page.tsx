import { verifierAccesPage } from "@/lib/auth/page-access";
import { ModuleEnDev } from "../_components/module-en-dev";

export default async function ProjetsPage() {
  await verifierAccesPage("/projets");
  return (
    <ModuleEnDev
      moduleNumero="M5"
      moduleNom="Projets"
      titre="Projets"
    />
  );
}
