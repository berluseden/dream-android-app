import { useAdminSettings, useUpdateAdminSettings } from '@/hooks/useAdminSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminSettings() {
  const { data: settings, isLoading } = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!settings) return null;

  const handleToggle = (key: keyof typeof settings, subkey: string, value: boolean) => {
    const currentValue = settings[key];
    if (typeof currentValue === 'object' && currentValue !== null) {
      updateSettings.mutate({
        [key]: {
          ...(currentValue as Record<string, any>),
          [subkey]: value,
        },
      });
    }
  };

  const handleChange = (key: keyof typeof settings, value: any) => {
    updateSettings.mutate({
      [key]: value,
    });
  };

  const handleNestedChange = (key: keyof typeof settings, subkey: string, value: any) => {
    const currentValue = settings[key];
    if (typeof currentValue === 'object' && currentValue !== null) {
      updateSettings.mutate({
        [key]: {
          ...(currentValue as Record<string, any>),
          [subkey]: value,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuración Global</h2>
        <p className="text-muted-foreground">
          Ajusta la configuración del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>
            Activa o desactiva funcionalidades del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Permitir Registro</Label>
              <p className="text-sm text-muted-foreground">
                Permite que nuevos usuarios se registren en el sistema
              </p>
            </div>
            <Switch
              checked={settings.feature_flags.allow_signup}
              onCheckedChange={(checked) =>
                handleToggle('feature_flags', 'allow_signup', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Coaches Pueden Crear Ejercicios</Label>
              <p className="text-sm text-muted-foreground">
                Permite que los coaches creen ejercicios personalizados
              </p>
            </div>
            <Switch
              checked={settings.feature_flags.coach_can_create_exercises}
              onCheckedChange={(checked) =>
                handleToggle('feature_flags', 'coach_can_create_exercises', checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unidades por Defecto</CardTitle>
          <CardDescription>
            Configuración de unidades predeterminadas para nuevos usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Sistema de Unidades</Label>
            <Select
              value={settings.units_default}
              onValueChange={(value) => handleChange('units_default', value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                <SelectItem value="lb">Libras (lb)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Límites de Escritura</CardTitle>
          <CardDescription>
            Configura límites para prevenir abuso del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Sets por Minuto</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Máximo número de sets que un usuario puede registrar por minuto
            </p>
            <Input
              type="number"
              value={settings.write_limits.sets_per_minute}
              onChange={(e) =>
                handleNestedChange('write_limits', 'sets_per_minute', parseInt(e.target.value))
              }
              className="w-[200px]"
              min={1}
              max={1000}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
