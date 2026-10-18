"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// Déconnexion via le client Supabase directement, pas une Server Action
// (M0-SOCLE.md §6).
export function DeconnexionBouton() {
  const router = useRouter();

  async function seDeconnecter() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/connexion");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={seDeconnecter}>
      Se déconnecter
    </Button>
  );
}
