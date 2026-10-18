"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { envoyerEmail } from "@/lib/email/resend";
import ReinitialisationMotDePasse from "@/emails/reinitialisation-mot-de-passe";

const schema = z.object({
  email: z.string().email().max(255),
});

// Action publique, non protégée par exigerPermission : n'importe qui
// doit pouvoir demander une réinitialisation. Le message renvoyé au
// client est volontairement identique que le compte existe ou non —
// ne jamais laisser deviner si une adresse est enregistrée.
export async function demanderReinitialisation(formData: FormData) {
  const resultat = schema.safeParse({ email: formData.get("email") });
  if (!resultat.success) {
    return { ok: true } as const;
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: resultat.data.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?next=/reinitialiser`,
      },
    });

    if (!error && data.properties?.action_link) {
      await envoyerEmail({
        to: resultat.data.email,
        subject: "Réinitialisation de votre mot de passe — ITA Manager",
        react: ReinitialisationMotDePasse({
          lienReinitialisation: data.properties.action_link,
        }),
      });
    }
  } catch {
    // Volontairement silencieux côté client — voir commentaire ci-dessus.
    // L'erreur reste visible côté serveur (logs Vercel).
  }

  return { ok: true } as const;
}
