"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { consommerCodeSecours } from "../connexion/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Etape = "identifiants" | "defi2fa";

// Version de test avec design split-screen inspiré du mockup Figma
// Route : /connexion-test (comparaison avec /connexion)
export default function PageConnexionTest() {
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>("identifiants");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [utiliserCodeSecours, setUtiliserCodeSecours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);

  async function seConnecter(event: FormEvent) {
    event.preventDefault();
    setErreur(null);
    setEnCours(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    });

    if (error) {
      setEnCours(false);
      setErreur("Identifiants incorrects.");
      return;
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setEnCours(false);

    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== aal.nextLevel) {
      const { data: facteurs } = await supabase.auth.mfa.listFactors();
      setFactorId(facteurs?.totp?.[0]?.id ?? null);
      setEtape("defi2fa");
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function validerDefi(event: FormEvent) {
    event.preventDefault();
    setErreur(null);
    setEnCours(true);

    if (utiliserCodeSecours) {
      const resultat = await consommerCodeSecours(code);
      setEnCours(false);
      if (!resultat.ok) {
        setErreur("Code de secours invalide ou déjà utilisé.");
        return;
      }
      router.push("/");
      router.refresh();
      return;
    }

    if (!factorId) return;
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    setEnCours(false);

    if (error) {
      setErreur("Code incorrect. Réessayez.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  // Écran 2FA (conserve le design actuel centré)
  if (etape === "defi2fa") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-teal text-sm font-bold text-white">
            ITA
          </div>
          <div>
            <p className="font-semibold text-foreground">ITA Manager</p>
            <p className="text-xs text-muted-foreground">
              Ingénierie &amp; Travaux SARL
            </p>
          </div>
        </div>

        <form
          onSubmit={validerDefi}
          className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-card p-8 shadow-sm"
        >
          <h1 className="text-xl font-semibold text-foreground">
            Double authentification
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saisissez le code généré par votre application.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="code">
              {utiliserCodeSecours ? "Code de secours" : "Code à 6 chiffres"}
            </Label>
            <Input
              id="code"
              inputMode={utiliserCodeSecours ? "text" : "numeric"}
              autoComplete="one-time-code"
              maxLength={utiliserCodeSecours ? 8 : 6}
              required
              value={code}
              onChange={(e) =>
                setCode(
                  utiliserCodeSecours
                    ? e.target.value.toUpperCase().slice(0, 8)
                    : e.target.value.replace(/\D/g, "").slice(0, 6)
                )
              }
              placeholder={utiliserCodeSecours ? "XXXX-XXXX" : "000000"}
              className={
                utiliserCodeSecours
                  ? "font-mono text-sm uppercase focus-visible:ring-teal"
                  : "text-center font-mono text-xl tracking-[0.5em] focus-visible:ring-teal"
              }
              aria-label={
                utiliserCodeSecours ? "Code de secours" : "Code à six chiffres"
              }
            />
          </div>

          {erreur && (
            <p role="alert" className="statut statut-erreur">
              {erreur}
            </p>
          )}

          <Button
            type="submit"
            disabled={enCours}
            className="bg-teal hover:bg-teal-hover text-white"
          >
            {enCours ? "Vérification…" : "Valider"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setUtiliserCodeSecours((v) => !v);
              setCode("");
              setErreur(null);
            }}
            className="text-center text-sm text-muted-foreground hover:text-teal"
          >
            {utiliserCodeSecours
              ? "Utiliser mon application d'authentification"
              : "J'ai perdu mon appareil — utiliser un code de secours"}
          </button>
        </form>
      </div>
    );
  }

  // Écran login avec design split-screen
  return (
    <div className="flex min-h-screen">
      {/* Côté gauche : Hero image + branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 to-slate-800">
        {/* Image de fond */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?q=80&w=2000')",
          }}
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-slate-800/90" />

        {/* Contenu */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-teal text-sm font-bold text-white shadow-lg">
              ITA
            </div>
            <div>
              <p className="font-semibold text-white">ITA Manager</p>
              <p className="text-xs text-slate-300">
                Ingénierie &amp; Travaux SARL
              </p>
            </div>
          </div>

          {/* Tagline */}
          <div>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Gérez vos projets <br />de construction avec <br />simplicité
            </h1>
            <p className="text-slate-300 text-lg">
              Plateforme intégrée pour le pilotage de vos chantiers et la gestion RH.
            </p>
          </div>

          {/* Footer */}
          <div className="text-xs text-slate-400">
            © 2026 ITA SARL. Tous droits réservés.
          </div>
        </div>
      </div>

      {/* Côté droit : Formulaire */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden mb-8 flex items-center justify-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-teal text-sm font-bold text-white">
              ITA
            </div>
            <div>
              <p className="font-semibold text-foreground">ITA Manager</p>
              <p className="text-xs text-muted-foreground">
                Ingénierie &amp; Travaux SARL
              </p>
            </div>
          </div>

          <form onSubmit={seConnecter} className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Connexion à votre compte
              </h1>
              <p className="text-sm text-muted-foreground">
                Accédez à votre espace de travail
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Adresse e-mail <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="h-11 focus-visible:ring-teal focus-visible:border-teal"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="motDePasse" className="text-sm font-medium">
                  Mot de passe <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="motDePasse"
                    type={afficherMotDePasse ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 pr-10 focus-visible:ring-teal focus-visible:border-teal"
                  />
                  <button
                    type="button"
                    onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={afficherMotDePasse ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {afficherMotDePasse ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="opacity-0 pointer-events-none">
                  {/* Placeholder pour alignement */}
                  Se souvenir
                </div>
                <Link
                  href="/mot-de-passe-oublie"
                  className="text-teal hover:text-teal-hover font-medium"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            {erreur && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive"
              >
                {erreur}
              </div>
            )}

            <Button
              type="submit"
              disabled={enCours}
              className="h-11 bg-teal hover:bg-teal-hover text-white font-medium shadow-sm"
            >
              {enCours ? "Connexion en cours…" : "Se connecter"}
            </Button>
          </form>

          {/* Lien retour vers version originale */}
          <div className="mt-8 text-center">
            <Link
              href="/connexion"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ← Retour à la version originale
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
