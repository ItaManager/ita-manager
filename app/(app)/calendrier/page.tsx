import { ModuleEnDev } from "../_components/module-en-dev";
import { verifierAccesPage } from "@/lib/auth/page-access";

export default async function CalendrierPage() {
  await verifierAccesPage("/calendrier");
  return (
    <ModuleEnDev
      moduleNumero="M10"
      moduleNom="Pilotage"
      titre="Calendrier RH"
    />
  );
}
