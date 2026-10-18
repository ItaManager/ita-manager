import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

/**
 * API Route : Génération du QR code TOTP pour l'enrollment MFA
 * Retourne aussi les codes de secours en clair (affichés une seule fois)
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Générer le facteur TOTP
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "ITA Manager",
    });

    if (error) {
      console.error("[MFA Enroll] Erreur:", error);
      return NextResponse.json(
        { error: "Erreur lors de la génération du QR code" },
        { status: 500 }
      );
    }

    // Récupérer les codes de secours stockés pour cet utilisateur
    // Les codes sont hashés en base, on doit les regénérer maintenant
    // car c'est la seule fois où ils seront affichés
    const { genererCodesSecours } = await import("@/lib/auth/mfa");
    const codesSecours = await genererCodesSecours();

    // Hasher et stocker les nouveaux codes (remplacer les anciens)
    const bcrypt = await import("bcrypt");

    // Supprimer les anciens codes
    await prisma.codeSecoursMfa.deleteMany({
      where: { profilId: user.id },
    });

    // Créer les nouveaux codes hashés
    await prisma.codeSecoursMfa.createMany({
      data: await Promise.all(
        codesSecours.map(async (code) => ({
          profilId: user.id,
          codeHache: await bcrypt.hash(code, 10),
        }))
      ),
    });

    // Retourner le QR code, le secret ET les codes de secours en clair
    return NextResponse.json({
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      factorId: data.id,
      backupCodes: codesSecours, // ⚠️ Affichés UNE SEULE FOIS
    });
  } catch (error) {
    console.error("[MFA Enroll] Exception:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
