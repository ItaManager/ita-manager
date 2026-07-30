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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Barre latérale */}
      <BarreLaterale />

      {/* Zone principale */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* En-tête */}
        <EnTete />

        {/* Contenu avec scroll */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
