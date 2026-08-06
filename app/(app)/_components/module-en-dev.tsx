import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ModuleEnDevProps {
  moduleNumero: string;
  moduleNom: string;
  titre: string;
}

export function ModuleEnDev({ moduleNumero, moduleNom, titre }: ModuleEnDevProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md border-warning/20 bg-warning-soft/50">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <Construction
            className="size-16 text-warning"
            aria-hidden="true"
          />
          <div>
            <Badge variant="outline" className="mb-3 border-warning text-warning">
              Module {moduleNumero} — {moduleNom}
            </Badge>
            <h2 className="text-lg font-semibold text-gray-900">Non encore livré</h2>
            <p className="mt-2 text-sm text-gray-600">
              L'entrée « {titre} » figure au menu pour que la navigation reste
              stable dès le premier jour.
            </p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Ce module sera livré dans une prochaine version
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
