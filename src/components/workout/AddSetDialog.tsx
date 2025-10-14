import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { useAddSet } from '@/hooks/useWorkouts';
import { Exercise } from '@/types/user.types';

interface AddSetDialogProps {
  workoutId: string;
  exercise: Exercise;
  setNumber: number;
  suggestedLoad?: number;
  suggestedReps?: number;
}

export function AddSetDialog({ workoutId, exercise, setNumber, suggestedLoad = 0, suggestedReps = 10 }: AddSetDialogProps) {
  const [open, setOpen] = useState(false);
  const addSet = useAddSet();
  
  const [load, setLoad] = useState(suggestedLoad);
  const [targetReps, setTargetReps] = useState(suggestedReps);
  const [completedReps, setCompletedReps] = useState(suggestedReps);
  const [rirActual, setRirActual] = useState(2);
  const [rpe, setRpe] = useState(8);
  const [pump, setPump] = useState(7);
  const [soreness, setSoreness] = useState(3);
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    await addSet.mutateAsync({
      workout_id: workoutId,
      exercise_id: exercise.id,
      set_number: setNumber,
      set_type: 'working',
      target_reps: targetReps,
      rir_target: 2,
      load,
      completed_reps: completedReps,
      rir_actual: rirActual,
      rpe,
      perceived_pump: pump,
      perceived_soreness: soreness,
      notes,
    });
    
    setOpen(false);
    // Reset form
    setLoad(suggestedLoad);
    setTargetReps(suggestedReps);
    setCompletedReps(suggestedReps);
    setRirActual(2);
    setRpe(8);
    setPump(7);
    setSoreness(3);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Serie
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{exercise.name} - Serie {setNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="load">Carga (kg)</Label>
              <Input
                id="load"
                type="number"
                value={load}
                onChange={(e) => setLoad(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="reps">Repeticiones</Label>
              <Input
                id="reps"
                type="number"
                value={completedReps}
                onChange={(e) => setCompletedReps(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>RIR (Reps en Reserva)</Label>
              <Badge>{rirActual}</Badge>
            </div>
            <Slider
              value={[rirActual]}
              onValueChange={(v) => setRirActual(v[0])}
              min={0}
              max={5}
              step={1}
            />
            <p className="text-xs text-muted-foreground mt-1">
              0 = fallo, 5 = muy fácil
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>RPE (Esfuerzo Percibido)</Label>
              <Badge>{rpe}</Badge>
            </div>
            <Slider
              value={[rpe]}
              onValueChange={(v) => setRpe(v[0])}
              min={6}
              max={10}
              step={1}
            />
            <p className="text-xs text-muted-foreground mt-1">
              6 = fácil, 10 = máximo esfuerzo
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Pump (Congestión Muscular)</Label>
              <Badge variant="secondary">{pump}</Badge>
            </div>
            <Slider
              value={[pump]}
              onValueChange={(v) => setPump(v[0])}
              min={1}
              max={10}
              step={1}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Soreness (Fatiga Residual)</Label>
              <Badge variant="secondary">{soreness}</Badge>
            </div>
            <Slider
              value={[soreness]}
              onValueChange={(v) => setSoreness(v[0])}
              min={1}
              max={10}
              step={1}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Input
              id="notes"
              placeholder="Sentimiento, técnica, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={addSet.isPending}
            className="w-full"
          >
            Guardar Serie
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
