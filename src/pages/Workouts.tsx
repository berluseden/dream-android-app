import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Workouts() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Entrenamientos</h1>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Entrenamiento
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximas Sesiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Día A - Pecho y Tríceps</h3>
                  <p className="text-sm text-muted-foreground">Hoy - 18:00</p>
                </div>
                <Badge>Pendiente</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Día B - Espalda y Bíceps</h3>
                  <p className="text-sm text-muted-foreground">Mañana - 18:00</p>
                </div>
                <Badge variant="outline">Programado</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
