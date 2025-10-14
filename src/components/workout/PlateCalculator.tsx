import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePlateCalculator } from '@/hooks/usePlateCalculator';
import { Calculator, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlateCalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLoad: number;
  onApply: (load: number) => void;
}

export function PlateCalculator({ open, onOpenChange, currentLoad, onApply }: PlateCalculatorProps) {
  const [targetLoad, setTargetLoad] = useState(currentLoad);
  const { calculatePlates, formatPlateDisplay, preferences } = usePlateCalculator();
  
  const result = calculatePlates(targetLoad);
  const totalLoad = preferences.bar_weight + (result.perSide * 2);

  const handleApply = () => {
    onApply(totalLoad);
    onOpenChange(false);
  };

  const quickAdjust = (amount: number) => {
    setTargetLoad(prev => Math.max(preferences.bar_weight, prev + amount));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Calculadora de Placas
          </DialogTitle>
          <DialogDescription>
            Calcula la combinación de placas para tu carga objetivo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Target Load Input */}
          <div className="space-y-2">
            <Label htmlFor="target">Carga Objetivo (kg)</Label>
            <div className="flex gap-2">
              <Input
                id="target"
                type="number"
                step="2.5"
                value={targetLoad}
                onChange={(e) => setTargetLoad(parseFloat(e.target.value) || preferences.bar_weight)}
                className="text-center text-lg font-bold"
              />
            </div>
          </div>

          {/* Quick Adjust Buttons */}
          <div className="flex gap-2 justify-center">
            {[-10, -5, -2.5, 2.5, 5, 10].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => quickAdjust(amount)}
                className="text-xs"
              >
                {amount > 0 ? '+' : ''}{amount}
              </Button>
            ))}
          </div>

          {/* Bar Info */}
          <div className="rounded-lg bg-muted p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Barra:</span>
              <span className="font-medium">{preferences.bar_weight}kg ({preferences.bar_type})</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Por lado:</span>
              <span className="font-bold text-primary">{result.perSide}kg</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold text-lg">{totalLoad}kg</span>
            </div>
          </div>

          {/* Plate Combination */}
          {result.plates.length > 0 ? (
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">Por lado (desde afuera hacia adentro):</Label>
              <div className="space-y-2">
                {result.plates.map(({ weight, count }) => (
                  <div
                    key={weight}
                    className="flex items-center gap-3 p-2 rounded-lg bg-card border"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm",
                      weight >= 20 && "bg-destructive text-destructive-foreground",
                      weight >= 10 && weight < 20 && "bg-primary text-primary-foreground",
                      weight >= 5 && weight < 10 && "bg-success text-success-foreground",
                      weight < 5 && "bg-muted text-muted-foreground"
                    )}>
                      {weight}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{count}× placas de {weight}kg</div>
                      <div className="text-xs text-muted-foreground">{count * weight}kg total</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {!result.isExact && (
                <div className="text-xs text-warning bg-warning-light p-2 rounded">
                  ⚠️ Aproximado: faltan {((targetLoad - preferences.bar_weight) / 2 - result.perSide).toFixed(2)}kg por lado
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              Solo barra, sin placas
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleApply} className="flex-1">
            <Check className="h-4 w-4 mr-2" />
            Aplicar {totalLoad}kg
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
