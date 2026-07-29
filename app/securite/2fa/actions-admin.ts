"use server";

import { prisma } from "@/lib/db/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { actionProtegee } from "@/lib/auth/guard";

// Réinitialisation du second facteur d'un tiers par le Super Admin
// (DECISIONS.md, D-08 « Récupération »). Non listée dans le catalogue
// des 29 permissions (M0-SOCLE.md §5) : gardée sur `admin:parametres`,
// seule permission réservée au seul Super Admin dans la matrice (§6.2 —
// admin:utilisateurs est partagée avec la DRH, ce qui contredirait « le
// Super Admin peut réinitialiser »). Choix à confirmer, pas décidé
// silencieusement.
export const reinitialiserTotpDeTiers = actionProtegee(
  "admin:parametres",
  async (session, profilId: string) => {
    const supabaseAdmin = createAdminClient();
    const { data } = await supabaseAdmin.auth.admin.mfa.listFactors({ userId: profilId });

    for (const facteur of data?.factors ?? []) {
      await supabaseAdmin.auth.admin.mfa.deleteFactor({ id: facteur.id, userId: profilId });
    }

    await prisma.codeSecoursMfa.deleteMany({ where: { profilId } });

    await prisma.journalEvenement.create({
      data: {
        entite: "Profil",
        entiteId: profilId,
        action: "MODIFICATION",
        auteurId: session.userId,
        auteurNom: session.email,
        commentaire:
          "Réinitialisation du second facteur (TOTP) par le Super Admin — affaiblissement temporaire de la sécurité, le titulaire doit reconfigurer TOTP à sa prochaine connexion.",
      },
    });

    return { ok: true } as const;
  },
);
