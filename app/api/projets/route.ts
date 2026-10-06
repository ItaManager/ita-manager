import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const projets = await prisma.projet.findMany({
    select: {
      id: true,
      code: true,
      nom: true,
    },
    orderBy: { code: "desc" },
  });

  return NextResponse.json(projets);
}
