import { verifierAccesPage } from "@/lib/auth/page-access";
import { Bell } from "lucide-react";
import { ConfigurationAlertes } from "./_components/configuration-alertes";

export const metadata = {
  title: "Alertes Email — ITA Manager",
};

export default async function PageAlertes() {
  await verifierAccesPage("/admin/parametres");

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Bell className="size-6" />
          Alertes Email
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configuration des notifications automatiques par email
        </p>
      </div>

      <ConfigurationAlertes />
    </div>
  );
}
