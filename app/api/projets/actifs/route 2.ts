import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/projets/actifs
 * Retourne les projets en cours pour la sélection dans l'ouverture de période
 */
export async function GET() {
  try {
    // Vérifier l'authentification
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Charger les projets actifs
    const projets = await prisma.projet.findMany({
      where: {
        statut: {
          in: ["EN_COURS", "OUVERT"],
        },
      },
      select: {
        id: true,
        code: true,
        nom: true,
      },
      orderBy: {
        code: "desc",
      },
      take: 100,
    });

    return NextResponse.json(projets);
  } catch (error) {
    console.error("Erreur chargement projets actifs:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
