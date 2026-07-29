"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { demanderReinitialisation } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <h1 className="text-2xl font-bold text-primary">ITA Manager</h1>

      <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-card p-6">
        {envoye ? (
          <p className="text-sm text-foreground">
            Si un compte existe avec cette adresse, un e-mail de
            réinitialisation vient d&apos;être envoyé.
          </p>
        ) : (
          <form onSubmit={soumettre} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <Button type="submit" disabled={enCours}>
              {enCours ? "Envoi…" : "Envoyer le lien de réinitialisation"}
            </Button>
          </form>
        )}

        <Link
          href="/connexion"
          className="text-center text-sm text-muted-foreground hover:text-primary"
        >
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
