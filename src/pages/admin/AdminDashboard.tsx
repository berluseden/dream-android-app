import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, UserCog, Target, Mail, Dumbbell, FileText, AlertCircle, Clock, UserX, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: auditLogs } = useAuditLogs({ limit: 5 });
  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: async () => {
      const [usersSnap, rolesSnap, mesocyclesSnap, invitationsSnap, exercisesSnap, templatesSnap] =
        await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(query(collection(db, 'user_roles'), where('role', '==', 'coach'))),
          getDocs(query(collection(db, 'mesocycles'), where('status', '==', 'active'))),
          getDocs(query(collection(db, 'invitations'), where('status', '==', 'pending'))),
          getDocs(collection(db, 'exercises')),
          getDocs(collection(db, 'templates')),
        ]);

      return {
        total_users: usersSnap.size,
        total_coaches: rolesSnap.size,
        active_mesocycles: mesocyclesSnap.size,
        pending_invitations: invitationsSnap.size,
        total_exercises: exercisesSnap.size,
        total_templates: templatesSnap.size,
      };
    },
  });

  const metricCards = [
    {
      title: 'Total Usuarios',
      value: metrics?.total_users || 0,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Coaches Activos',
      value: metrics?.total_coaches || 0,
      icon: UserCog,
      color: 'text-green-500',
    },
    {
      title: 'Mesociclos Activos',
      value: metrics?.active_mesocycles || 0,
      icon: Target,
      color: 'text-purple-500',
    },
    {
      title: 'Invitaciones Pendientes',
      value: metrics?.pending_invitations || 0,
      icon: Mail,
      color: 'text-yellow-500',
    },
    {
      title: 'Ejercicios',
      value: metrics?.total_exercises || 0,
      icon: Dumbbell,
      color: 'text-red-500',
    },
    {
      title: 'Plantillas',
      value: metrics?.total_templates || 0,
      icon: FileText,
      color: 'text-indigo-500',
    },
  ];

  const alerts = [
    ...(metrics && metrics.pending_invitations > 5 ? [{
      type: 'warning' as const,
      icon: Mail,
      title: 'Invitaciones pendientes',
      description: `${metrics.pending_invitations} invitaciones sin responder`,
      action: () => navigate('/admin/invitations')
    }] : []),
    ...(metrics && metrics.total_coaches > 0 ? [{
      type: 'info' as const,
      icon: UserCog,
      title: 'Coaches activos',
      description: `${metrics.total_coaches} coaches gestionando clientes`,
      action: () => navigate('/admin/coaches')
    }] : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Resumen general del sistema
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => navigate('/admin/users')} variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Gestionar Usuarios
        </Button>
        <Button onClick={() => navigate('/admin/invitations')} variant="outline" size="sm">
          <Mail className="h-4 w-4 mr-2" />
          Enviar Invitación
        </Button>
        <Button onClick={() => navigate('/admin/audit')} variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-2" />
          Ver Audit Log
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metricCards.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <Card 
              key={metric.title}
              className="animate-scale-in hover-scale"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{metric.value}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>Últimas acciones administrativas</CardDescription>
          </CardHeader>
          <CardContent>
            {!auditLogs || auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
            ) : (
              <div className="space-y-3">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                    <Badge variant="outline" className="mt-0.5">
                      {log.action}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{log.actor_email}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(log.ts.toDate(), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="link" 
                  className="w-full" 
                  onClick={() => navigate('/admin/audit')}
                >
                  Ver todo el historial →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Alertas
            </CardTitle>
            <CardDescription>Requieren tu atención</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Todo en orden - no hay alertas
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, idx) => {
                  const Icon = alert.icon;
                  return (
                    <div 
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={alert.action}
                    >
                      <Icon className={`h-5 w-5 mt-0.5 ${
                        alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
