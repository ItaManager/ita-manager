import { Suspense } from "react";
import { ListeDirections } from "./_components/liste-directions";
import { SqueletteDirections } from "./_components/squelette-directions";

export const metadata = {
  title: "Directions — ITA Manager",
};

export default function PageDirections() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Directions</h1>
        <p className="text-sm text-muted-foreground">
          Quatre directions pilotent l'organisation — création réservée au Super
          Admin
        </p>
      </div>

      <Suspense fallback={<SqueletteDirections />}>
        <ListeDirections />
      </Suspense>
    </div>
  );
}
