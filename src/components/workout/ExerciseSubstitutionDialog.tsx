import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useSuggestedSubstitutions, useSubstituteExercise } from '@/hooks/useExerciseSubstitution';
import { getSubstitutionReasons } from '@/lib/exerciseMatching';

interface ExerciseSubstitutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutId: string;
  exerciseId: string;
  exerciseName: string;
}

export function ExerciseSubstitutionDialog({
  open,
  onOpenChange,
  workoutId,
  exerciseId,
  exerciseName,
}: ExerciseSubstitutionDialogProps) {
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: suggestions, isLoading } = useSuggestedSubstitutions(exerciseId);
  const substituteExercise = useSubstituteExercise();
  
  const reasons = getSubstitutionReasons();

  const filteredSuggestions = suggestions?.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubstitute = async () => {
    if (!selectedExerciseId || !reason) return;

    await substituteExercise.mutateAsync({
      workout_id: workoutId,
      original_exercise_id: exerciseId,
      new_exercise_id: selectedExerciseId,
      reason,
      notes,
    });

    // Reset and close
    setSelectedExerciseId('');
    setReason('');
    setNotes('');
    setSearchTerm('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sustituir Ejercicio</DialogTitle>
          <DialogDescription>
            Sustituyendo: <strong>{exerciseName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div>
            <Label htmlFor="search">Buscar ejercicio</Label>
            <Input
              id="search"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Suggestions */}
          <div>
            <Label>Ejercicios similares sugeridos</Label>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 mt-2 max-h-60 overflow-y-auto">
                {filteredSuggestions?.map((exercise) => (
                  <div
                    key={exercise.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedExerciseId === exercise.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedExerciseId(exercise.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{exercise.name}</span>
                          {exercise.is_compound && (
                            <Badge variant="secondary" className="text-xs">
                              Compuesto
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2 mt-1">
                          {exercise.equipment.map((eq) => (
                            <Badge key={eq} variant="outline" className="text-xs">
                              {eq}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {selectedExerciseId === exercise.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Motivo de sustitución</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason" className="mt-2">
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Agrega detalles adicionales sobre la sustitución..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubstitute}
            disabled={!selectedExerciseId || !reason || substituteExercise.isPending}
          >
            {substituteExercise.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Sustitución
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}