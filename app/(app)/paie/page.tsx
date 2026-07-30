import { ModuleEnDev } from "../_components/module-en-dev";
import { verifierAccesPage } from "@/lib/auth/page-access";

export default async function PaiePage() {
  await verifierAccesPage("/paie");

  return (
    <ModuleEnDev
      moduleNumero="M4"
      moduleNom="Rémunération"
      titre="Paie & Rémunération"
    />
  );
}
