import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormulaireDeverrouillePage } from "./formulaire";

export default async function PageVerrouille() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <h1 className="text-2xl font-semibold text-primary">Session verrouillée</h1>
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Saisissez votre mot de passe pour continuer.
        </p>
        <FormulaireDeverrouillePage />
      </div>
    </div>
  );
}
