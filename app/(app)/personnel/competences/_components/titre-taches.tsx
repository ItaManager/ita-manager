import { obtenirTachesCompetences } from "@/lib/actions/competences";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export async function TitreTaches() {
  const result = await obtenirTachesCompetences();
  const count = result.success ? result.data.length : 0;

  // Get user's name
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let prenom = "";
  if (user) {
    const profil = await prisma.profil.findUnique({
      where: { id: user.id },
      include: { employe: true },
    });

    // Si lié à un employé, utiliser le prénom de l'employé
    if (profil?.employe?.prenom) {
      prenom = profil.employe.prenom;
    } else if (profil?.email) {
      // Fallback : extraire le prénom de l'email (pour comptes techniques)
      // Ex: armelgnakpa7@gmail.com → Armel Gnakpa
      const emailPrefix = profil.email.split("@")[0];
      const cleanName = emailPrefix.replace(/\d+/g, ""); // Retirer les chiffres

      // Essayer de détecter prénom/nom (détection basique)
      // Si le nom fait plus de 8 caractères, essayer de le couper
      if (cleanName.length > 8) {
        // Chercher une majuscule au milieu qui indiquerait un nom (ex: ArmelGnakpa)
        const splitAtCaps = cleanName.match(/[A-Z][a-z]+/g);
        if (splitAtCaps && splitAtCaps.length > 1) {
          prenom = splitAtCaps.join(" ");
        } else {
          // Sinon, prendre les 5 premiers caractères comme prénom
          prenom = cleanName.charAt(0).toUpperCase() + cleanName.slice(1, 5).toLowerCase();
        }
      } else {
        prenom = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      }
    }
  }

  return (
    <h2 className="text-lg font-semibold text-[#18181a]">
      Bonjour {prenom}, vous avez {count} {count <= 1 ? "tâche" : "tâches"} en attente
    </h2>
  );
}
