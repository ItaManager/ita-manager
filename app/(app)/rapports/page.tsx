import { ModuleEnDev } from "../_components/module-en-dev";
import { verifierAccesPage } from "@/lib/auth/page-access";

export default async function RapportsPage() {
  await verifierAccesPage("/rapports");
  return (
    <ModuleEnDev
      moduleNumero="M10"
      moduleNom="Pilotage"
      titre="Rapports"
    />
  );
}
