import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * API Route : Vérification du code TOTP et activation de la MFA
 */
export async function POST(request: Request) {
  try {
    const { code, factorId } = await request.json();

    if (!code || !factorId) {
      return NextResponse.json(
        { error: "Code et factorId requis" },
        { status: 400 }
      );
    }

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

    // Vérifier le code TOTP et activer la MFA
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    if (error) {
      console.error("[MFA Verify] Erreur:", error);
      return NextResponse.json(
        { error: "Code incorrect" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      accessToken: data.access_token,
    });
  } catch (error) {
    console.error("[MFA Verify] Exception:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
