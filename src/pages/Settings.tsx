import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings as SettingsIcon, Bell, Moon, Ruler, Timer, TrendingUp, UserCog, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useUserSettings, useUpdateSettings } from '@/hooks/useSettings';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { data: settings } = useUserSettings();
  const updateSettings = useUpdateSettings();
  const { refreshProfile } = useAuth();
  const { toast } = useToast();

  const handleToggle = (key: string, value: boolean) => {
    updateSettings.mutate({ [key]: value });
  };

  const handleChange = (key: string, value: any) => {
    updateSettings.mutate({ [key]: value });
  };

  const handleRefreshProfile = async () => {
    await refreshProfile();
    toast({
      title: "Perfil actualizado",
      description: "Tu información se ha sincronizado correctamente",
    });
  };

  if (!settings) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <p>Cargando configuración...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">Personaliza tu experiencia de entrenamiento</p>
        </div>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
              <CardDescription>
                Gestiona cómo y cuándo recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Notificaciones Habilitadas</Label>
                <Switch
                  id="notifications"
                  checked={settings.notifications_enabled}
                  onCheckedChange={(v) => handleToggle('notifications_enabled', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notif">Notificaciones por Email</Label>
                <Switch
                  id="email-notif"
                  checked={settings.email_notifications}
                  onCheckedChange={(v) => handleToggle('email_notifications', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="workout-reminders">Recordatorios de Entrenamiento</Label>
                <Switch
                  id="workout-reminders"
                  checked={settings.workout_reminders}
                  onCheckedChange={(v) => handleToggle('workout_reminders', v)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Apariencia
              </CardTitle>
              <CardDescription>
                Personaliza la apariencia de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Tema</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(v) => handleChange('theme', v)}
                >
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Unidades
              </CardTitle>
              <CardDescription>
                Sistema de medidas preferido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="units">Sistema de Unidades</Label>
                <Select
                  value={settings.units}
                  onValueChange={(v) => handleChange('units', v)}
                >
                  <SelectTrigger id="units">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Métrico (kg, cm)</SelectItem>
                    <SelectItem value="imperial">Imperial (lb, in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Entrenamiento
              </CardTitle>
              <CardDescription>
                Configuración de sesiones de entrenamiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="rest-timer">Temporizador de Descanso</Label>
                <Switch
                  id="rest-timer"
                  checked={settings.rest_timer_enabled}
                  onCheckedChange={(v) => handleToggle('rest_timer_enabled', v)}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="rest-seconds">Descanso por Defecto (segundos)</Label>
                <Input
                  id="rest-seconds"
                  type="number"
                  value={settings.default_rest_seconds}
                  onChange={(e) => handleChange('default_rest_seconds', parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progresión
              </CardTitle>
              <CardDescription>
                Ajustes automáticos de carga y volumen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-progress">Progresión Automática de Carga</Label>
                  <p className="text-sm text-muted-foreground">
                    Sugerir automáticamente incrementos de peso
                  </p>
                </div>
                <Switch
                  id="auto-progress"
                  checked={settings.auto_progress_load}
                  onCheckedChange={(v) => handleToggle('auto_progress_load', v)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Privacidad
              </CardTitle>
              <CardDescription>
                Control de compartición de datos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="share-coach">Compartir Progreso con Coach</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir que tu coach vea tus estadísticas
                  </p>
                </div>
                <Switch
                  id="share-coach"
                  checked={settings.share_progress_with_coach}
                  onCheckedChange={(v) => handleToggle('share_progress_with_coach', v)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Sincronización
              </CardTitle>
              <CardDescription>
                Actualizar información del perfil y rol
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleRefreshProfile}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refrescar Perfil
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Usa esto si tu rol ha cambiado y no se refleja automáticamente
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
