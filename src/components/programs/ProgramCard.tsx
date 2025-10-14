import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Users, Eye } from 'lucide-react';
import { ProgramTemplate } from '@/hooks/usePrograms';

interface ProgramCardProps {
  program: ProgramTemplate;
  onPreview: (program: ProgramTemplate) => void;
  onUse: (program: ProgramTemplate) => void;
}

export function ProgramCard({ program, onPreview, onUse }: ProgramCardProps) {
  const levelColors = {
    beginner: 'bg-green-500/10 text-green-700 dark:text-green-400',
    intermediate: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    advanced: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  };

  const levelColor = levelColors[program.level as keyof typeof levelColors] || 'bg-muted';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg line-clamp-2">{program.name}</h3>
            {program.level && (
              <Badge className={levelColor}>
                {program.level === 'beginner' && 'Principiante'}
                {program.level === 'intermediate' && 'Intermedio'}
                {program.level === 'advanced' && 'Avanzado'}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {program.description}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            {program.rating_avg ? (
              <>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{program.rating_avg.toFixed(1)}</span>
                <span className="text-xs">({program.rating_count || 0})</span>
              </>
            ) : (
              <span className="text-xs">Sin calificaciones</span>
            )}
          </div>
          {program.times_used && program.times_used > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{program.times_used}</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{program.days_per_week} días/semana</Badge>
          <Badge variant="outline">{program.weeks} semanas</Badge>
          {program.focus && (
            <Badge variant="outline">
              {program.focus === 'hypertrophy' && '🏋️ Hipertrofia'}
              {program.focus === 'strength' && '💪 Fuerza'}
              {program.focus === 'powerbuilding' && '⚡ Powerbuilding'}
            </Badge>
          )}
        </div>

        {/* Equipment */}
        {program.required_equipment && program.required_equipment.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {program.required_equipment.slice(0, 3).map((eq) => (
              <Badge key={eq} variant="secondary" className="text-xs">
                {eq}
              </Badge>
            ))}
            {program.required_equipment.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{program.required_equipment.length - 3} más
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => onPreview(program)}>
          <Eye className="mr-2 h-4 w-4" />
          Vista Previa
        </Button>
        <Button className="flex-1" onClick={() => onUse(program)}>
          Usar Programa
        </Button>
      </CardFooter>
    </Card>
  );
}