import { Button } from "@/components/ui/button";

// Placeholder temporaire — vérification du thème (0.1). Remplacé par
// l'écran d'accueil réel en 0.6.
export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold text-primary">ITA Manager</h1>
      <Button>Bouton primaire</Button>
      <Button className="bg-attention text-attention-foreground hover:bg-attention-hover">
        Bouton attention
      </Button>
      <span className="statut statut-succes">Statut de test</span>
    </div>
  );
}
