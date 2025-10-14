import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TrendingUp, Plus, Minus, Lightbulb } from 'lucide-react';

interface LoadSuggestion {
  load: number;
  reps: number;
  reason: string;
  explanation: string;
  alternative: {
    load: number;
    reps: number;
    reason: string;
  } | null;
}

interface AlgorithmExplanationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion: LoadSuggestion;
  onSelectOption: (option: 'primary' | 'alternative') => void;
}

export function AlgorithmExplanationDialog({
  open,
  onOpenChange,
  suggestion,
  onSelectOption,
}: AlgorithmExplanationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            ¿Por qué esta sugerencia?
          </DialogTitle>
          <DialogDescription>
            Nuestro algoritmo analiza tu historial reciente para optimizar tu progreso
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Explicación detallada */}
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm leading-relaxed">{suggestion.explanation}</p>
          </div>

          {/* Opción principal */}
          <Card className="border-2 border-primary">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Opción A (Recomendada)</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-2xl font-bold">
                <span>{suggestion.load} kg</span>
                <span className="text-muted-foreground">×</span>
                <span>{suggestion.reps} reps</span>
              </div>
              <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
              <Button 
                className="w-full" 
                onClick={() => {
                  onSelectOption('primary');
                  onOpenChange(false);
                }}
              >
                Usar esta opción
              </Button>
            </div>
          </Card>

          {/* Opción alternativa */}
          {suggestion.alternative && (
            <Card className="border">
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  <span className="font-semibold">Opción B (Alternativa)</span>
                </div>
                <div className="flex items-center gap-4 text-2xl font-bold">
                  <span>{suggestion.alternative.load} kg</span>
                  <span className="text-muted-foreground">×</span>
                  <span>{suggestion.alternative.reps} reps</span>
                </div>
                <p className="text-sm text-muted-foreground">{suggestion.alternative.reason}</p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    onSelectOption('alternative');
                    onOpenChange(false);
                  }}
                >
                  Usar alternativa
                </Button>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}