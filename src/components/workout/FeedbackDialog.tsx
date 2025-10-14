import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
  muscleName: string;
  onSubmit: (feedback: {
    muscle_soreness: 'never_sore' | 'healed_while_ago' | 'just_on_time' | 'still_sore';
    pump_quality: 'low' | 'moderate' | 'amazing';
    workload_feeling: 'easy' | 'pretty_good' | 'pushed_limits' | 'too_much';
    notes?: string;
  }) => void;
}

export function FeedbackDialog({
  open,
  onOpenChange,
  exerciseName,
  muscleName,
  onSubmit,
}: FeedbackDialogProps) {
  const [soreness, setSoreness] = useState<'never_sore' | 'healed_while_ago' | 'just_on_time' | 'still_sore'>('just_on_time');
  const [pump, setPump] = useState<'low' | 'moderate' | 'amazing'>('moderate');
  const [workload, setWorkload] = useState<'easy' | 'pretty_good' | 'pushed_limits' | 'too_much'>('pretty_good');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onSubmit({
      muscle_soreness: soreness,
      pump_quality: pump,
      workload_feeling: workload,
      notes: notes || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Feedback: {exerciseName}</DialogTitle>
          <p className="text-sm text-muted-foreground">{muscleName}</p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Soreness */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Dolor Muscular Residual</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'never_sore' as const, label: 'Sin dolor', color: 'bg-green-500' },
                { value: 'healed_while_ago' as const, label: 'Sanó hace tiempo', color: 'bg-blue-500' },
                { value: 'just_on_time' as const, label: 'Sanó a tiempo', color: 'bg-yellow-500' },
                { value: 'still_sore' as const, label: 'Aún adolorido', color: 'bg-red-500' },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={soreness === option.value ? 'default' : 'outline'}
                  className={cn(
                    soreness === option.value && option.color,
                    "h-auto py-3"
                  )}
                  onClick={() => setSoreness(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Pump */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Calidad del Pump</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'low' as const, label: 'Bajo', color: 'bg-red-500' },
                { value: 'moderate' as const, label: 'Moderado', color: 'bg-yellow-500' },
                { value: 'amazing' as const, label: 'Increíble', color: 'bg-green-500' },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={pump === option.value ? 'default' : 'outline'}
                  className={cn(
                    pump === option.value && option.color,
                    "h-auto py-3"
                  )}
                  onClick={() => setPump(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Workload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sensación de Carga</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'easy' as const, label: 'Fácil', color: 'bg-green-500' },
                { value: 'pretty_good' as const, label: 'Bien', color: 'bg-blue-500' },
                { value: 'pushed_limits' as const, label: 'Al límite', color: 'bg-yellow-500' },
                { value: 'too_much' as const, label: 'Demasiado', color: 'bg-red-500' },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={workload === option.value ? 'default' : 'outline'}
                  className={cn(
                    workload === option.value && option.color,
                    "h-auto py-3"
                  )}
                  onClick={() => setWorkload(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notas (opcional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Comentarios adicionales..."
              rows={3}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full">
            Guardar Feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
