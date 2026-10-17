import { prisma } from "@/lib/db/prisma";
import { Users, UserCheck, Shield, Activity } from "lucide-react";

export async function IndicateursUtilisateurs() {
  const [totalUtilisateurs, utilisateursActifs, totalRoles, derniereActivite] = await Promise.all([
    prisma.profil.count(),
    prisma.profil.count({ where: { actif: true } }),
    prisma.role.count({ where: { systeme: false } }),
    prisma.profil.findFirst({
      where: { derniereConn: { not: null } },
      orderBy: { derniereConn: "desc" },
      select: { derniereConn: true },
    }),
  ]);

  const indicateurs = [
    {
      label: "Total utilisateurs",
      valeur: totalUtilisateurs,
      icon: Users,
      couleur: "text-[#1D186C]",
    },
    {
      label: "Comptes actifs",
      valeur: utilisateursActifs,
      icon: UserCheck,
      couleur: "text-green-600",
    },
    {
      label: "Rôles personnalisés",
      valeur: totalRoles,
      icon: Shield,
      couleur: "text-[#1D186C]",
    },
    {
      label: "Dernière connexion",
      valeur: derniereActivite?.derniereConn
        ? new Intl.RelativeTimeFormat("fr", { numeric: "auto" }).format(
            Math.round((derniereActivite.derniereConn.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            "day"
          )
        : "Aucune",
      icon: Activity,
      couleur: "text-muted-foreground",
      isText: true,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {indicateurs.map((ind, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl border border-[#0000001a] p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {ind.label}
            </span>
            <ind.icon className={`size-5 ${ind.couleur}`} aria-hidden="true" />
          </div>
          <div className={`text-2xl font-semibold ${ind.couleur}`}>
            {ind.isText ? ind.valeur : ind.valeur.toLocaleString("fr-FR")}
          </div>
        </div>
      ))}
    </div>
  );
}
