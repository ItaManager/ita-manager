"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { verifierMotDePassePourDeverrouillage } from "@/lib/auth/deverrouillage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Secours SSR pour un rechargement à froid pendant que verrouillé — le
// mécanisme normal est l'overlay client (components/verrouillage-session),
// pas une navigation vers cette page.
export function FormulaireDeverrouillePage() {
  const router = useRouter();
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(event: FormEvent) {
    event.preventDefault();
    setErreur(null);
    setEnCours(true);

    const resultat = await verifierMotDePassePourDeverrouillage(motDePasse);
    setEnCours(false);

    if (!resultat.ok) {
      setErreur("Mot de passe incorrect.");
      return;
    }

    router.push("/");
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-4">
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
        {enCours ? "Vérification…" : "Déverrouiller"}
      </Button>
    </form>
  );
}
