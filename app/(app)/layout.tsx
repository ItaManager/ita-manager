import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BarreLaterale } from "./_components/barre-laterale";
import { EnTete } from "./_components/en-tete";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Contrôle d'accès : redirection si non authentifié
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Barre latérale fixe */}
      <BarreLaterale />

      {/* Zone principale avec marge pour sidebar */}
      <main className="ml-64 flex-1">
        {/* En-tête */}
        <EnTete />

        {/* Contenu avec scroll */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
