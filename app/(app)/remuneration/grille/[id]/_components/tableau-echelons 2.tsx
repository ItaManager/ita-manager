import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableauEchelonsProps {
  echelons: Array<{
    id: string;
    niveau: "DIRECTION" | "CADRE" | "SUPPORT" | "OPERATIONNEL";
    min: { toString: () => string } | number;
    med: { toString: () => string } | number;
    max: { toString: () => string } | number;
  }>;
}

const NIVEAU_LABELS: Record<string, string> = {
  DIRECTION: "Direction",
  CADRE: "Cadre",
  SUPPORT: "Support",
  OPERATIONNEL: "Opérationnel",
};

export function TableauEchelons({ echelons }: TableauEchelonsProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Niveau hiérarchique</TableHead>
          <TableHead className="text-right">Minimum</TableHead>
          <TableHead className="text-right">Médiane</TableHead>
          <TableHead className="text-right">Maximum</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {echelons.map((echelon) => {
          const min = Number(echelon.min);
          const med = Number(echelon.med);
          const max = Number(echelon.max);

          return (
            <TableRow key={echelon.id}>
              <TableCell className="font-medium">
                {NIVEAU_LABELS[echelon.niveau] || echelon.niveau}
              </TableCell>
              <TableCell className="text-right">
                {min.toLocaleString("fr-FR")} FCFA
              </TableCell>
              <TableCell className="text-right font-medium">
                {med.toLocaleString("fr-FR")} FCFA
              </TableCell>
              <TableCell className="text-right">
                {max.toLocaleString("fr-FR")} FCFA
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
