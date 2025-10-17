import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notify } from '@/lib/notifications';
import { Loader2 } from 'lucide-react';

interface CreateSupersetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutId: string;
  availableSets: {
    id: string;
    exerciseName: string;
    setNumber: number;
    superset_group_id?: string;
  }[];
}

/**
 * Diálogo para crear superseries/supersets
 * Permite agrupar 2-3 ejercicios para ejecutarlos consecutivamente sin descanso
 */
export function CreateSupersetDialog({
  open,
  onOpenChange,
  workoutId,
  availableSets,
}: CreateSupersetDialogProps) {
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Filtrar sets que no estén ya en una superserie
  const unassignedSets = availableSets.filter(set => !set.superset_group_id);

  const createSupersetMutation = useMutation({
    mutationFn: async (setIds: string[]) => {
      if (setIds.length < 2) {
        throw new Error('Debes seleccionar al menos 2 ejercicios');
      }
      if (setIds.length > 3) {
        throw new Error('Un superset no puede tener más de 3 ejercicios');
      }

      // Generar ID único para el grupo de superserie
      const supersetGroupId = `superset_${Date.now()}`;

      // Actualizar todos los sets seleccionados con el mismo superset_group_id
      const batch = writeBatch(db);
      
      setIds.forEach(setId => {
        const setRef = doc(db, 'sets', setId);
        batch.update(setRef, {
          superset_group_id: supersetGroupId,
        });
      });

      await batch.commit();

      return supersetGroupId;
    },
    onSuccess: (supersetGroupId) => {
      notify.success(
        'Superserie creada',
        `Ejercicios agrupados en ${supersetGroupId}`
      );
      queryClient.invalidateQueries({ queryKey: ['workout-sets', workoutId] });
      setSelectedSets([]);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      notify.error('Error al crear superserie', error.message);
    },
  });

  const handleSetSelection = (setId: string, position: 'first' | 'second' | 'third') => {
    const newSelection = [...selectedSets];
    
    if (position === 'first') {
      newSelection[0] = setId;
    } else if (position === 'second') {
      newSelection[1] = setId;
    } else {
      newSelection[2] = setId;
    }
    
    setSelectedSets(newSelection.filter(Boolean)); // Eliminar undefined
  };

  const handleRemoveThird = () => {
    setSelectedSets(prev => prev.slice(0, 2));
  };

  const handleSubmit = () => {
    createSupersetMutation.mutate(selectedSets);
  };

  const canAddThird = selectedSets.length === 2;
  const canSubmit = selectedSets.length >= 2 && selectedSets.length <= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Superserie</DialogTitle>
          <DialogDescription>
            Agrupa 2 o 3 ejercicios para ejecutarlos consecutivamente sin descanso.
            Ideal para antagonistas (ej: pecho + espalda) o agonistas (ej: bíceps + tríceps).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Primer ejercicio */}
          <div className="space-y-2">
            <Label htmlFor="first-exercise">Primer Ejercicio *</Label>
            <Select
              value={selectedSets[0] || ''}
              onValueChange={(value) => handleSetSelection(value, 'first')}
            >
              <SelectTrigger id="first-exercise">
                <SelectValue placeholder="Selecciona un ejercicio" />
              </SelectTrigger>
              <SelectContent>
                {unassignedSets.map(set => (
                  <SelectItem
                    key={set.id}
                    value={set.id}
                    disabled={selectedSets.includes(set.id)}
                  >
                    {set.exerciseName} (Serie {set.setNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Segundo ejercicio */}
          <div className="space-y-2">
            <Label htmlFor="second-exercise">Segundo Ejercicio *</Label>
            <Select
              value={selectedSets[1] || ''}
              onValueChange={(value) => handleSetSelection(value, 'second')}
              disabled={!selectedSets[0]}
            >
              <SelectTrigger id="second-exercise">
                <SelectValue placeholder="Selecciona un ejercicio" />
              </SelectTrigger>
              <SelectContent>
                {unassignedSets.map(set => (
                  <SelectItem
                    key={set.id}
                    value={set.id}
                    disabled={selectedSets.includes(set.id)}
                  >
                    {set.exerciseName} (Serie {set.setNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tercer ejercicio (opcional) */}
          {canAddThird ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="third-exercise">Tercer Ejercicio (opcional)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveThird}
                  className="h-6 text-xs"
                >
                  Remover
                </Button>
              </div>
              <Select
                value={selectedSets[2] || ''}
                onValueChange={(value) => handleSetSelection(value, 'third')}
              >
                <SelectTrigger id="third-exercise">
                  <SelectValue placeholder="Selecciona un ejercicio (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedSets.map(set => (
                    <SelectItem
                      key={set.id}
                      value={set.id}
                      disabled={selectedSets.includes(set.id)}
                    >
                      {set.exerciseName} (Serie {set.setNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {/* Info sobre el orden de ejecución */}
          {selectedSets.length >= 2 && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Orden de ejecución:
              </p>
              <ol className="list-decimal list-inside text-blue-700 dark:text-blue-300 space-y-1">
                {selectedSets.map((setId, index) => {
                  const set = availableSets.find(s => s.id === setId);
                  return (
                    <li key={setId}>
                      {set?.exerciseName} (Serie {set?.setNumber})
                    </li>
                  );
                })}
              </ol>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                💡 Los ejercicios se ejecutarán sin descanso entre ellos.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createSupersetMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || createSupersetMutation.isPending}
          >
            {createSupersetMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear Superserie'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
