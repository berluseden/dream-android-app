import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCog, Target, Mail, Dumbbell, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Resumen general del sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
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
    </div>
  );
}
