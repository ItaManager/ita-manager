import { verifierAccesPage } from "@/lib/auth/page-access";
import { ModuleEnDev } from "../_components/module-en-dev";

export default async function ContratsPage() {
  await verifierAccesPage("/contrats");
  return (
    <ModuleEnDev
      moduleNumero="M2"
      moduleNom="Employés"
      titre="Contrats"
    />
  );
}
