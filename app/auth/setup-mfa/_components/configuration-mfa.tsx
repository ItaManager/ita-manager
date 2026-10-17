"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";

interface ConfigurationMFAProps {
  userId: string;
}

type Etape = "qr" | "verification" | "succes";

export function ConfigurationMFA({ userId }: ConfigurationMFAProps) {
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>("qr");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Générer le QR code TOTP
  const genererQRCode = async () => {
    setChargement(true);
    setErreur(null);

    try {
      const response = await fetch("/api/auth/mfa/enroll", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la génération du QR code");
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
    } catch (error) {
      setErreur(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue"
      );
    } finally {
      setChargement(false);
    }
  };

  // Vérifier le code TOTP et activer la MFA
  const verifierCode = async () => {
    if (code.length !== 6) {
      setErreur("Le code doit contenir 6 chiffres");
      return;
    }

    setChargement(true);
    setErreur(null);

    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, factorId: secret }),
      });

      if (!response.ok) {
        throw new Error("Code incorrect. Veuillez réessayer.");
      }

      setEtape("succes");

      // Rediriger vers le tableau de bord après 2 secondes
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    } catch (error) {
      setErreur(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue"
      );
    } finally {
      setChargement(false);
    }
  };

  // Étape 1 : Affichage du QR code
  if (etape === "qr") {
    return (
      <div className="space-y-6">
        {!qrCode ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <p className="text-sm text-foreground font-medium">
                Étape 1 : Installer une application d'authentification
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Vous aurez besoin d'une application comme <strong>Google Authenticator</strong>,{" "}
                <strong>Microsoft Authenticator</strong> ou <strong>Authy</strong> sur votre téléphone.
              </p>
            </div>

            <Button
              onClick={genererQRCode}
              disabled={chargement}
              className="w-full"
            >
              {chargement ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                "Générer le QR code"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-foreground font-medium">
                Étape 2 : Scannez ce QR code avec votre application
              </p>
              <div className="flex justify-center p-4 bg-white rounded-lg border border-border">
                {qrCode && (
                  <Image
                    src={qrCode}
                    alt="QR Code TOTP"
                    width={200}
                    height={200}
                  />
                )}
              </div>

              {secret && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Impossible de scanner ? Saisir manuellement
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="font-mono text-xs break-all text-foreground">
                      {secret}
                    </p>
                  </div>
                </details>
              )}
            </div>

            <Button
              onClick={() => setEtape("verification")}
              className="w-full"
            >
              Continuer
            </Button>
          </div>
        )}

        {erreur && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{erreur}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Étape 2 : Vérification du code
  if (etape === "verification") {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">
              Étape 3 : Entrez le code à 6 chiffres de votre application
            </Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="text-center text-lg tracking-widest tabular-nums"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Le code change toutes les 30 secondes
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEtape("qr")}
              className="flex-1"
            >
              Retour
            </Button>
            <Button
              onClick={verifierCode}
              disabled={chargement || code.length !== 6}
              className="flex-1"
            >
              {chargement ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                "Vérifier"
              )}
            </Button>
          </div>
        </div>

        {erreur && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{erreur}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Étape 3 : Succès
  return (
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center size-16 rounded-full bg-green-100 mb-2">
        <Check className="size-8 text-green-600" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Configuration réussie !
        </h2>
        <p className="text-sm text-muted-foreground">
          Votre authentification à deux facteurs est maintenant active.
          <br />
          Redirection en cours...
        </p>
      </div>
    </div>
  );
}
