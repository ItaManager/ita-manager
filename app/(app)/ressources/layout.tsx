import { NavigationLogistique } from "./_components/navigation-logistique";

export default function RessourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-1">
          Logistique
        </h1>
        <p className="text-sm text-muted-foreground">
          Module M13 — Gestion du matériel
        </p>
      </div>

      <NavigationLogistique />

      {children}
    </div>
  );
}
