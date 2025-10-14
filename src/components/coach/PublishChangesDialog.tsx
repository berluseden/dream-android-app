import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useCreateVersion } from '@/hooks/useMesocycleVersions';
import { Loader2 } from 'lucide-react';

interface PublishChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mesocycleId: string;
}

export function PublishChangesDialog({
  open,
  onOpenChange,
  mesocycleId,
}: PublishChangesDialogProps) {
  const [changelog, setChangelog] = useState('');
  const [changeTypes, setChangeTypes] = useState<string[]>([]);
  const createVersion = useCreateVersion();

  const handleToggleType = (type: string) => {
    setChangeTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handlePublish = async () => {
    if (!changelog.trim() || changeTypes.length === 0) return;

    const changes = changeTypes.map(type => ({
      type: type as 'volume' | 'exercise' | 'schedule' | 'other',
      description: changelog,
    }));

    await createVersion.mutateAsync({
      mesocycle_id: mesocycleId,
      changelog,
      changes,
    });

    // Reset and close
    setChangelog('');
    setChangeTypes([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Publicar Cambios del Mesociclo</DialogTitle>
          <DialogDescription>
            Describe los cambios realizados. El cliente recibirá una notificación.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Tipo de cambios</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { id: 'volume', label: 'Volumen' },
                { id: 'exercise', label: 'Ejercicios' },
                { id: 'schedule', label: 'Calendario' },
                { id: 'other', label: 'Otros' },
              ].map(type => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.id}
                    checked={changeTypes.includes(type.id)}
                    onCheckedChange={() => handleToggleType(type.id)}
                  />
                  <Label htmlFor={type.id} className="cursor-pointer">
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="changelog">Descripción de cambios</Label>
            <Textarea
              id="changelog"
              placeholder="Ej: Aumenté el volumen de pecho en 2 series por semana y cambié las sentadillas búlgaras por hack squats"
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              rows={5}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handlePublish}
            disabled={!changelog.trim() || changeTypes.length === 0 || createVersion.isPending}
          >
            {createVersion.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publicar y Notificar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}