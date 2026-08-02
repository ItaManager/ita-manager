import { listerParametres } from "@/lib/actions/administration";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Lock } from "lucide-react";
import { BoutonModifierParametre } from "./bouton-modifier-parametre";

export async function ListeParametres() {
  const groupes = await listerParametres();
  const groupesArray = Object.entries(groupes);

  return (
    <div className="space-y-6">
      {groupesArray.map(([groupe, parametres]) => (
        <Card key={groupe}>
          <CardHeader className="border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="size-5" aria-hidden="true" />
              {groupe}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y">
              {parametres.map((param) => {
                const estVerrouille =
                  param.cle === "format.matricule" ||
                  param.cle === "codes.roles";

                return (
                  <div
                    key={param.id}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
                  >
                    {/* Icône */}
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                        estVerrouille
                          ? "bg-destructive-soft text-destructive dark:bg-destructive dark:text-destructive"
                          : "bg-primary-soft text-primary dark:bg-primary dark:text-primary"
                      }`}
                    >
                      {estVerrouille ? (
                        <Lock className="size-5" aria-hidden="true" />
                      ) : (
                        <Settings className="size-5" aria-hidden="true" />
                      )}
                    </div>

                    {/* Informations */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {param.libelle}
                        </p>
                        {estVerrouille && (
                          <Badge variant="destructive" className="text-xs">
                            Verrouillé
                          </Badge>
                        )}
                        <Badge variant="outline" className="font-mono text-xs">
                          {param.type}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground font-mono">
                        {param.cle} = {param.valeur}
                      </p>

                      {param.aide && (
                        <p className="text-xs text-muted-foreground italic">
                          {param.aide}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {!estVerrouille && (
                      <BoutonModifierParametre parametre={param} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
