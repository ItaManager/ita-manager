"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Formulaire partagé entre /reinitialiser et /activer — dans les deux
// cas, une session de récupération temporaire existe déjà (établie par
// app/auth/confirm), il ne reste qu'à définir le mot de passe.
// updateUser() se fait côté client, comme signIn/signOut (M0-SOCLE.md
// §6) — pas une Server Action.
export function FormulaireNouveauMotDePasse({ redirectionApres }: { redirectionApres: string }) {
  const router = useRouter();
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(event: FormEvent) {
    event.preventDefault();
    setErreur(null);

    if (motDePasse.length < 12) {
      setErreur("Le mot de passe doit contenir au moins 12 caractères.");
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setEnCours(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: motDePasse });
    // Ne pas laisser une session de récupération devenir une session
    // normale par simple continuité : on force une nouvelle connexion
    // explicite avec le mot de passe qui vient d'être choisi.
    await supabase.auth.signOut();
    setEnCours(false);

    if (error) {
      setErreur("Ce lien n'est plus valide. Demandez-en un nouveau.");
      return;
    }

    router.push(redirectionApres);
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="motDePasse">Nouveau mot de passe</Label>
        <Input
          id="motDePasse"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
        <Input
          id="confirmation"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
      </div>

      {erreur && (
        <p role="alert" className="statut statut-erreur">
          {erreur}
        </p>
      )}

      <Button type="submit" disabled={enCours}>
        {enCours ? "Enregistrement…" : "Valider le mot de passe"}
      </Button>
    </form>
  );
}
