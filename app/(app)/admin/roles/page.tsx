import { redirect } from "next/navigation";
import { verifierAccesPage } from "@/lib/auth/page-access";

export const metadata = {
  title: "Gestion des rôles — ITA Manager",
};

export default async function RolesPage() {
  await verifierAccesPage("/admin/roles");

  // Redirection vers la page d'administration unifiée
  redirect("/admin/utilisateurs");
}
