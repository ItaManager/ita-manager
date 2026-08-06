"use client";

import { useState, useRef, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { consommerCodeSecours } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlocIdentite } from "@/components/bloc-identite";

type Etape = "identifiants" | "defi2fa";

export default function PageConnexion() {
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>("identifiants");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [utiliserCodeSecours, setUtiliserCodeSecours] = useState(false);
  const [codeSecours, setCodeSecours] = useState("");
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
      setErreur("E-mail ou mot de passe incorrect.");
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
      const resultat = await consommerCodeSecours(codeSecours);
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
    const codeComplet = code.join("");
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: codeComplet,
    });
    setEnCours(false);

    if (error) {
      setErreur("Code incorrect. Veuillez réessayer.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  function handleCodeChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(0, 1);
    setCode(newCode);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleCodeKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  if (etape === "defi2fa") {
    if (utiliserCodeSecours) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md space-y-8">
            <BlocIdentite />

            <form
              onSubmit={validerDefi}
              className="rounded-2xl bg-card p-8 shadow-sm border border-border space-y-6"
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-center">Code de secours</h1>
                <p className="text-center text-muted-foreground">
                  Saisissez votre code de secours à 8 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup" className="text-sm font-medium">
                  Code de secours <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="backup"
                  type="text"
                  placeholder="XXXX-XXXX"
                  maxLength={9}
                  value={codeSecours}
                  onChange={(e) =>
                    setCodeSecours(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 9)
                    )
                  }
                  className="h-12 font-mono text-center text-lg tracking-widest"
                />
              </div>

              {erreur && (
                <div className="rounded-lg bg-destructive-soft px-4 py-3 text-sm text-destructive flex items-start gap-2">
                  <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                  {erreur}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base bg-primary"
                disabled={enCours || codeSecours.length < 9}
              >
                {enCours ? "Vérification..." : "Valider"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setUtiliserCodeSecours(false);
                  setCodeSecours("");
                  setErreur(null);
                }}
                className="w-full text-sm text-success hover:underline cursor-pointer"
              >
                Utiliser l'application d'authentification
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              © 2026 ITA Manager par ITA SARL
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8">
          <BlocIdentite />

          <form
            onSubmit={validerDefi}
            className="rounded-2xl bg-card p-8 shadow-sm border border-border space-y-6"
          >
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-center">Vérification</h1>
              <p className="text-center text-muted-foreground">
                Saisissez le code à 6 chiffres de votre application
              </p>
            </div>

            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  className="h-14 w-14 text-center text-xl font-semibold"
                  aria-label={`Chiffre ${index + 1}`}
                />
              ))}
            </div>

            {erreur && (
              <div className="rounded-lg bg-destructive-soft px-4 py-3 text-sm text-destructive flex items-start gap-2">
                <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                {erreur}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base bg-primary"
              disabled={enCours || code.join("").length < 6}
            >
              {enCours ? "Vérification..." : "Valider"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setUtiliserCodeSecours(true);
                setCode(["", "", "", "", "", ""]);
                setErreur(null);
              }}
              className="w-full text-sm text-success hover:underline cursor-pointer"
            >
              Appareil perdu ? Utiliser un code de secours
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            © 2026 ITA Manager par ITA SARL
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <BlocIdentite />

        <form
          onSubmit={seConnecter}
          className="rounded-2xl bg-card p-8 shadow-sm border border-border space-y-6"
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-center">Bienvenue</h1>
            <p className="text-center text-muted-foreground">
              Connectez-vous pour accéder à votre espace de travail
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                E-mail <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Saisissez votre e-mail"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Mot de passe <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={afficherMotDePasse ? "text" : "password"}
                  placeholder="Saisissez votre mot de passe"
                  autoComplete="current-password"
                  required
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setAfficherMotDePasse((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
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
          </div>

          {erreur && (
            <div className="rounded-lg bg-destructive-soft px-4 py-3 text-sm text-destructive flex items-start gap-2">
              <AlertTriangle className="size-4 mt-0.5 shrink-0" />
              {erreur}
            </div>
          )}

          <Button type="submit" className="w-full h-12 text-base bg-primary" disabled={enCours}>
            {enCours ? "Connexion en cours..." : "Se connecter"}
          </Button>

          <Link
            href="/mot-de-passe-oublie"
            className="block text-center text-sm text-success hover:underline cursor-pointer"
          >
            Mot de passe oublié ?
          </Link>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          © 2026 ITA Manager par ITA SARL
        </p>
      </div>
    </div>
  );
}
