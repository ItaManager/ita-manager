import { verifierAccesPage } from "@/lib/auth/page-access";
import { ModuleEnDev } from "../_components/module-en-dev";

export default async function DocumentsPage() {
  await verifierAccesPage("/documents");
  return (
    <ModuleEnDev
      moduleNumero="M2"
      moduleNom="Employés"
      titre="Documents"
    />
  );
}
