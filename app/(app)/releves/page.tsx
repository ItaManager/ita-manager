import { verifierAccesPage } from "@/lib/auth/page-access";
import { ModuleEnDev } from "../_components/module-en-dev";

export default async function RelevesPage() {
  await verifierAccesPage("/releves");
  return (
    <ModuleEnDev
      moduleNumero="M6"
      moduleNom="Relevés d'activité"
      titre="Relevés d'activité"
    />
  );
}
