import { FormulaireNouveauMotDePasse } from "@/components/formulaire-nouveau-mot-de-passe";
import { BlocIdentite } from "@/components/bloc-identite";

export default function PageReinitialiser() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <BlocIdentite />
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-card p-8">
        <h1 className="text-lg font-semibold text-primary">
          Réinitialiser le mot de passe
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>
        <FormulaireNouveauMotDePasse redirectionApres="/connexion" />
      </div>
    </div>
  );
}
