/**
 * API Route — Récupérer le détail d'une demande de ressource
 *
 * GET /api/demandes-ressources/[id]
 *
 * Utilisé par la page client de détail de demande
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const demande = await prisma.demandeRessource.findUnique({
      where: { id },
      include: {
        projet: { select: { code: true, nom: true } },
        lignes: {
          include: {
            materiel: {
              select: { codeIta: true, designation: true },
            },
          },
        },
      },
    });

    if (!demande) {
      return NextResponse.json(
        { error: "Demande introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(demande);
  } catch (error) {
    console.error("Erreur API demande-ressource:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
