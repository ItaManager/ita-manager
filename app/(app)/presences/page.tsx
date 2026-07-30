import { verifierAccesPage } from "@/lib/auth/page-access";
import { ModuleEnDev } from "../_components/module-en-dev";

export default async function PresencesPage() {
  await verifierAccesPage("/presences");
  return (
    <ModuleEnDev
      moduleNumero="M12"
      moduleNom="Présences bureau"
      titre="Présences bureau"
    />
  );
}
