import { verifierAccesPage } from "@/lib/auth/page-access";
import { ModuleEnDev } from "../_components/module-en-dev";

export default async function RessourcesPage() {
  await verifierAccesPage("/ressources");
  return (
    <ModuleEnDev
      moduleNumero="M8"
      moduleNom="Ressources"
      titre="Ressources"
    />
  );
}
