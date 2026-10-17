import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * API Route : Génération du QR code TOTP pour l'enrollment MFA
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

    // Retourner le QR code et le secret
    return NextResponse.json({
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      factorId: data.id,
    });
  } catch (error) {
    console.error("[MFA Enroll] Exception:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
