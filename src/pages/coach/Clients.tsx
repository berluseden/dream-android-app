import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Calendar, Dumbbell, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCoachClients } from '@/hooks/useCoaches';
import { useWeeklyVolume, useAdherence } from '@/hooks/useStats';
import { useActiveMesocycle } from '@/hooks/useMesocycles';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function ClientCard({ clientId }: { clientId: string }) {
  const { data: weeklyVolume = 0 } = useWeeklyVolume(clientId);
  const { data: adherence = 0 } = useAdherence(clientId);
  const { data: activeMeso } = useActiveMesocycle(clientId);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {clientId.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">Cliente {clientId.substring(0, 8)}</h3>
              <p className="text-sm text-muted-foreground">ID: {clientId}</p>
              {activeMeso && (
                <Badge variant="outline" className="mt-2">
                  {activeMeso.name}
                </Badge>
              )}
            </div>
          </div>
          <Button size="sm" variant="outline">
            Ver Detalle
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-xs text-muted-foreground">Volumen Semanal</p>
            <p className="text-lg font-bold">{weeklyVolume}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Adherencia</p>
            <p className="text-lg font-bold">{adherence}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estado</p>
            <Badge variant={activeMeso ? 'default' : 'secondary'}>
              {activeMeso ? 'Activo' : 'Sin Plan'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Clients() {
  const { data: clients = [] } = useCoachClients();
  const [activeTab, setActiveTab] = useState('all');

  const activeClients = clients.filter(c => {
    // Filtro simple, se puede mejorar con estado real
    return true;
  });

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mis Clientes</h1>
            <p className="text-muted-foreground">Gestiona tus clientes y sus programas</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Asignar Cliente
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeClients.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entrenamientos Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Adherencia Promedio</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--%</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Activos</TabsTrigger>
            <TabsTrigger value="inactive">Inactivos</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            {clients.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay clientes asignados</h3>
                  <p className="text-muted-foreground mb-4">
                    Comienza asignándote clientes para gestionar sus entrenamientos
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Asignar Primer Cliente
                  </Button>
                </CardContent>
              </Card>
            ) : (
              clients.map((client: any) => (
                <ClientCard key={client.id} clientId={client.id} />
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4 mt-6">
            {activeClients.map((client: any) => (
              <ClientCard key={client.id} clientId={client.id} />
            ))}
          </TabsContent>

          <TabsContent value="inactive" className="space-y-4 mt-6">
            <p className="text-center text-muted-foreground py-12">
              No hay clientes inactivos
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
