"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
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
  const [voirMdp, setVoirMdp] = useState(false);
  const [voirConf, setVoirConf] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  // Calcul de la robustesse : 0 à 4
  const calculerForce = (m: string) => {
    let n = 0;
    if (m.length >= 12) n++;
    if (/[A-Z]/.test(m) && /[a-z]/.test(m)) n++;
    if (/[0-9]/.test(m)) n++;
    if (/[^A-Za-z0-9]/.test(m)) n++;
    return n;
  };

  const force = calculerForce(motDePasse);
  const messageForce = () => {
    if (motDePasse.length === 0) return "";
    if (motDePasse.length < 12)
      return `${12 - motDePasse.length} caractères manquants`;
    if (force >= 3) return "Mot de passe robuste";
    return "Ajoutez des majuscules, chiffres ou symboles";
  };

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
        <div className="relative">
          <Input
            id="motDePasse"
            type={voirMdp ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={12}
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setVoirMdp((v) => !v)}
            className="absolute right-3 top-2.5 text-muted-foreground"
            aria-label={voirMdp ? "Masquer" : "Afficher"}
          >
            {voirMdp ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        {motDePasse && (
          <div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className="h-1 flex-1 rounded-full"
                  style={{
                    background:
                      n <= force
                        ? force >= 3
                          ? "var(--success)"
                          : "var(--warning)"
                        : "var(--border)",
                  }}
                />
              ))}
            </div>
            <p
              className="mt-1.5 text-xs"
              style={{
                color: force >= 3 ? "var(--success)" : "var(--warning)",
              }}
            >
              {messageForce()}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
        <div className="relative">
          <Input
            id="confirmation"
            type={voirConf ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={12}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className="pr-10"
            style={
              confirmation && motDePasse !== confirmation
                ? { borderColor: "var(--destructive)" }
                : undefined
            }
          />
          <button
            type="button"
            onClick={() => setVoirConf((v) => !v)}
            className="absolute right-3 top-2.5 text-muted-foreground"
            aria-label={voirConf ? "Masquer" : "Afficher"}
          >
            {voirConf ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {confirmation && motDePasse !== confirmation && (
          <p className="text-xs text-destructive">
            Les deux saisies diffèrent.
          </p>
        )}
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
