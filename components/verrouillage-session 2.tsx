"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { verifierMotDePassePourDeverrouillage } from "@/lib/auth/deverrouillage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const VINGT_MINUTES_MS = 20 * 60 * 1000;
const HUIT_HEURES_MS = 8 * 60 * 60 * 1000;

const CLE_DEBUT_SESSION = "ita:session:debut";
const CLE_DERNIERE_ACTIVITE = "ita:session:derniereActivite";
const CANAL = "ita:verrouillage";

// Overlay plein écran monté dans le layout racine, jamais une vraie
// navigation — pour ne rien démonter et ne pas perdre un formulaire en
// cours (M0-SOCLE.md §7). Les horodatages sont en localStorage (pas
// seulement en mémoire) : un rechargement de page ne doit pas remettre
// le minuteur d'inactivité à zéro, sinon un simple F5 contournerait le
// verrouillage après 20 minutes d'absence.
export function VerrouillageSession() {
  const router = useRouter();
  const [verrouille, setVerrouille] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CLE_DEBUT_SESSION)) {
      localStorage.setItem(CLE_DEBUT_SESSION, String(Date.now()));
    }

    // queueMicrotask, pas un appel direct : une resynchronisation depuis
    // le localStorage au montage (rechargement à froid) n'est pas un
    // rendu à éviter, mais eslint(react-hooks/set-state-in-effect)
    // n'autorise setState que hors du corps synchrone de l'effet.
    queueMicrotask(() => {
      const derniereActiviteInitiale = Number(
        localStorage.getItem(CLE_DERNIERE_ACTIVITE) ?? Date.now(),
      );
      if (Date.now() - derniereActiviteInitiale > VINGT_MINUTES_MS) {
        setVerrouille(true);
      }
    });

    const canal = new BroadcastChannel(CANAL);
    canal.onmessage = (event) => {
      if (event.data === "verrouiller") setVerrouille(true);
      if (event.data === "deverrouiller") setVerrouille(false);
    };

    function enregistrerActivite() {
      localStorage.setItem(CLE_DERNIERE_ACTIVITE, String(Date.now()));
    }
    enregistrerActivite();
    const evenements = ["mousedown", "keydown", "scroll", "touchstart"] as const;
    evenements.forEach((e) => window.addEventListener(e, enregistrerActivite));

    const intervalle = setInterval(async () => {
      const maintenant = Date.now();
      const debutSession = Number(localStorage.getItem(CLE_DEBUT_SESSION) ?? maintenant);
      const derniereActivite = Number(
        localStorage.getItem(CLE_DERNIERE_ACTIVITE) ?? maintenant,
      );

      if (maintenant - debutSession > HUIT_HEURES_MS) {
        const supabase = createClient();
        await supabase.auth.signOut();
        localStorage.removeItem(CLE_DEBUT_SESSION);
        localStorage.removeItem(CLE_DERNIERE_ACTIVITE);
        router.push("/connexion");
        return;
      }

      if (maintenant - derniereActivite > VINGT_MINUTES_MS) {
        setVerrouille((dejaVerrouille) => {
          if (!dejaVerrouille) canal.postMessage("verrouiller");
          return true;
        });
      }
    }, 1000);

    return () => {
      evenements.forEach((e) => window.removeEventListener(e, enregistrerActivite));
      clearInterval(intervalle);
      canal.close();
    };
  }, [router]);

  if (!verrouille) return null;

  return (
    <SuperpositionVerrouillage
      onDeverrouille={() => {
        localStorage.setItem(CLE_DERNIERE_ACTIVITE, String(Date.now()));
        setVerrouille(false);
        new BroadcastChannel(CANAL).postMessage("deverrouiller");
      }}
    />
  );
}

function SuperpositionVerrouillage({ onDeverrouille }: { onDeverrouille: () => void }) {
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function deverrouiller(event: FormEvent) {
    event.preventDefault();
    setErreur(null);
    setEnCours(true);

    const resultat = await verifierMotDePassePourDeverrouillage(motDePasse);
    setEnCours(false);

    if (!resultat.ok) {
      setErreur("Mot de passe incorrect.");
      return;
    }

    setMotDePasse("");
    onDeverrouille();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <form
        onSubmit={deverrouiller}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-card p-6"
      >
        <h2 className="text-lg font-semibold text-primary">Session verrouillée</h2>
        <p className="text-sm text-muted-foreground">
          Saisissez votre mot de passe pour continuer. Votre travail en
          cours n&apos;a pas été perdu.
        </p>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="motDePasseVerrouillage">Mot de passe</Label>
          <Input
            id="motDePasseVerrouillage"
            type="password"
            autoComplete="current-password"
            autoFocus
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
    </div>
  );
}
