"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { consommerCodeSecours } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Etape = "identifiants" | "defi2fa";

// Connexion via le client Supabase directement, pas une Server Action
// (M0-SOCLE.md §6). Message d'erreur volontairement générique — ne
// jamais indiquer si c'est l'e-mail ou le mot de passe qui est erroné.
//
// Après un mot de passe valide, la session est à aal1. Si un facteur
// TOTP est enrôlé, le niveau suivant (nextLevel) est aal2 : un second
// écran, dans la même page, demande le code — jamais une session aal2
// fabriquée sans passage réel par Supabase.
export default function PageConnexion() {
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>("identifiants");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [utiliserCodeSecours, setUtiliserCodeSecours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

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
      setErreur("Identifiants incorrects. Vérifiez votre e-mail et votre mot de passe.");
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
      // Le facteur TOTP a été supprimé : la contrainte de rôle privilégié
      // (app/page.tsx) relance l'inscription complète.
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

  if (etape === "defi2fa") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
        <h1 className="text-2xl font-bold text-primary">ITA Manager</h1>
        <form
          onSubmit={validerDefi}
          className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-card p-6"
        >
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
                  ? "font-mono text-sm uppercase"
                  : "text-center font-mono text-xl tracking-[0.5em]"
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

          <Button type="submit" disabled={enCours}>
            {enCours ? "Vérification…" : "Valider"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setUtiliserCodeSecours((v) => !v);
              setCode("");
              setErreur(null);
            }}
            className="text-center text-sm text-muted-foreground hover:text-primary"
          >
            {utiliserCodeSecours
              ? "Utiliser mon application d'authentification"
              : "J'ai perdu mon appareil — utiliser un code de secours"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <h1 className="text-2xl font-bold text-primary">ITA Manager</h1>

      <form
        onSubmit={seConnecter}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-card p-6"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="motDePasse">Mot de passe</Label>
          <Input
            id="motDePasse"
            type="password"
            autoComplete="current-password"
            required
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
        </div>

        {erreur && (
          <p role="alert" className="statut statut-erreur">
            {erreur}
          </p>
        )}

        <Button type="submit" disabled={enCours}>
          {enCours ? "Connexion…" : "Se connecter"}
        </Button>

        <Link
          href="/mot-de-passe-oublie"
          className="text-center text-sm text-muted-foreground hover:text-primary"
        >
          Mot de passe oublié ?
        </Link>
      </form>
    </div>
  );
}
