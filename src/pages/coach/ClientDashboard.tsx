import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientAdherenceChart } from '@/components/coach/ClientAdherenceChart';
import { VolumeHeatmap } from '@/components/coach/VolumeHeatmap';
import { FatigueAlerts } from '@/components/coach/FatigueAlerts';
import { ClientPRsList } from '@/components/coach/ClientPRsList';
import { PublishChangesDialog } from '@/components/coach/PublishChangesDialog';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Settings, TrendingUp, AlertCircle } from 'lucide-react';
import { useActiveMesocycle } from '@/hooks/useMesocycles';

export default function ClientDashboard() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const { data: activeMesocycle } = useActiveMesocycle(clientId || '');

  if (!clientId) {
    return null;
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/coach/clients')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Dashboard del Cliente</h1>
              <p className="text-muted-foreground">
                Monitoreo y análisis de progreso
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPublishDialog(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Ajustar Programa
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Adherencia 4 sem</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">---%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volumen Semanal</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--- sets</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Fatiga</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PRs (30 días)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="volume">Análisis de Volumen</TabsTrigger>
            <TabsTrigger value="fatigue">Señales de Fatiga</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ClientAdherenceChart clientId={clientId} weeks={8} />
              <ClientPRsList clientId={clientId} days={30} />
            </div>
            <FatigueAlerts clientId={clientId} />
          </TabsContent>

          <TabsContent value="volume" className="space-y-4 mt-6">
            {activeMesocycle ? (
              <VolumeHeatmap clientId={clientId} mesocycleId={activeMesocycle.id} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No hay mesociclo activo
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="fatigue" className="space-y-4 mt-6">
            <FatigueAlerts clientId={clientId} />
          </TabsContent>

          <TabsContent value="performance" className="space-y-4 mt-6">
            <ClientPRsList clientId={clientId} days={60} />
          </TabsContent>
        </Tabs>

        {/* Publish Changes Dialog */}
        {activeMesocycle && (
          <PublishChangesDialog
            open={showPublishDialog}
            onOpenChange={setShowPublishDialog}
            mesocycleId={activeMesocycle.id}
          />
        )}
      </div>
    </AppLayout>
  );
}