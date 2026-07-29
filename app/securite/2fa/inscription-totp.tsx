"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { AlertTriangle, Copy, Printer, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { genererCodesSecours } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Etape = "demarrage" | "qr" | "codes";

export function InscriptionTotp() {
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>("demarrage");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codesSecours, setCodesSecours] = useState<string[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function demarrerInscription() {
    setErreur(null);
    setEnCours(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setEnCours(false);

    if (error || !data) {
      setErreur("Impossible de démarrer l'inscription. Réessayez.");
      return;
    }

    setFactorId(data.id);
    setTotpUri(data.totp.uri);
    setSecret(data.totp.secret);
    setEtape("qr");
  }

  async function verifierCode() {
    if (!factorId) return;
    setErreur(null);
    setEnCours(true);

    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });

    if (error) {
      setEnCours(false);
      setErreur("Code incorrect. Réessayez.");
      return;
    }

    const codes = await genererCodesSecours();
    setEnCours(false);
    setCodesSecours(codes);
    setEtape("codes");
  }

  if (etape === "demarrage") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-foreground">
          La double authentification protège votre compte avec un code
          généré par une application comme Google Authenticator, en plus
          de votre mot de passe.
        </p>
        {erreur && (
          <p role="alert" className="statut statut-erreur">
            {erreur}
          </p>
        )}
        <Button onClick={demarrerInscription} disabled={enCours}>
          {enCours ? "Préparation…" : "Activer la double authentification"}
        </Button>
      </div>
    );
  }

  if (etape === "qr") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-foreground">
          Scannez ce code avec votre application d&apos;authentification,
          puis saisissez le code à 6 chiffres généré.
        </p>
        {totpUri && (
          <div className="mx-auto flex size-52 items-center justify-center rounded-lg border-2 border-border bg-card p-3">
            <QRCodeSVG
              value={totpUri}
              size={180}
              level="M"
              aria-label="Code QR de configuration de la double authentification"
            />
          </div>
        )}
        {secret && (
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-xs text-muted-foreground">
              Impossible de scanner ? Saisissez cette clé dans votre application :
            </p>
            <code className="mt-1 block break-all font-mono text-sm text-primary">
              {secret.match(/.{1,4}/g)?.join(" ") || secret}
            </code>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code">Code à 6 chiffres</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="text-center font-mono text-xl tracking-[0.5em]"
            aria-label="Code à six chiffres"
          />
        </div>

        {erreur && (
          <p role="alert" className="statut statut-erreur">
            {erreur}
          </p>
        )}

        <Button onClick={verifierCode} disabled={enCours || code.length !== 6}>
          {enCours ? "Vérification…" : "Vérifier et activer"}
        </Button>
      </div>
    );
  }

  async function copierCodes() {
    const texte = codesSecours.join("\n");
    await navigator.clipboard.writeText(texte);
  }

  function imprimerCodes() {
    const contenu = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ITA Manager — Codes de secours</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
            h1 { color: #1D186C; font-size: 1.5rem; margin-bottom: 0.5rem; }
            p { color: #6B7280; font-size: 0.875rem; margin-bottom: 1.5rem; }
            .codes { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
            code { font-family: monospace; font-size: 1rem; color: #1D186C; }
          </style>
        </head>
        <body>
          <h1>ITA Manager — Codes de secours</h1>
          <p>Conservez ces codes dans un endroit sûr. Chacun ne fonctionne qu'une seule fois.</p>
          <div class="codes">
            ${codesSecours.map((c) => `<code>${c}</code>`).join("")}
          </div>
        </body>
      </html>
    `;
    const fenetre = window.open("", "_blank");
    if (fenetre) {
      fenetre.document.write(contenu);
      fenetre.document.close();
      fenetre.print();
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Alert className="border-warning bg-warning-soft">
        <AlertTriangle className="size-4 text-warning" />
        <AlertTitle className="text-warning">
          Ces codes ne seront plus jamais affichés
        </AlertTitle>
        <AlertDescription className="text-warning">
          Imprimez-les ou notez-les maintenant. Ils sont votre seul recours si
          vous perdez votre téléphone.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-4">
        {codesSecours.map((c) => (
          <code key={c} className="font-mono text-sm text-primary">
            {c}
          </code>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={copierCodes} className="flex-1">
          <Copy className="size-4" />
          Copier
        </Button>
        <Button variant="outline" onClick={imprimerCodes} className="flex-1">
          <Printer className="size-4" />
          Imprimer
        </Button>
      </div>

      <Button onClick={() => router.push("/")} className="w-full bg-success">
        <Check className="size-4" />
        J&apos;ai conservé mes codes, accéder à l&apos;application
      </Button>
    </div>
  );
}
