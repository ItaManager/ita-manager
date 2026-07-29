import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { exigerTotpSiRolePrivilegie } from "@/lib/auth/mfa-oblige";
import { Button } from "@/components/ui/button";
import { DeconnexionBouton } from "@/components/deconnexion-bouton";

// Placeholder temporaire — vérification du thème (0.1). Remplacé par
// l'écran d'accueil réel en 0.6. La garde d'authentification ci-dessous
// (getUser(), jamais getSession()) est nécessaire dès 0.4 pour que le
// critère de recette « déconnexion → retour à /connexion, retour arrière
// n'expose rien » soit vérifiable : sans elle, cette page resterait
// accessible sans session. Idem pour la contrainte TOTP : tant qu'il n'y
// a pas de vraie mise en page authentifiée (0.6), c'est ici qu'elle
// s'applique — à déplacer dans le layout authentifié à cette étape.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  await exigerTotpSiRolePrivilegie(user.id, supabase);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold text-primary">ITA Manager</h1>
      <Button>Bouton primaire</Button>
      <Button className="bg-attention text-attention-foreground hover:bg-attention-hover">
        Bouton attention
      </Button>
      <span className="statut statut-succes">Statut de test</span>
      <DeconnexionBouton />
    </div>
  );
}
