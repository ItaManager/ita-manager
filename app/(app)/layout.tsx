import Link from "next/link";
import { Building2, Briefcase, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Barre de navigation temporaire M1 */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container mx-auto flex h-14 items-center gap-4 px-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              ITA
            </div>
            <span className="font-semibold text-foreground">Manager</span>
          </div>

          <nav className="ml-6 flex gap-1" aria-label="Navigation principale">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/organisation/organigramme" className="gap-2">
                <Building2 className="size-4" aria-hidden="true" />
                Organigramme
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/organisation/services" className="gap-2">
                <FileText className="size-4" aria-hidden="true" />
                Services
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/organisation/postes" className="gap-2">
                <Briefcase className="size-4" aria-hidden="true" />
                Postes
              </Link>
            </Button>
          </nav>

          <div className="ml-auto">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/securite/2fa">Profil</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1">{children}</main>

      {/* Pied de page simple */}
      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          ITA Manager v0.2.0 (M1) · Ingénierie &amp; Travaux SARL
        </div>
      </footer>
    </div>
  );
}
