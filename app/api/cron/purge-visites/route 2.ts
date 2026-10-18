import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * M16 L1.7 — Purge automatique des visites de plus de 3 mois
 *
 * Tâche quotidienne (cron: 0 2 * * *)
 * Déclenche la même logique que le bouton manuel
 */
export async function GET(request: Request) {
  // Vérifier l'autorisation Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const il3Mois = new Date();
    il3Mois.setMonth(il3Mois.getMonth() - 3);

    const result = await prisma.visite.deleteMany({
      where: {
        arriveeLe: {
          lt: il3Mois,
        },
      },
    });

    // Audit (SYSTEM user)
    await prisma.journalEvenement.create({
      data: {
        entite: "Visite",
        entiteId: "PURGE_CRON",
        action: "SUPPRESSION",
        auteurId: "00000000-0000-0000-0000-000000000000", // UUID système
        auteurNom: "SYSTEM",
        details: {
          nombreSuppressions: result.count,
          dateMaximale: il3Mois.toISOString(),
        },
        commentaire: `Purge automatique quotidienne: ${result.count} visites supprimées`,
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Purge réussie: ${result.count} visites supprimées`,
    });
  } catch (error: any) {
    console.error("Erreur purge visites:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la purge" },
      { status: 500 }
    );
  }
}
