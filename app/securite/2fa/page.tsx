import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InscriptionTotp } from "./inscription-totp";
import { BlocIdentite } from "@/components/bloc-identite";

export default async function PageSecurite2fa() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: facteurs } = await supabase.auth.mfa.listFactors();
  const dejaActif = (facteurs?.totp?.length ?? 0) > 0;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <BlocIdentite />
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-card p-8">
        <h1 className="text-lg font-semibold text-primary">
          Double authentification
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Renforcez la sécurité de votre compte.
        </p>
        {dejaActif ? (
          <p className="text-sm text-foreground">
            La double authentification est déjà activée sur ce compte.
          </p>
        ) : (
          <InscriptionTotp />
        )}
      </div>
    </div>
  );
}
