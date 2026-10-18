"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { demanderReinitialisation } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlocIdentite } from "@/components/bloc-identite";

export default function PageMotDePasseOublie() {
  const [envoye, setEnvoye] = useState(false);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEnCours(true);
    await demanderReinitialisation(new FormData(event.currentTarget));
    setEnCours(false);
    setEnvoye(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <BlocIdentite />

        <div className="rounded-2xl bg-card p-8 shadow-sm border border-border space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-center">Réinitialiser le mot de passe</h1>
            <p className="text-center text-muted-foreground">
              Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation.
            </p>
          </div>

          {envoye ? (
            <div className="space-y-4">
              <p className="text-sm text-center text-foreground">
                Si un compte existe avec cette adresse, un e-mail de réinitialisation a été envoyé.
              </p>
              <Link
                href="/connexion"
                className="block w-full h-12 rounded-lg bg-primary text-primary-foreground text-base font-medium flex items-center justify-center hover:bg-primary/90 cursor-pointer"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={soumettre} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  E-mail enregistré <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Saisissez votre e-mail"
                  required
                  autoComplete="email"
                  className="h-12"
                />
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-primary"
                  disabled={enCours}
                >
                  {enCours ? "Envoi en cours..." : "Envoyer le lien"}
                </Button>

                <Link
                  href="/connexion"
                  className="block w-full h-12 rounded-lg border border-border bg-background text-foreground text-base font-medium flex items-center justify-center hover:bg-muted cursor-pointer"
                >
                  Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          © 2026 ITA Manager par ITA SARL
        </p>
      </div>
    </div>
  );
}
