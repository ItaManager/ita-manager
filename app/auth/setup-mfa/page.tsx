import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConfigurationMFA } from "./_components/configuration-mfa";

export default async function SetupMFAPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si pas connecté, rediriger vers connexion
  if (!user) {
    redirect("/connexion");
  }

  // Vérifier si la MFA est déjà configurée
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasTOTP = factors?.totp && factors.totp.length > 0;

  // Si MFA déjà configurée, rediriger vers tableau de bord
  if (hasTOTP) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl border border-border shadow-lg p-8">
          {/* En-tête */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/10 mb-4">
              <svg
                className="size-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              Configuration de l'authentification
            </h1>
          </div>

          <ConfigurationMFA userId={user.id} />
        </div>
      </div>
    </div>
  );
}
