import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calculator } from 'lucide-react';
import { PlatePreferences as PlatePrefsType } from '@/types/strength.types';

const AVAILABLE_PLATES = [20, 15, 10, 5, 2.5, 1.25, 0.5];

const BAR_TYPES = [
  { value: 'olympic', label: 'Olímpica', weight: 20 },
  { value: 'standard', label: 'Estándar', weight: 15 },
  { value: 'ez', label: 'EZ Bar', weight: 10 },
] as const;

interface PlatePreferencesProps {
  initialPreferences?: PlatePrefsType;
  onSave?: (preferences: PlatePrefsType) => void;
}

export function PlatePreferences({ initialPreferences, onSave }: PlatePreferencesProps) {
  const [preferences, setPreferences] = useState<PlatePrefsType>(
    initialPreferences || {
      bar_type: 'olympic',
      bar_weight: 20,
      available_plates: [20, 15, 10, 5, 2.5, 1.25],
    }
  );

  const handleBarTypeChange = (value: string) => {
    const barType = BAR_TYPES.find(b => b.value === value);
    if (barType) {
      setPreferences(prev => ({
        ...prev,
        bar_type: barType.value,
        bar_weight: barType.weight,
      }));
    }
  };

  const handlePlateToggle = (plate: number, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      available_plates: checked
        ? [...prev.available_plates, plate].sort((a, b) => b - a)
        : prev.available_plates.filter(p => p !== plate),
    }));
  };

  const handleSave = () => {
    onSave?.(preferences);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <CardTitle>Preferencias de Placas</CardTitle>
        </div>
        <CardDescription>
          Configura las placas disponibles en tu gimnasio para cálculos precisos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bar Type Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Tipo de Barra</Label>
          <RadioGroup
            value={preferences.bar_type}
            onValueChange={handleBarTypeChange}
            className="space-y-2"
          >
            {BAR_TYPES.map((bar) => (
              <div key={bar.value} className="flex items-center space-x-3">
                <RadioGroupItem value={bar.value} id={bar.value} />
                <Label htmlFor={bar.value} className="flex-1 cursor-pointer">
                  <div className="flex justify-between">
                    <span>{bar.label}</span>
                    <span className="text-muted-foreground">{bar.weight}kg</span>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        {/* Available Plates */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Placas Disponibles</Label>
          <p className="text-sm text-muted-foreground">
            Selecciona las placas que están disponibles en tu gimnasio
          </p>
          <div className="grid grid-cols-2 gap-3">
            {AVAILABLE_PLATES.map((plate) => (
              <div key={plate} className="flex items-center space-x-3">
                <Checkbox
                  id={`plate-${plate}`}
                  checked={preferences.available_plates.includes(plate)}
                  onCheckedChange={(checked) => handlePlateToggle(plate, checked as boolean)}
                />
                <Label
                  htmlFor={`plate-${plate}`}
                  className="flex-1 cursor-pointer font-medium"
                >
                  {plate}kg
                </Label>
              </div>
            ))}
          </div>
        </div>

        {onSave && (
          <>
            <Separator />
            <Button onClick={handleSave} className="w-full">
              Guardar Preferencias
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
