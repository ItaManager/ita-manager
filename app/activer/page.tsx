import { FormulaireNouveauMotDePasse } from "@/components/formulaire-nouveau-mot-de-passe";

export default function PageActiver() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <h1 className="text-2xl font-bold text-primary">ITA Manager</h1>
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Bienvenue. Choisissez votre mot de passe pour activer votre compte.
        </p>
        <FormulaireNouveauMotDePasse redirectionApres="/connexion" />
      </div>
    </div>
  );
}
