import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgramFilters as Filters } from '@/hooks/usePrograms';

interface ProgramFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function ProgramFilters({ filters, onFiltersChange }: ProgramFiltersProps) {
  const toggleFilter = (category: keyof Filters, value: string | number) => {
    const current = (filters[category] || []) as any[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    
    onFiltersChange({ ...filters, [category]: updated });
  };

  const resetFilters = () => {
    onFiltersChange({});
  };

  return (
    <Card className="p-4 space-y-6 sticky top-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtros</h3>
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          Limpiar
        </Button>
      </div>

      {/* Days per week */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Días por semana</Label>
        {[3, 4, 5, 6].map((days) => (
          <div key={days} className="flex items-center space-x-2">
            <Checkbox
              id={`days-${days}`}
              checked={filters.days?.includes(days)}
              onCheckedChange={() => toggleFilter('days', days)}
            />
            <Label htmlFor={`days-${days}`} className="cursor-pointer font-normal">
              {days} días
            </Label>
          </div>
        ))}
      </div>

      {/* Level */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Nivel</Label>
        {[
          { value: 'beginner', label: 'Principiante' },
          { value: 'intermediate', label: 'Intermedio' },
          { value: 'advanced', label: 'Avanzado' },
        ].map((level) => (
          <div key={level.value} className="flex items-center space-x-2">
            <Checkbox
              id={`level-${level.value}`}
              checked={filters.level?.includes(level.value)}
              onCheckedChange={() => toggleFilter('level', level.value)}
            />
            <Label htmlFor={`level-${level.value}`} className="cursor-pointer font-normal">
              {level.label}
            </Label>
          </div>
        ))}
      </div>

      {/* Equipment */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Equipamiento</Label>
        {[
          { value: 'barbell', label: 'Barra' },
          { value: 'dumbbells', label: 'Mancuernas' },
          { value: 'machines', label: 'Máquinas' },
          { value: 'bodyweight', label: 'Peso corporal' },
        ].map((eq) => (
          <div key={eq.value} className="flex items-center space-x-2">
            <Checkbox
              id={`equipment-${eq.value}`}
              checked={filters.equipment?.includes(eq.value)}
              onCheckedChange={() => toggleFilter('equipment', eq.value)}
            />
            <Label htmlFor={`equipment-${eq.value}`} className="cursor-pointer font-normal">
              {eq.label}
            </Label>
          </div>
        ))}
      </div>

      {/* Focus */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Enfoque</Label>
        {[
          { value: 'strength', label: 'Fuerza' },
          { value: 'hypertrophy', label: 'Hipertrofia' },
          { value: 'powerbuilding', label: 'Powerbuilding' },
        ].map((focus) => (
          <div key={focus.value} className="flex items-center space-x-2">
            <Checkbox
              id={`focus-${focus.value}`}
              checked={filters.focus?.includes(focus.value)}
              onCheckedChange={() => toggleFilter('focus', focus.value)}
            />
            <Label htmlFor={`focus-${focus.value}`} className="cursor-pointer font-normal">
              {focus.label}
            </Label>
          </div>
        ))}
      </div>
    </Card>
  );
}