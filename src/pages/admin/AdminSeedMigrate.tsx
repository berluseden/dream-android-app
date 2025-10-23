import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSeedCatalogs, useTriggerBackup, useReindexFields } from '@/hooks/useBackups';
import { Database, FileDown, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminSeedMigrate() {
  const [lastAction, setLastAction] = useState<string | null>(null);
  const seedCatalogs = useSeedCatalogs();
  const triggerBackup = useTriggerBackup();
  const reindexFields = useReindexFields();

  const handleSeed = async () => {
    setLastAction('seed');
    await seedCatalogs.mutateAsync();
  };

  const handleBackup = async (scope: 'catalogs' | 'users' | 'all') => {
    setLastAction('backup');
    await triggerBackup.mutateAsync(scope);
  };

  const handleReindex = async () => {
    setLastAction('reindex');
    await reindexFields.mutateAsync();
  };

  const isLoading = seedCatalogs.isPending || triggerBackup.isPending || reindexFields.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Semillas y Migración</h2>
        <p className="text-muted-foreground">
          Ejecuta tareas de mantenimiento y migración de datos
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Estas operaciones pueden tardar varios minutos. Asegúrate de hacer un backup antes de ejecutar migraciones.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Migración de Templates</CardTitle>
          <CardDescription>
            Migra todos los programas locales (JSON) a Firestore con IDs reales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta operación creará documentos en la colección 'templates' de Firestore.
              Ejecuta esto ANTES de crear mesociclos para que los programas tengan IDs consistentes.
            </AlertDescription>
          </Alert>
          <Button
            onClick={handleSeed}
            disabled={isLoading}
            className="w-full"
          >
            <Database className="mr-2 h-4 w-4" />
            {seedCatalogs.isPending ? 'Migrando Templates...' : 'Migrar Templates a Firestore'}
          </Button>
          {seedCatalogs.isSuccess && lastAction === 'seed' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                ✅ Migración completada. Todos los programas ahora tienen IDs reales en Firestore.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backups</CardTitle>
          <CardDescription>
            Crea copias de seguridad de las colecciones del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              onClick={() => handleBackup('catalogs')}
              disabled={isLoading}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Backup Catálogos
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBackup('users')}
              disabled={isLoading}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Backup Usuarios
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBackup('all')}
              disabled={isLoading}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Backup Completo
            </Button>
          </div>
          {triggerBackup.isSuccess && lastAction === 'backup' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Backup iniciado exitosamente
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reindexación</CardTitle>
          <CardDescription>
            Recalcula campos computados y estadísticas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Actualiza el conteo de clientes por coach y otros campos derivados.
          </p>
          <Button
            variant="outline"
            onClick={handleReindex}
            disabled={isLoading}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {reindexFields.isPending ? 'Reindexando...' : 'Reindexar Campos Computados'}
          </Button>
          {reindexFields.isSuccess && lastAction === 'reindex' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Reindexación completada exitosamente
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
