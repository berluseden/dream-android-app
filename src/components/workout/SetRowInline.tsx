import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlateCalculator } from './PlateCalculator';

interface SetRowInlineProps {
  setNumber: number;
  setType: 'warmup' | 'working' | 'dropset' | 'backoff';
  targetReps?: number;
  targetRir?: number;
  suggestedLoad?: number;
  suggestedReps?: number;
  onComplete: (data: {
    load: number;
    reps: number;
    rir: number;
    rpe: number;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function SetRowInline({
  setNumber,
  setType,
  targetReps,
  targetRir,
  suggestedLoad = 0,
  suggestedReps = 10,
  onComplete,
  isLoading = false,
}: SetRowInlineProps) {
  const [load, setLoad] = useState(suggestedLoad);
  const [reps, setReps] = useState(suggestedReps);
  const [rir, setRir] = useState(targetRir || 2);
  const [rpe, setRpe] = useState(8);
  const [showPlateCalc, setShowPlateCalc] = useState(false);

  const handleSubmit = async () => {
    if (load <= 0 || reps <= 0) return;
    await onComplete({ load, reps, rir, rpe });
  };

  const isWarmup = setType === 'warmup';

  return (
    <>
      <div className={cn(
        "grid grid-cols-[auto_1fr_80px_100px_auto] gap-2 items-center p-3 rounded-lg border",
        isWarmup && "bg-cyan-500/5 border-cyan-500/20"
      )}>
        {/* Set Number */}
        <div className="flex items-center gap-2">
          {isWarmup ? (
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20">
              W
            </Badge>
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">
              {setNumber}
            </div>
          )}
        </div>

        {/* Target */}
        <div className="text-sm text-muted-foreground">
          {targetReps && targetRir !== undefined ? (
            <span>{targetReps}+ reps @RIR {targetRir}</span>
          ) : (
            <span>—</span>
          )}
        </div>

        {/* Reps Input */}
        <Input
          type="number"
          value={reps}
          onChange={(e) => setReps(parseInt(e.target.value) || 0)}
          placeholder="Reps"
          className="text-center"
          disabled={isLoading}
        />

        {/* Load Input with Plate Calculator */}
        <div className="flex gap-1">
          <Input
            type="number"
            value={load}
            onChange={(e) => setLoad(parseFloat(e.target.value) || 0)}
            placeholder="kg"
            step="2.5"
            className="text-center"
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowPlateCalc(true)}
            disabled={isLoading}
            className="h-10 w-10 shrink-0"
          >
            <Calculator className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick RIR/RPE */}
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((value) => (
              <button
                key={value}
                onClick={() => setRir(value)}
                className={cn(
                  "w-7 h-7 rounded text-xs font-medium transition-colors",
                  rir === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
                disabled={isLoading}
              >
                {value}
              </button>
            ))}
          </div>
          <span className="text-xs text-center text-muted-foreground">RIR</span>
        </div>

        {/* Submit Button */}
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={isLoading || load <= 0 || reps <= 0}
          className="ml-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Plate Calculator Dialog */}
      <PlateCalculator
        open={showPlateCalc}
        onOpenChange={setShowPlateCalc}
        currentLoad={load}
        onApply={setLoad}
      />
    </>
  );
}
