import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ProgramTemplate } from '@/hooks/usePrograms';
import { Clock, Target } from 'lucide-react';

interface ProgramPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: ProgramTemplate | null;
  onUse: () => void;
}

export function ProgramPreviewModal({
  open,
  onOpenChange,
  program,
  onUse,
}: ProgramPreviewModalProps) {
  if (!program) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{program.name}</DialogTitle>
          <DialogDescription>{program.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick stats */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{program.days_per_week} días/semana</Badge>
            <Badge variant="outline">{program.weeks} semanas</Badge>
            <Badge variant="outline">{program.split}</Badge>
            {program.level && (
              <Badge variant="secondary">
                {program.level === 'beginner' && 'Principiante'}
                {program.level === 'intermediate' && 'Intermedio'}
                {program.level === 'advanced' && 'Avanzado'}
              </Badge>
            )}
          </div>

          {/* Sessions preview */}
          <Tabs defaultValue="session-0">
            <TabsList className="grid w-full grid-cols-4">
              {program.sessions.slice(0, 4).map((session, idx) => (
                <TabsTrigger key={idx} value={`session-${idx}`}>
                  {session.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {program.sessions.slice(0, 4).map((session, idx) => (
              <TabsContent key={idx} value={`session-${idx}`} className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>{session.blocks?.length || 0} ejercicios</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>~{Math.ceil((session.blocks?.length || 0) * 5)} min</span>
                  </div>
                </div>

                {session.blocks?.map((block: any, blockIdx: number) => (
                  <Card key={blockIdx}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{block.exercise_name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {block.sets} × {block.rep_range_min}-{block.rep_range_max} reps
                            {' · '}
                            RIR {block.rir_target}
                            {' · '}
                            Descanso {block.rest_seconds}s
                          </p>
                        </div>
                        <Badge variant="outline">
                          {block.sets} series
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={onUse}>
            Usar Este Programa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}